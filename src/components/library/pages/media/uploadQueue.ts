import { useSyncExternalStore } from 'react';
import { mediaApi } from '../../store/services/mediaApi';
import { apiPost, uploadWithProgress } from './utils';

/**
 * The media manager's upload queue — a module-level store rather than component
 * state, so uploads keep going (and the panel keeps showing them) while you open
 * other folders, which are separate routes that remount the page.
 *
 * Files from a dropped or picked *folder* carry `segments` (their sub-path); the
 * matching folders are created once per path via /media/folders/ensure-path and
 * the file goes into the last one.
 */

export type UploadStatus = 'queued' | 'uploading' | 'done' | 'error' | 'canceled';

export type UploadItem = {
	id: string;
	file: File;
	name: string;
	/** Folder the upload was started in (null = root). */
	base: string | null;
	/** Sub-folders under `base` to create/reuse, for folder uploads. */
	segments: string[];
	status: UploadStatus;
	progress: number;
	error?: string;
};

const CONCURRENCY = 3;

let items: UploadItem[] = [];
const listeners = new Set<() => void>();
const aborts = new Map<string, () => void>();
const pathCache = new Map<string, Promise<string | null>>();
let active = 0;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
// Registered by MediaManager (useAppDispatch) — not imported, see utils.ts on the store cycle.
let dispatch: ((action: any) => void) | null = null;
export const setUploadDispatch = (d: typeof dispatch) => {
	dispatch = d;
};

const emit = () => listeners.forEach(l => l());
const patch = (id: string, change: Partial<UploadItem>) => {
	items = items.map(it => (it.id === id ? { ...it, ...change } : it));
	emit();
};

// Refresh the lists a moment after uploads land, batching bursts into one refetch.
const scheduleRefresh = () => {
	if (refreshTimer) clearTimeout(refreshTimer);
	refreshTimer = setTimeout(() => {
		dispatch?.(mediaApi.util.invalidateTags(['media', 'media-usage', 'images', 'files', 'folders', 'upload', 'uploads']));
	}, 400);
};

const resolveTarget = (item: UploadItem) => {
	if (!item.segments.length) return Promise.resolve(item.base);
	const cacheKey = `${item.base || 'root'}|${item.segments.join('/')}`;
	if (!pathCache.has(cacheKey)) {
		const p = apiPost('media/folders/ensure-path', { parent: item.base, segments: item.segments }).then(
			(r: any) => r.folder as string | null
		);
		// A failed lookup shouldn't poison the cache for a retry.
		p.catch(() => pathCache.delete(cacheKey));
		pathCache.set(cacheKey, p);
	}
	return pathCache.get(cacheKey)!;
};

const pump = () => {
	while (active < CONCURRENCY) {
		const next = items.find(it => it.status === 'queued');
		if (!next) return;
		active++;
		patch(next.id, { status: 'uploading', progress: 0, error: undefined });
		run(next).finally(() => {
			active--;
			pump();
		});
	}
};

const run = async (item: UploadItem) => {
	try {
		const folder = await resolveTarget(item);
		if (items.find(it => it.id === item.id)?.status === 'canceled') return;
		const { promise, abort } = uploadWithProgress(item.file, folder, fraction =>
			patch(item.id, { progress: fraction })
		);
		aborts.set(item.id, abort);
		await promise;
		patch(item.id, { status: 'done', progress: 1 });
		scheduleRefresh();
	} catch (e: any) {
		const current = items.find(it => it.id === item.id);
		if (current?.status !== 'canceled') patch(item.id, { status: 'error', error: e?.message || 'Upload failed' });
	} finally {
		aborts.delete(item.id);
	}
};

let seq = 0;

export const uploadQueue = {
	add(entries: { file: File; segments?: string[] }[], base: string | null) {
		if (!entries.length) return;
		const added = entries.map(({ file, segments = [] }) => ({
			id: `${Date.now()}-${seq++}`,
			file,
			name: file.name,
			base,
			segments,
			status: 'queued' as const,
			progress: 0,
		}));
		items = [...items, ...added];
		emit();
		pump();
	},
	cancel(id: string) {
		aborts.get(id)?.();
		patch(id, { status: 'canceled' });
	},
	cancelAll() {
		items.forEach(it => {
			if (it.status === 'queued' || it.status === 'uploading') uploadQueue.cancel(it.id);
		});
	},
	retry(id: string) {
		patch(id, { status: 'queued', progress: 0, error: undefined });
		pump();
	},
	retryFailed() {
		items = items.map(it => (it.status === 'error' ? { ...it, status: 'queued', progress: 0, error: undefined } : it));
		emit();
		pump();
	},
	/** Removes finished/canceled/failed rows; running uploads stay. */
	clear() {
		items = items.filter(it => it.status === 'queued' || it.status === 'uploading');
		if (!items.length) pathCache.clear();
		emit();
	},
	subscribe(listener: () => void) {
		listeners.add(listener);
		return () => listeners.delete(listener);
	},
	getSnapshot: () => items,
};

const EMPTY: UploadItem[] = [];
export const useUploadQueue = () =>
	useSyncExternalStore(uploadQueue.subscribe, uploadQueue.getSnapshot, () => EMPTY);

/**
 * Reads a drop's files, walking into dropped folders (Chrome/Edge/Safari/Firefox
 * all expose webkitGetAsEntry). Each file comes back with its folder path.
 */
export const readDroppedEntries = async (dt: DataTransfer): Promise<{ file: File; segments: string[] }[]> => {
	const entries = Array.from(dt.items || [])
		.filter(i => i.kind === 'file')
		.map(i => (i as any).webkitGetAsEntry?.())
		.filter(Boolean);

	if (!entries.length) return Array.from(dt.files || []).map(file => ({ file, segments: [] }));

	const out: { file: File; segments: string[] }[] = [];
	const walk = async (entry: any, segments: string[]): Promise<void> => {
		if (entry.isFile) {
			const file: File = await new Promise((res, rej) => entry.file(res, rej));
			if (!file.name.startsWith('.')) out.push({ file, segments });
			return;
		}
		if (entry.isDirectory) {
			const reader = entry.createReader();
			// readEntries returns batches (≈100 in Chrome) until it returns none.
			let batch: any[] = [];
			do {
				batch = await new Promise((res, rej) => reader.readEntries(res, rej));
				for (const child of batch) await walk(child, [...segments, entry.name]);
			} while (batch.length);
		}
	};
	for (const entry of entries) await walk(entry, []);
	return out;
};

/** Files picked with <input webkitdirectory>: their folder path is in webkitRelativePath. */
export const fromDirectoryInput = (files: FileList) =>
	Array.from(files)
		.filter(f => !f.name.startsWith('.'))
		.map(file => {
			const parts = ((file as any).webkitRelativePath || file.name).split('/');
			return { file, segments: parts.slice(0, -1) };
		});
