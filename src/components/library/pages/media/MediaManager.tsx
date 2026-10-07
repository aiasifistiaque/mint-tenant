'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import { Box, Button, CloseButton, Flex, IconButton, Input, InputGroup, Menu, Portal, Text } from '@chakra-ui/react';
import {
	ArrowLeft,
	Copy,
	CopyPlus,
	Download,
	Eye,
	FileUp,
	FolderInput,
	FolderOpen,
	FolderPlus,
	FolderUp,
	LayoutGrid,
	Link2,
	List,
	Pencil,
	Plus,
	RotateCcw,
	Search,
	Trash2,
	X,
	ExternalLink,
	EllipsisVertical,
	Info,
	SquareCheck,
} from 'lucide-react';
import { toaster } from '@/components/ui/toaster';
import { Layout } from '../../nav';
import { Dropdown } from '../../cl';
import { radius, sizes } from '../../config';
import {
	MediaFile,
	MediaFolder,
	useBrowseMediaQuery,
	useCopyMediaMutation,
	useCreateMediaFolderMutation,
	useGetMediaTrashQuery,
	useGetMediaUsageQuery,
	useMoveMediaMutation,
	usePurgeMediaMutation,
	useRenameMediaFileMutation,
	useRenameMediaFolderMutation,
	useRestoreMediaMutation,
	useTrashMediaMutation,
} from '../../store/services/mediaApi';
import MediaItems, { ItemHandlers } from './MediaItems';
import MoveDialog from './MoveDialog';
import PreviewDialog from './PreviewDialog';
import SortModal, { SORT_VALUES } from './SortModal';
import useMarquee from './useMarquee';
import DetailsDialog from './DetailsDialog';
import UploadPanel from './UploadPanel';
import { ConfirmDialog, DocLink, NameDialog } from './ui';
import { useMediaRoot } from './useMediaRoot';
import { fromDirectoryInput, readDroppedEntries, setUploadDispatch, uploadQueue } from './uploadQueue';
import { useAppDispatch } from '../../hooks';
import {
	DRAG_TYPE,
	ItemKey,
	downloadFile,
	fileKey,
	folderKey,
	formatBytes,
	readPref,
	splitKeys,
	writePref,
} from './utils';

type Props = {
	/** Folder id to show; absent = All Media (root). */
	folder?: string;
	mode?: 'browse' | 'trash';
};

const PAGE = 60;
/** Undo toasts stay a little longer than the default 5s. */
const UNDO_MS = 8000;
const VIEWS = ['grid', 'list'] as const;
const TYPES = [
	{ value: '', label: 'All types' },
	{ value: 'image', label: 'Images' },
	{ value: 'video', label: 'Videos' },
	{ value: 'document', label: 'Documents' },
];

// Stable empties: a fresh `[]` each render would re-run every memo/effect keyed on these.
const NO_FOLDERS: MediaFolder[] = [];
const NO_FILES: MediaFile[] = [];
const NO_PATH: { _id: string; name: string }[] = [];

const errorOf = (res: any) => res?.error?.data?.message || res?.error?.error || (res?.error ? 'Something went wrong' : null);

const isTyping = (el: EventTarget | null) => {
	const t = el as HTMLElement | null;
	return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
};

/**
 * The media manager — Google Drive-style browsing of the admin's File + Folder
 * library: folders and files in a grid or list, multi-select (click, ⌘/Ctrl,
 * Shift, ⌘A), drag items onto a folder or breadcrumb to move them, drop files or
 * whole folders from the computer to upload, inline rename, right-click menus,
 * a preview viewer, sort, type filter, search across everything, and a Trash
 * that keeps deleted items for 30 days.
 */
const MediaManager: FC<Props> = ({ folder, mode = 'browse' }) => {
	const ROOT = useMediaRoot();
	const router = useRouter();
	const appDispatch = useAppDispatch();
	useEffect(() => setUploadDispatch(appDispatch), [appDispatch]);
	const isTrash = mode === 'trash';
	const current = folder || null;

	/* ------------------------------------------------------------ view state */
	// Newest first is the default; the key moved when it stopped being Name, so a
	// Name saved under the old key doesn't hold on to it.
	const SORT_PREF = 'media-sort-v2';
	const [view, setView] = useState<'grid' | 'list'>('grid');
	const [sort, setSort] = useState('-createdAt');
	useEffect(() => {
		setView(readPref('media-view', 'grid', VIEWS));
		setSort(readPref(SORT_PREF, '-createdAt', SORT_VALUES as any));
	}, []);
	const changeView = (v: 'grid' | 'list') => {
		setView(v);
		writePref('media-view', v);
	};
	const changeSort = (v: string) => {
		setSort(v);
		writePref(SORT_PREF, v);
	};

	const [searchInput, setSearchInput] = useState('');
	const [search, setSearch] = useState('');
	useEffect(() => {
		const t = setTimeout(() => setSearch(searchInput.trim()), 300);
		return () => clearTimeout(t);
	}, [searchInput]);
	const [type, setType] = useState('');
	const [pages, setPages] = useState(1);
	useEffect(() => setPages(1), [current, search, type, sort]);

	/* ------------------------------------------------------------------ data */
	const browse = useBrowseMediaQuery(
		{ folder: current, search, type, sort, page: 1, limit: PAGE * pages },
		{ skip: isTrash }
	);
	const trash = useGetMediaTrashQuery(undefined, { skip: !isTrash });
	const { data: usage } = useGetMediaUsageQuery();

	const folders: MediaFolder[] = (isTrash ? trash.data?.folders : browse.data?.folders) || NO_FOLDERS;
	const files: MediaFile[] = (isTrash ? trash.data?.files : browse.data?.files) || NO_FILES;
	const path = browse.data?.path || NO_PATH;
	const loading = isTrash ? trash.isLoading : browse.isLoading;
	const searching = !!search && !isTrash;

	const order: ItemKey[] = useMemo(
		() => [...folders.map(f => folderKey(f._id)), ...files.map(f => fileKey(f._id))],
		[folders, files]
	);
	const fileById = useMemo(() => new Map(files.map(f => [f._id, f])), [files]);
	const folderById = useMemo(() => new Map(folders.map(f => [f._id, f])), [folders]);

	/* ------------------------------------------------------------- selection */
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const anchor = useRef<ItemKey | null>(null);
	const [renaming, setRenaming] = useState<ItemKey | null>(null);
	useEffect(() => {
		setSelected(new Set());
		setRenaming(null);
		anchor.current = null;
	}, [current, mode, search, type]);
	// Drop selections that no longer exist (moved away, trashed…).
	useEffect(() => {
		setSelected(prev => {
			const live = new Set(order);
			const next = new Set([...prev].filter(k => live.has(k as ItemKey)));
			return next.size === prev.size ? prev : next;
		});
	}, [order]);

	const [touch, setTouch] = useState(false);
	useEffect(() => {
		const mq = window.matchMedia('(hover: none)');
		setTouch(mq.matches);
		const on = () => setTouch(mq.matches);
		mq.addEventListener('change', on);
		return () => mq.removeEventListener('change', on);
	}, []);

	const marquee = useMarquee({
		selected,
		onSelect: keys => {
			setSelected(keys);
			anchor.current = null;
		},
		disabled: touch || !!renaming,
	});

	const clear = () => {
		setSelected(new Set());
		anchor.current = null;
	};

	/* ------------------------------------------------------------- mutations */
	const [createFolder, createState] = useCreateMediaFolderMutation();
	const [renameFolder] = useRenameMediaFolderMutation();
	const [renameFile] = useRenameMediaFileMutation();
	const [moveMedia, moveState] = useMoveMediaMutation();
	const [copyMedia] = useCopyMediaMutation();
	const [trashMedia] = useTrashMediaMutation();
	const [restoreMedia] = useRestoreMediaMutation();
	const [purgeMedia, purgeState] = usePurgeMediaMutation();

	const fail = (res: any) => {
		const msg = errorOf(res);
		if (msg) toaster.create({ type: 'error', title: msg });
		return !!msg;
	};

	const move = async (keys: Iterable<string>, target: string | null, quiet = false) => {
		const { files: fs, folders: ds } = splitKeys(keys);
		if (!fs.length && !ds.length) return;
		const res: any = await moveMedia({ files: fs, folders: ds, target });
		if (fail(res)) return;
		clear();
		if (quiet) return;
		const { previous, renamed } = res.data;
		const n = fs.length + ds.length;
		toaster.create({
			type: 'success',
			title: `Moved ${n} item${n === 1 ? '' : 's'}`,
			description: renamed?.length ? `Renamed to avoid a clash: ${renamed.map((r: any) => r.to).join(', ')}` : undefined,
			duration: UNDO_MS,
			action: {
				label: 'Undo',
				onClick: async () => {
					// Put each item back in the folder it came from.
					const groups = new Map<string, string[]>();
					previous.files.forEach((f: any) => groups.set(`${f.folder}`, [...(groups.get(`${f.folder}`) || []), fileKey(f._id)]));
					previous.folders.forEach((f: any) => groups.set(`${f.folder}`, [...(groups.get(`${f.folder}`) || []), folderKey(f._id)]));
					for (const [to, ks] of groups) await move(ks, to === 'null' ? null : to, true);
				},
			},
		});
	};

	const trashItems = async (keys: Iterable<string>) => {
		const sel = splitKeys(keys);
		const n = sel.files.length + sel.folders.length;
		if (!n) return;
		const res: any = await trashMedia(sel);
		if (fail(res)) return;
		clear();
		toaster.create({
			type: 'success',
			title: `${n} item${n === 1 ? '' : 's'} moved to trash`,
			duration: UNDO_MS,
			action: { label: 'Undo', onClick: () => restoreMedia(sel) },
		});
	};

	const restoreItems = async (keys: Iterable<string>) => {
		const sel = splitKeys(keys);
		const res: any = await restoreMedia(sel);
		if (fail(res)) return;
		clear();
		const n = sel.files.length + sel.folders.length;
		toaster.create({ type: 'success', title: `Restored ${n} item${n === 1 ? '' : 's'}` });
	};

	const copyItems = async (keys: Iterable<string>) => {
		const { files: fs } = splitKeys(keys);
		if (!fs.length) return;
		const res: any = await copyMedia({ files: fs });
		if (fail(res)) return;
		toaster.create({ type: 'success', title: `Made ${fs.length} cop${fs.length === 1 ? 'y' : 'ies'}` });
	};

	const copyLink = async (file: MediaFile) => {
		try {
			await navigator.clipboard.writeText(file.url);
			toaster.create({ type: 'success', title: 'Link copied' });
		} catch {
			toaster.create({ type: 'error', title: "Couldn't copy the link" });
		}
	};

	const download = async (list: MediaFile[]) => {
		for (const f of list) {
			try {
				await downloadFile(f);
			} catch (e: any) {
				toaster.create({ type: 'error', title: `${f.name}: ${e.message}` });
			}
		}
	};

	const [detailsOpen, setDetailsOpen] = useState(false);
	const [renamingCurrent, setRenamingCurrent] = useState(false);

	/** The admin page of the folder on screen, for pasting to someone else. */
	const copyFolderLink = async () => {
		try {
			await navigator.clipboard.writeText(`${window.location.origin}/images/f/${current}`);
			toaster.create({ type: 'success', title: 'Folder link copied' });
		} catch {
			toaster.create({ type: 'error', title: "Couldn't copy the link" });
		}
	};

	/** Trashes the folder on screen and steps up to its parent. */
	const trashCurrent = async () => {
		if (!current) return;
		const sel = { files: [], folders: [current] };
		const res: any = await trashMedia(sel);
		if (fail(res)) return;
		const parent = path.length > 1 ? path[path.length - 2]._id : null;
		router.push(parent ? `/images/f/${parent}` : '/images');
		toaster.create({
			type: 'success',
			title: `“${path[path.length - 1]?.name || 'Folder'}” moved to trash`,
			duration: UNDO_MS,
			action: { label: 'Undo', onClick: () => restoreMedia(sel) },
		});
	};

	const rename = async (key: ItemKey, name: string) => {
		setRenaming(null);
		const id = key.slice(2);
		const res: any = key.startsWith('d:') ? await renameFolder({ id, name }) : await renameFile({ id, name });
		fail(res);
	};

	/* --------------------------------------------------------------- opening */
	const [previewIndex, setPreviewIndex] = useState(-1);
	/** A folder opens its page in a new tab, a file its own URL (the browser shows or downloads it). */
	const openInNewTab = (key: ItemKey) => {
		const id = key.slice(2);
		const href = key.startsWith('d:') ? `/images/f/${id}` : fileById.get(id)?.url;
		if (href) window.open(href, '_blank', 'noopener,noreferrer');
	};
	const previewFiles = files;
	const open = (key: ItemKey) => {
		const id = key.slice(2);
		if (key.startsWith('d:')) {
			if (isTrash) return;
			router.push(`/images/f/${id}`);
		} else {
			setPreviewIndex(previewFiles.findIndex(f => f._id === id));
		}
	};

	const locationOf = (file: MediaFile) => {
		const ff = file.fileFolder;
		return ff && typeof ff === 'object' ? ff.name : undefined;
	};

	/* -------------------------------------------------------------- dialogs */
	const [newFolderOpen, setNewFolderOpen] = useState(false);
	const [moveKeys, setMoveKeys] = useState<string[] | null>(null);
	const [purgeKeys, setPurgeKeys] = useState<string[] | 'all' | null>(null);
	const fileInput = useRef<HTMLInputElement>(null);
	const dirInput = useRef<HTMLInputElement>(null);

	const onCreateFolder = async (name: string) => {
		const res: any = await createFolder({ name, parent: current });
		if (fail(res)) return;
		setNewFolderOpen(false);
		const made = res.data.doc;
		if (made.name !== name) toaster.create({ type: 'info', title: `Named “${made.name}” — “${name}” is taken here` });
		setSelected(new Set([folderKey(made._id)]));
	};

	const onPurge = async () => {
		const res: any =
			purgeKeys === 'all' ? await purgeMedia({ all: true }) : await purgeMedia(splitKeys(purgeKeys || []));
		if (fail(res)) return;
		setPurgeKeys(null);
		clear();
		toaster.create({
			type: res.data?.failed ? 'warning' : 'success',
			title: 'Deleted forever',
			description: res.data?.failed ? `${res.data.failed} file(s) couldn't be removed from storage` : undefined,
		});
	};

	/* ----------------------------------------------------------------- menu */
	const [menu, setMenu] = useState<{ point: { x: number; y: number }; keys: string[] } | null>(null);
	const openMenu = (key: ItemKey, point: { x: number; y: number }) => {
		// Right-clicking inside the selection acts on all of it; outside, on that item.
		const keys = selected.has(key) ? [...selected] : [key];
		if (!selected.has(key)) {
			setSelected(new Set([key]));
			anchor.current = key;
		}
		// Next tick: opened inside the contextmenu event, the menu's outside-pointer
		// dismissal sees the same right-click and closes it again at once.
		setTimeout(() => setMenu({ point, keys }), 0);
	};

	/* ------------------------------------------------------------ drag/drop */
	const [dragging, setDragging] = useState<Set<string>>(new Set());
	const [dropTarget, setDropTarget] = useState<string | null>(null);
	const [pageDrop, setPageDrop] = useState(false);
	const pageDragDepth = useRef(0);
	const draggingRef = useRef<Set<string>>(new Set());

	const isOurs = (e: React.DragEvent) => Array.from(e.dataTransfer.types).includes(DRAG_TYPE);
	const isOsFiles = (e: React.DragEvent) => !isOurs(e) && Array.from(e.dataTransfer.types).includes('Files');

	const blockedTargets = useMemo(() => {
		// A folder can't be dropped on itself (its subtree isn't on screen).
		return new Set(splitKeys(dragging).folders);
	}, [dragging]);

	const handlers: ItemHandlers = {
		onClick: (key, e) => {
			if (e.shiftKey && anchor.current) {
				const a = order.indexOf(anchor.current);
				const b = order.indexOf(key);
				if (a >= 0 && b >= 0) {
					const [lo, hi] = a < b ? [a, b] : [b, a];
					const range = order.slice(lo, hi + 1);
					setSelected(prev => new Set(e.metaKey || e.ctrlKey ? [...prev, ...range] : range));
					return;
				}
			}
			if (e.metaKey || e.ctrlKey) {
				setSelected(prev => {
					const next = new Set(prev);
					next.has(key) ? next.delete(key) : next.add(key);
					return next;
				});
			} else {
				setSelected(new Set([key]));
			}
			anchor.current = key;
		},
		onOpen: open,
		onToggle: key => {
			setSelected(prev => {
				const next = new Set(prev);
				next.has(key) ? next.delete(key) : next.add(key);
				return next;
			});
			anchor.current = key;
		},
		onMenu: openMenu,
		onRename: rename,
		onRenameCancel: () => setRenaming(null),
		onDragStart: (key, e) => {
			if (isTrash) return e.preventDefault();
			const keys = selected.has(key) ? [...selected] : [key];
			if (!selected.has(key)) setSelected(new Set([key]));
			const set = new Set(keys);
			draggingRef.current = set;
			setDragging(set);
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData(DRAG_TYPE, JSON.stringify(keys));
			// A small "3 items" chip instead of a ghost of the whole tile.
			const chip = document.createElement('div');
			chip.textContent = keys.length === 1 ? '1 item' : `${keys.length} items`;
			Object.assign(chip.style, {
				position: 'fixed',
				top: '-100px',
				padding: '6px 12px',
				borderRadius: '8px',
				font: '600 13px system-ui, sans-serif',
				background: '#111',
				color: '#fff',
			});
			document.body.appendChild(chip);
			e.dataTransfer.setDragImage(chip, 12, 12);
			setTimeout(() => chip.remove(), 0);
		},
		onDragEnd: () => {
			draggingRef.current = new Set();
			setDragging(new Set());
			setDropTarget(null);
		},
		onFolderDragOver: (id, e) => {
			if (isTrash) return;
			if (isOurs(e)) {
				if (draggingRef.current.has(folderKey(id))) return;
				e.preventDefault();
				e.stopPropagation();
				e.dataTransfer.dropEffect = 'move';
				setDropTarget(id);
			} else if (isOsFiles(e)) {
				e.preventDefault();
				e.stopPropagation();
				e.dataTransfer.dropEffect = 'copy';
				setDropTarget(id);
				setPageDrop(false);
			}
		},
		onFolderDragLeave: id => setDropTarget(t => (t === id ? null : t)),
		onFolderDrop: async (id, e) => {
			e.preventDefault();
			e.stopPropagation();
			setDropTarget(null);
			pageDragDepth.current = 0;
			setPageDrop(false);
			if (isOurs(e)) {
				const keys: string[] = JSON.parse(e.dataTransfer.getData(DRAG_TYPE) || '[]');
				if (keys.includes(folderKey(id))) return;
				move(keys, id);
			} else if (isOsFiles(e)) {
				const entries = await readDroppedEntries(e.dataTransfer);
				uploadQueue.add(entries, id);
				const name = folderById.get(id)?.name;
				if (entries.length && name) toaster.create({ type: 'info', title: `Uploading ${entries.length} item(s) to ${name}` });
			}
		},
	};

	// Breadcrumb crumbs (and "All Media") take drops too.
	const crumbDrop = (target: string | null) => ({
		onDragOver: (e: React.DragEvent) => {
			if (!isOurs(e) || target === current) return;
			e.preventDefault();
			setDropTarget(`crumb:${target}`);
		},
		onDragLeave: () => setDropTarget(t => (t === `crumb:${target}` ? null : t)),
		onDrop: (e: React.DragEvent) => {
			if (!isOurs(e)) return;
			e.preventDefault();
			setDropTarget(null);
			move(JSON.parse(e.dataTransfer.getData(DRAG_TYPE) || '[]'), target);
		},
	});

	// OS files dropped on the page background → current folder.
	const page = {
		onDragEnter: (e: React.DragEvent) => {
			if (isTrash || !isOsFiles(e)) return;
			pageDragDepth.current += 1;
			setPageDrop(true);
		},
		onDragOver: (e: React.DragEvent) => {
			if (!isTrash && isOsFiles(e)) e.preventDefault();
		},
		onDragLeave: (e: React.DragEvent) => {
			if (!isOsFiles(e)) return;
			pageDragDepth.current = Math.max(0, pageDragDepth.current - 1);
			if (!pageDragDepth.current) setPageDrop(false);
		},
		onDrop: async (e: React.DragEvent) => {
			if (!isOsFiles(e)) return;
			e.preventDefault();
			pageDragDepth.current = 0;
			setPageDrop(false);
			uploadQueue.add(await readDroppedEntries(e.dataTransfer), current);
		},
	};

	/* ------------------------------------------------------------- keyboard */
	const selectedRef = useRef(selected);
	selectedRef.current = selected;
	const keyHandler = useRef<(e: KeyboardEvent) => void>(() => {});
	keyHandler.current = (e: KeyboardEvent) => {
		if (isTyping(e.target) || renaming || menu || moveKeys || newFolderOpen || purgeKeys || previewIndex >= 0) return;
		if (document.querySelector('[role="dialog"][data-state="open"]')) return;
		const sel = [...selectedRef.current] as ItemKey[];
		if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') {
			e.preventDefault();
			setSelected(new Set(order));
		} else if (e.key === 'Escape' && sel.length) {
			clear();
		} else if ((e.key === 'Delete' || e.key === 'Backspace') && sel.length) {
			e.preventDefault();
			isTrash ? setPurgeKeys(sel) : trashItems(sel);
		} else if (e.key === 'F2' && sel.length === 1 && !isTrash) {
			e.preventDefault();
			setRenaming(sel[0]);
		} else if (e.key === 'Enter' && sel.length === 1) {
			e.preventDefault();
			open(sel[0]);
		}
	};
	useEffect(() => {
		const on = (e: KeyboardEvent) => keyHandler.current(e);
		window.addEventListener('keydown', on);
		return () => window.removeEventListener('keydown', on);
	}, []);

	/* ------------------------------------------------------------- derived */
	const sel = splitKeys(selected);
	const selFiles = sel.files.map(id => fileById.get(id)).filter(Boolean) as MediaFile[];
	const one = selected.size === 1 ? ([...selected][0] as ItemKey) : null;
	const menuSel = menu ? splitKeys(menu.keys) : null;
	const menuFiles = menuSel ? (menuSel.files.map(id => fileById.get(id)).filter(Boolean) as MediaFile[]) : [];
	const menuOne = menu && menu.keys.length === 1 ? (menu.keys[0] as ItemKey) : null;
	const title = isTrash ? 'Trash' : searching ? `Results for “${search}”` : path.length ? path[path.length - 1].name : ROOT;
	// A failed load isn't an empty folder — say so and offer a retry.
	const failed = isTrash ? trash.isError : browse.isError;
	const empty = !loading && !failed && !folders.length && !files.length;

	/* ------------------------------------------------------------ rendering */
	const toolButton = {
		size: 'sm' as const,
		variant: 'outline' as const,
		h: sizes.SEARCH_BAR_HEIGHT,
		w: sizes.SEARCH_BAR_HEIGHT,
		minW: sizes.SEARCH_BAR_HEIGHT,
		borderRadius: radius?.BUTTON,
		color: 'fg.muted',
		bg: 'field.bg',
		borderColor: 'field.border',
		_hover: { bg: 'bg.subtle', color: 'fg', borderColor: 'border.emphasized' },
	};

	const crumbCss = (target: string | null) => ({
		px: 1.5,
		py: 0.5,
		borderRadius: 'md',
		bg: dropTarget === `crumb:${target}` ? 'bg.muted' : undefined,
		outline: dropTarget === `crumb:${target}` ? '2px solid' : undefined,
		outlineColor: 'fg',
		_hover: { bg: 'bg.subtle' },
	});

	return (
		<Layout
			pb='32px'
			title={isTrash ? 'Trash' : 'Media'}
			path='images'>
			<Flex
				direction='column'
				gap={4}
				position='relative'
				minH='70vh'
				ref={marquee.containerRef}
				onPointerDown={marquee.onPointerDown}
				onClick={e => {
					if (marquee.justDragged.current) return;
					if (!(e.target as HTMLElement).closest('[data-media-item]')) clear();
				}}
				{...page}>
				{marquee.overlay}
				{pageDrop && (
					<Flex
						position='absolute'
						inset={0}
						zIndex={10}
						align='center'
						justify='center'
						borderRadius='lg'
						border='2px dashed'
						borderColor='fg.muted'
						bg='bg.muted'
						opacity={0.92}
						pointerEvents='none'>
						<Text fontSize='lg'>Drop files or folders to upload to {path.length ? path[path.length - 1].name : ROOT}</Text>
					</Flex>
				)}

				{/* Header: breadcrumb (drop targets) + primary actions */}
				<Flex
					align={{ base: 'flex-start', md: 'center' }}
					direction={{ base: 'column', md: 'row' }}
					gap={3}
					justify='space-between'>
					<Flex
						align='center'
						gap={0.5}
						minW={0}
						flexWrap='wrap'
						fontSize={{ base: '1.1rem', md: '1.4rem' }}
						fontWeight='500'>
						{isTrash ? (
							<>
								<IconButton
									asChild
									aria-label='Back to media'
									size='sm'
									variant='ghost'
									mr={1}>
									<NextLink href='/images'>
										<ArrowLeft size={18} />
									</NextLink>
								</IconButton>
								<Text>Trash</Text>
							</>
						) : searching ? (
							<Text truncate>{title}</Text>
						) : (
							<>
								<Box
									asChild
									{...crumbCss(null)}
									{...crumbDrop(null)}>
									<NextLink href='/images'>{ROOT}</NextLink>
								</Box>
								{path.map((p, i) => (
									<Flex
										key={p._id}
										align='center'
										gap={0.5}
										minW={0}>
										<Text
											color='fg.muted'
											px={0.5}>
											/
										</Text>
										{i === path.length - 1 ? (
											<Text
												px={1.5}
												truncate>
												{p.name}
											</Text>
										) : (
											<Box
												asChild
												{...crumbCss(p._id)}
												{...crumbDrop(p._id)}>
												<NextLink href={`/images/f/${p._id}`}>{p.name}</NextLink>
											</Box>
										)}
									</Flex>
								))}
								<Menu.Root positioning={{ placement: 'bottom-start' }}>
									<Menu.Trigger asChild>
										<IconButton
											aria-label='Folder options'
											title='Folder options'
											size='sm'
											variant='ghost'
											color='fg.muted'
											ml={0.5}
											flexShrink={0}
											_hover={{ color: 'fg', bg: 'bg.muted' }}>
											<EllipsisVertical size={18} />
										</IconButton>
									</Menu.Trigger>
									<Portal>
										<Menu.Positioner>
											<Menu.Content minW='220px'>
												<Menu.Item
													value='details'
													onClick={() => setDetailsOpen(true)}>
													<Info size={15} /> View details
												</Menu.Item>
												<Menu.Separator />
												<Menu.Item
													value='new-folder'
													onClick={() => setNewFolderOpen(true)}>
													<FolderPlus size={15} /> New folder
												</Menu.Item>
												<Menu.Item
													value='upload-files'
													onClick={() => fileInput.current?.click()}>
													<FileUp size={15} /> Upload files
												</Menu.Item>
												<Menu.Item
													value='upload-dir'
													onClick={() => dirInput.current?.click()}>
													<FolderUp size={15} /> Upload folder
												</Menu.Item>
												<Menu.Separator />
												<Menu.Item
													value='select-all'
													disabled={!order.length}
													onClick={() => setSelected(new Set(order))}>
													<SquareCheck size={15} /> Select all
												</Menu.Item>
												<Menu.Item
													value='view'
													onClick={() => changeView(view === 'grid' ? 'list' : 'grid')}>
													{view === 'grid' ? <List size={15} /> : <LayoutGrid size={15} />}
													{view === 'grid' ? 'Show as list' : 'Show as grid'}
												</Menu.Item>
												{current && (
													<>
														<Menu.Separator />
														<Menu.Item
															value='folder-tab'
															onClick={() => openInNewTab(folderKey(current))}>
															<ExternalLink size={15} /> Open in new tab
														</Menu.Item>
														<Menu.Item
															value='folder-link'
															onClick={copyFolderLink}>
															<Copy size={15} /> Copy folder link
														</Menu.Item>
														<Menu.Item
															value='folder-rename'
															onClick={() => setRenamingCurrent(true)}>
															<Pencil size={15} /> Rename folder
														</Menu.Item>
														<Menu.Item
															value='folder-move'
															onClick={() => setMoveKeys([folderKey(current)])}>
															<FolderInput size={15} /> Move folder to…
														</Menu.Item>
														<Menu.Item
															value='folder-trash'
															color='fg.error'
															onClick={trashCurrent}>
															<Trash2 size={15} /> Move folder to trash
														</Menu.Item>
													</>
												)}
												<Menu.Separator />
												<Menu.Item
													value='trash'
													asChild>
													<NextLink href='/images/trash'>
														<Trash2 size={15} /> Open trash
													</NextLink>
												</Menu.Item>
											</Menu.Content>
										</Menu.Positioner>
									</Portal>
								</Menu.Root>
							</>
						)}
					</Flex>

					<Flex
						align='center'
						gap={2}
						flexShrink={0}>
						<DocLink section={isTrash ? 'trash' : 'what'} />
						{isTrash ? (
							<Button
								size='sm'
								px={3}
								variant='outline'
								disabled={empty}
								onClick={() => setPurgeKeys('all')}>
								<Trash2 size={15} /> Empty trash
							</Button>
						) : (
							<>
								<Button
									asChild
									size='sm'
									px={3}
									variant='ghost'>
									<NextLink href='/images/trash'>
										<Trash2 size={15} /> Trash
										{usage?.trash?.count ? (
											<Text
												as='span'
												fontSize='xs'
												color='fg.muted'>
												{usage.trash.count}
											</Text>
										) : null}
									</NextLink>
								</Button>
								<Menu.Root positioning={{ placement: 'bottom-end' }}>
									<Menu.Trigger asChild>
										<Button
											size='sm'
											px={3}>
											<Plus size={16} /> New
										</Button>
									</Menu.Trigger>
									<Portal>
										<Menu.Positioner>
											<Menu.Content minW='190px'>
												<Menu.Item
													value='folder'
													onClick={() => setNewFolderOpen(true)}>
													<FolderPlus size={15} /> New folder
												</Menu.Item>
												<Menu.Separator />
												<Menu.Item
													value='files'
													onClick={() => fileInput.current?.click()}>
													<FileUp size={15} /> Upload files
												</Menu.Item>
												<Menu.Item
													value='dir'
													onClick={() => dirInput.current?.click()}>
													<FolderUp size={15} /> Upload folder
												</Menu.Item>
											</Menu.Content>
										</Menu.Positioner>
									</Portal>
								</Menu.Root>
							</>
						)}
					</Flex>
				</Flex>

				{/* Toolbar — or the selection bar while something is selected */}
				{selected.size > 0 ? (
					<Flex
						align='center'
						gap={1}
						px={2}
						minH={sizes.SEARCH_BAR_HEIGHT}
						borderRadius='lg'
						bg='bg.muted'
						flexWrap='wrap'
						onClick={e => e.stopPropagation()}>
						<CloseButton
							size='sm'
							borderRadius='full'
							aria-label='Clear selection'
							onClick={clear}
						/>
						<Text
							fontSize='sm'
							fontWeight='500'
							mr={2}>
							{selected.size} selected
						</Text>
						{isTrash ? (
							<>
								<Button
									size='sm'
									variant='ghost'
									onClick={() => restoreItems(selected)}>
									<RotateCcw size={15} /> Restore
								</Button>
								<Button
									size='sm'
									variant='ghost'
									onClick={() => setPurgeKeys([...selected])}>
									<Trash2 size={15} /> Delete forever
								</Button>
							</>
						) : (
							<>
								<Button
									size='sm'
									variant='ghost'
									onClick={() => setMoveKeys([...selected])}>
									<FolderInput size={15} /> Move
								</Button>
								{selFiles.length > 0 && (
									<Button
										size='sm'
										variant='ghost'
										onClick={() => download(selFiles)}>
										<Download size={15} /> Download
									</Button>
								)}
								{one && one.startsWith('f:') && fileById.get(one.slice(2)) && (
									<Button
										size='sm'
										variant='ghost'
										display={{ base: 'none', md: 'inline-flex' }}
										onClick={() => copyLink(fileById.get(one.slice(2))!)}>
										<Link2 size={15} /> Copy link
									</Button>
								)}
								{one && (
									<Button
										size='sm'
										variant='ghost'
										display={{ base: 'none', md: 'inline-flex' }}
										onClick={() => setRenaming(one)}>
										<Pencil size={15} /> Rename
									</Button>
								)}
								<Button
									size='sm'
									variant='ghost'
									onClick={() => trashItems(selected)}>
									<Trash2 size={15} /> Delete
								</Button>
							</>
						)}
					</Flex>
				) : (
					<Flex
						align='center'
						gap={2}
						flexWrap={{ base: 'wrap', md: 'nowrap' }}>
						{!isTrash && (
							<InputGroup
								flex={{ base: '1 1 100%', md: '0 1 360px' }}
								startElement={<Search size={15} />}
								endElement={
									searchInput ? (
										<IconButton
											aria-label='Clear search'
											size='2xs'
											variant='ghost'
											onClick={() => setSearchInput('')}>
											<X size={14} />
										</IconButton>
									) : undefined
								}>
								<Input
									size='sm'
									h={sizes.SEARCH_BAR_HEIGHT}
									placeholder='Search all media'
									value={searchInput}
									onChange={e => setSearchInput(e.target.value)}
									onKeyDown={e => e.key === 'Escape' && setSearchInput('')}
								/>
							</InputGroup>
						)}
						{!isTrash && (
							// On a phone it takes what's left of the row, so the sort and view
							// buttons stay beside it instead of wrapping to a line of their own.
							<Box
								w={{ base: 'auto', md: '150px' }}
								flex={{ base: '1 1 0', md: 'none' }}
								minW={0}>
								<Dropdown
									size='sm'
									value={type}
									onChange={setType}
									items={TYPES}
								/>
							</Box>
						)}
						<Box
							flex={1}
							display={{ base: isTrash ? 'block' : 'none', md: 'block' }}
						/>
						{!isTrash && (
							<SortModal
								value={sort}
								onChange={changeSort}
							/>
						)}
						<IconButton
							aria-label={view === 'grid' ? 'List view' : 'Grid view'}
							title={view === 'grid' ? 'List view' : 'Grid view'}
							{...toolButton}
							onClick={() => changeView(view === 'grid' ? 'list' : 'grid')}>
							{view === 'grid' ? <List size={16} /> : <LayoutGrid size={16} />}
						</IconButton>
					</Flex>
				)}

				{isTrash && (
					<Flex
						align='center'
						gap={2}
						px={3}
						py={2}
						borderRadius='md'
						bg='bg.subtle'
						fontSize='sm'
						color='fg.muted'>
						Items in the trash are deleted forever after {trash.data?.days || 30} days.
					</Flex>
				)}

				{failed ? (
					<Flex
						direction='column'
						align='center'
						justify='center'
						gap={2}
						py={20}
						color='fg.muted'
						textAlign='center'>
						<Text
							fontWeight='500'
							color='fg'>
							Couldn’t load {isTrash ? 'the trash' : 'this folder'}
						</Text>
						<Text fontSize='sm'>Check your connection and try again.</Text>
						<Button
							mt={2}
							size='sm'
							variant='outline'
							px={3}
							loading={isTrash ? trash.isFetching : browse.isFetching}
							onClick={() => (isTrash ? trash.refetch() : browse.refetch())}>
							<RotateCcw size={14} /> Try again
						</Button>
					</Flex>
				) : empty ? (
					<Flex
						direction='column'
						align='center'
						justify='center'
						gap={2}
						py={20}
						color='fg.muted'
						textAlign='center'>
						{isTrash ? <Trash2 size={40} /> : <FolderOpen size={40} />}
						<Text
							fontWeight='500'
							color='fg'>
							{isTrash ? 'Trash is empty' : searching || type ? 'Nothing matches' : 'This folder is empty'}
						</Text>
						<Text fontSize='sm'>
							{isTrash
								? 'Deleted files and folders show up here.'
								: searching || type
									? 'Try another name or type.'
									: 'Drop files or folders here, or use New.'}
						</Text>
					</Flex>
				) : (
					<MediaItems
						view={view}
						folders={folders}
						files={files}
						loading={loading}
						sort={sort}
						onSort={changeSort}
						locationOf={searching ? f => locationOf(f) : undefined}
						selected={selected}
						selecting={selected.size > 0}
						renaming={renaming}
						dropTarget={dropTarget && !blockedTargets.has(dropTarget) ? dropTarget : null}
						dragging={dragging}
						touch={touch}
						handlers={handlers}
					/>
				)}

				{!isTrash && browse.data?.hasMore && (
					<Flex justify='center'>
						<Button
							size='sm'
							variant='outline'
							px={4}
							loading={browse.isFetching}
							onClick={() => setPages(p => p + 1)}>
							Load more ({browse.data.totalFiles - files.length} left)
						</Button>
					</Flex>
				)}

				{usage && !isTrash && (
					<Flex
						mt='auto'
						pt={2}
						align='center'
						gap={3}
						fontSize='xs'
						color='fg.muted'
						flexWrap='wrap'>
						<Text>
							{formatBytes(usage.size)} used · {usage.count.toLocaleString()} file{usage.count === 1 ? '' : 's'} ·{' '}
							{usage.folders.toLocaleString()} folder{usage.folders === 1 ? '' : 's'}
						</Text>
						{usage.byType.map(t => (
							<Text key={t.type}>
								{t.type === 'image' ? 'Images' : t.type === 'video' ? 'Videos' : t.type === 'document' ? 'Documents' : 'Other'}{' '}
								{formatBytes(t.size)}
							</Text>
						))}
						{usage.trash.count > 0 && <Text>Trash {formatBytes(usage.trash.size)}</Text>}
					</Flex>
				)}
			</Flex>

			{/* Hidden pickers for New → Upload files / folder */}
			<input
				ref={fileInput}
				type='file'
				multiple
				hidden
				onChange={e => {
					if (e.target.files?.length) uploadQueue.add(Array.from(e.target.files).map(file => ({ file })), current);
					e.target.value = '';
				}}
			/>
			<input
				ref={dirInput}
				type='file'
				hidden
				multiple
				{...({ webkitdirectory: '', directory: '' } as any)}
				onChange={e => {
					if (e.target.files?.length) uploadQueue.add(fromDirectoryInput(e.target.files), current);
					e.target.value = '';
				}}
			/>

			{/* One shared item menu — opened by right-click or the ⋯ button, at that point */}
			<Menu.Root
				open={!!menu}
				onOpenChange={e => !e.open && setMenu(null)}
				// A zero-size anchor at the click/button point (anchorPoint alone
				// doesn't position a menu that has no trigger).
				positioning={{
					placement: 'bottom-start',
					getAnchorRect: () => (menu ? { x: menu.point.x, y: menu.point.y, width: 0, height: 0 } : null),
				}}>
				<Portal>
					<Menu.Positioner>
						<Menu.Content minW='200px'>
							{menu && isTrash && (
								<>
									<Menu.Item
										value='restore'
										onClick={() => restoreItems(menu.keys)}>
										<RotateCcw size={15} /> Restore
									</Menu.Item>
									<Menu.Item
										value='purge'
										color='fg.error'
										onClick={() => setPurgeKeys(menu.keys)}>
										<Trash2 size={15} /> Delete forever
									</Menu.Item>
								</>
							)}
							{menu && !isTrash && (
								<>
									{menuOne && (
										<Menu.Item
											value='open'
											onClick={() => open(menuOne)}>
											{menuOne.startsWith('d:') ? <FolderOpen size={15} /> : <Eye size={15} />}
											{menuOne.startsWith('d:') ? 'Open' : 'Preview'}
										</Menu.Item>
									)}
									{menuOne && (
										<Menu.Item
											value='open-tab'
											onClick={() => openInNewTab(menuOne)}>
											<ExternalLink size={15} /> Open in new tab
										</Menu.Item>
									)}
									{menuOne && (
										<Menu.Item
											value='rename'
											onClick={() => setRenaming(menuOne)}>
											<Pencil size={15} /> Rename
										</Menu.Item>
									)}
									<Menu.Item
										value='move'
										onClick={() => setMoveKeys(menu.keys)}>
										<FolderInput size={15} /> Move to…
									</Menu.Item>
									{menuFiles.length > 0 && (
										<>
											<Menu.Separator />
											{menuFiles.length === 1 && (
												<Menu.Item
													value='link'
													onClick={() => copyLink(menuFiles[0])}>
													<Copy size={15} /> Copy link
												</Menu.Item>
											)}
											<Menu.Item
												value='download'
												onClick={() => download(menuFiles)}>
												<Download size={15} /> Download
											</Menu.Item>
											<Menu.Item
												value='copy'
												onClick={() => copyItems(menu.keys)}>
												<CopyPlus size={15} /> Make a copy
											</Menu.Item>
										</>
									)}
									<Menu.Separator />
									<Menu.Item
										value='trash'
										color='fg.error'
										onClick={() => trashItems(menu.keys)}>
										<Trash2 size={15} /> Move to trash
									</Menu.Item>
								</>
							)}
						</Menu.Content>
					</Menu.Positioner>
				</Portal>
			</Menu.Root>

			<NameDialog
				isOpen={newFolderOpen}
				onClose={() => setNewFolderOpen(false)}
				title='New folder'
				label='Folder name'
				initial='Untitled folder'
				confirmLabel='Create'
				doc='folders'
				busy={createState.isLoading}
				onConfirm={onCreateFolder}
			/>

			<NameDialog
				isOpen={renamingCurrent}
				onClose={() => setRenamingCurrent(false)}
				title='Rename folder'
				label='Folder name'
				initial={path[path.length - 1]?.name || ''}
				confirmLabel='Rename'
				doc='folders'
				onConfirm={async name => {
					setRenamingCurrent(false);
					if (current) fail(await renameFolder({ id: current, name }));
				}}
			/>

			<DetailsDialog
				isOpen={detailsOpen}
				onClose={() => setDetailsOpen(false)}
				name={path.length ? path[path.length - 1].name : ROOT}
				location={path.length ? [ROOT, ...path.map(p => p.name)].join(' / ') : 'Top level'}
				folders={folders}
				files={files}
				totalFiles={browse.data?.totalFiles ?? files.length}
				partial={!!browse.data?.hasMore}
				usage={usage}
			/>

			<MoveDialog
				isOpen={!!moveKeys}
				onClose={() => setMoveKeys(null)}
				current={searching ? null : current}
				movingFolders={moveKeys ? splitKeys(moveKeys).folders : []}
				count={moveKeys?.length || 0}
				busy={moveState.isLoading}
				onConfirm={async target => {
					await move(moveKeys || [], target);
					setMoveKeys(null);
				}}
			/>

			<ConfirmDialog
				isOpen={!!purgeKeys}
				onClose={() => setPurgeKeys(null)}
				title={purgeKeys === 'all' ? 'Empty trash?' : 'Delete forever?'}
				confirmLabel={purgeKeys === 'all' ? 'Empty trash' : 'Delete forever'}
				doc='trash'
				busy={purgeState.isLoading}
				onConfirm={onPurge}>
				{purgeKeys === 'all'
					? 'Everything in the trash is deleted permanently, including the files in storage. This can’t be undone.'
					: `${purgeKeys?.length === 1 ? 'This item and everything inside it is' : `These ${purgeKeys?.length || 0} items and everything inside them are`} deleted permanently, including the files in storage. This can’t be undone.`}
				{' '}Pages that still link to these files will show broken images.
			</ConfirmDialog>

			<PreviewDialog
				files={previewFiles}
				index={previewIndex}
				onIndex={setPreviewIndex}
				onClose={() => setPreviewIndex(-1)}
				onCopyLink={copyLink}
				onDownload={f => download([f])}
				location={
					previewIndex >= 0
						? searching
							? locationOf(previewFiles[previewIndex]) || ROOT
							: isTrash
								? 'Trash'
								: path.map(p => p.name).join(' / ') || ROOT
						: undefined
				}
			/>

			<UploadPanel />
		</Layout>
	);
};

export default MediaManager;
