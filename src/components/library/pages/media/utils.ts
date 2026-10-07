import type { MediaFile, MediaFolder } from '../../store/services/mediaApi';
// Leaf module on purpose: importing the redux store here would make it the first
// module a page evaluates, and the store → library barrel → authSlice cycle then
// reads TOKEN_NAME before it's defined (initial token null → the store's
// localStorage mirror deletes the real token → logged out).
import { TOKEN_NAME } from '../../config/lib/constants/constants';

/** The media manager guide. Section ids are the anchors on /docs/media. */
export const GUIDE = docsPath('/docs/media');

// Per request, like the API slice: the admin API, or the tenant panel's current project.
export { BACKEND } from '../../config/lib/constants/panel';
import { apiUrl } from '../../config/lib/constants/panel';
import { docsPath } from '../../config/lib/constants/panel';

/** Selection keys: `d:<id>` for folders, `f:<id>` for files. */
export type ItemKey = `d:${string}` | `f:${string}`;
export const folderKey = (id: string): ItemKey => `d:${id}`;
export const fileKey = (id: string): ItemKey => `f:${id}`;

export const splitKeys = (keys: Iterable<string>) => {
	const files: string[] = [];
	const folders: string[] = [];
	for (const k of keys) {
		if (k.startsWith('f:')) files.push(k.slice(2));
		else if (k.startsWith('d:')) folders.push(k.slice(2));
	}
	return { files, folders };
};

/** The dragged payload between tiles, rows and breadcrumbs. */
export const DRAG_TYPE = 'application/x-emint-media';

export const formatBytes = (bytes?: number) => {
	if (!bytes) return '0 B';
	const units = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
	const n = bytes / Math.pow(1024, i);
	return `${n >= 100 || i === 0 ? Math.round(n) : n.toFixed(1)} ${units[i]}`;
};

export const formatDate = (value?: string | null) => {
	if (!value) return '—';
	const d = new Date(value);
	const sameYear = d.getFullYear() === new Date().getFullYear();
	return d.toLocaleDateString(undefined, {
		day: 'numeric',
		month: 'short',
		...(sameYear ? {} : { year: 'numeric' }),
	});
};

/** "PNG", "PDF", "MP4"… for the list's Type column. */
export const typeLabel = (file: MediaFile) => {
	const sub = (file.type || '').split('/')[1] || '';
	const clean = sub.replace(/^(x-|vnd\.)/, '').split(/[.+;-]/)[0];
	return (clean || file.fileType || 'file').toUpperCase();
};

export const isImage = (file: MediaFile) => (file.fileType || '').startsWith('image') || (file.type || '').startsWith('image/');
export const isVideo = (file: MediaFile) => file.fileType === 'video' || (file.type || '').startsWith('video/');

export type FileKind = 'image' | 'video' | 'pdf' | 'doc' | 'sheet' | 'slides' | 'archive' | 'audio' | 'code' | 'text' | 'file';

const EXT_KIND: Record<string, FileKind> = {
	pdf: 'pdf',
	doc: 'doc', docx: 'doc', odt: 'doc', rtf: 'doc', pages: 'doc',
	xls: 'sheet', xlsx: 'sheet', ods: 'sheet', csv: 'sheet', tsv: 'sheet', numbers: 'sheet',
	ppt: 'slides', pptx: 'slides', odp: 'slides', key: 'slides',
	zip: 'archive', rar: 'archive', '7z': 'archive', tar: 'archive', gz: 'archive', tgz: 'archive',
	mp3: 'audio', wav: 'audio', ogg: 'audio', m4a: 'audio', aac: 'audio', flac: 'audio',
	json: 'code', js: 'code', ts: 'code', html: 'code', css: 'code', xml: 'code', svg: 'code',
	txt: 'text', md: 'text', log: 'text',
};

/** What a file is, for its icon: from its type, else its extension. */
export const fileKind = (file: MediaFile): FileKind => {
	if (isImage(file) && !/svg/.test(file.type || '')) return 'image';
	if (isVideo(file)) return 'video';
	const mime = file.type || '';
	if (mime === 'application/pdf') return 'pdf';
	if (mime.startsWith('audio/')) return 'audio';
	if (/spreadsheet|excel|csv/.test(mime)) return 'sheet';
	if (/presentation|powerpoint/.test(mime)) return 'slides';
	if (/wordprocessing|msword|opendocument\.text/.test(mime)) return 'doc';
	if (/zip|rar|7z|tar|gzip|compressed/.test(mime)) return 'archive';
	const ext = splitExt(file.name || '')[1].slice(1).toLowerCase();
	if (EXT_KIND[ext]) return EXT_KIND[ext];
	if (/json|javascript|html|xml|css/.test(mime)) return 'code';
	if (mime.startsWith('text/')) return 'text';
	return isImage(file) ? 'image' : 'file';
};

/** "PDF", "DOCX"… — the extension when there is one, for the badge under a file's icon. */
export const extLabel = (file: MediaFile) => {
	const ext = splitExt(file.name || '')[1].slice(1);
	return (ext && ext.length <= 5 ? ext : typeLabel(file)).toUpperCase();
};

export const folderSummary = (folder: MediaFolder) => {
	const parts = [];
	if (folder.folderCount) parts.push(`${folder.folderCount} folder${folder.folderCount === 1 ? '' : 's'}`);
	if (folder.fileCount) parts.push(`${folder.fileCount} file${folder.fileCount === 1 ? '' : 's'}`);
	return parts.join(', ') || 'Empty';
};

/** Splits "photo.webp" into ["photo", ".webp"] so rename selects just the name. */
export const splitExt = (name: string) => {
	const i = name.lastIndexOf('.');
	return i > 0 ? [name.slice(0, i), name.slice(i)] : [name, ''];
};

// The store mirrors auth.token into localStorage, so this is the same token RTK sends.
const authHeader = (): Record<string, string> => {
	let token: string | null = null;
	try {
		token = localStorage.getItem(TOKEN_NAME);
	} catch {}
	return token && token !== 'null' ? { authorization: token } : {};
};

/** JSON call outside RTK (the upload queue lives outside React). */
export const apiPost = async (path: string, body: any) => {
	const res = await fetch(apiUrl(path), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...authHeader() },
		body: JSON.stringify(body),
	});
	const json = await res.json().catch(() => ({}));
	if (!res.ok) throw new Error(json?.message || `Request failed (${res.status})`);
	return json;
};

/** Upload one file with progress. Resolves with the created document. */
export const uploadWithProgress = (
	file: File,
	folder: string | null,
	onProgress: (fraction: number) => void
): { promise: Promise<MediaFile>; abort: () => void } => {
	const xhr = new XMLHttpRequest();
	const promise = new Promise<MediaFile>((resolve, reject) => {
		const body = new FormData();
		body.append('file', file);
		if (folder) body.append('folder', folder);
		xhr.open('POST', apiUrl('media/upload'));
		Object.entries(authHeader()).forEach(([k, v]) => xhr.setRequestHeader(k, v));
		xhr.upload.onprogress = e => e.lengthComputable && onProgress(e.loaded / e.total);
		xhr.onload = () => {
			let json: any = {};
			try {
				json = JSON.parse(xhr.responseText);
			} catch {}
			if (xhr.status >= 200 && xhr.status < 300) resolve(json.doc);
			else reject(new Error(json?.message || `Upload failed (${xhr.status})`));
		};
		xhr.onerror = () => reject(new Error('Network error'));
		xhr.onabort = () => reject(new Error('Canceled'));
		xhr.send(body);
	});
	return { promise, abort: () => xhr.abort() };
};

/** Downloads through the backend (S3 links are cross-origin, so `download` is ignored on them). */
export const downloadFile = async (file: MediaFile) => {
	const res = await fetch(apiUrl(`media/download/${file._id}`), { headers: authHeader() });
	if (!res.ok) throw new Error(`Download failed (${res.status})`);
	const blob = await res.blob();
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = file.name || 'download';
	document.body.appendChild(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const readPref = <T extends string>(key: string, fallback: T, allowed: readonly T[]): T => {
	try {
		const v = localStorage.getItem(key) as T | null;
		return v && allowed.includes(v) ? v : fallback;
	} catch {
		return fallback;
	}
};

export const writePref = (key: string, value: string) => {
	try {
		localStorage.setItem(key, value);
	} catch {}
};
