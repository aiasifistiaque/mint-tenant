'use client';

import { FC, memo, useEffect, useRef, useState } from 'react';
import { Box, chakra, Checkbox, Flex, Grid, IconButton, Image, Input, Skeleton, Text } from '@chakra-ui/react';
import { ArrowDown, ArrowUp, EllipsisVertical, Folder, Play } from 'lucide-react';
import { KindGlyph } from './fileKinds';
import type { MediaFile, MediaFolder } from '../../store/services/mediaApi';
import {
	ItemKey,
	fileKey,
	folderKey,
	folderSummary,
	formatBytes,
	formatDate,
	extLabel,
	fileKind,
	isImage,
	splitExt,
	typeLabel,
} from './utils';

export type ItemHandlers = {
	onClick: (key: ItemKey, e: React.MouseEvent) => void;
	onOpen: (key: ItemKey) => void;
	onToggle: (key: ItemKey) => void;
	onMenu: (key: ItemKey, point: { x: number; y: number }) => void;
	onRename: (key: ItemKey, name: string) => void;
	onRenameCancel: () => void;
	onDragStart: (key: ItemKey, e: React.DragEvent) => void;
	onDragEnd: () => void;
	/** Folder drop targets: hover state + drop (items or OS files). */
	onFolderDragOver: (folderId: string, e: React.DragEvent) => void;
	onFolderDragLeave: (folderId: string) => void;
	onFolderDrop: (folderId: string, e: React.DragEvent) => void;
};

type Common = {
	selected: Set<string>;
	renaming: ItemKey | null;
	dropTarget: string | null;
	dragging: Set<string>;
	/** Touch screens: checkboxes always visible, tap opens. */
	touch: boolean;
	selecting: boolean;
	handlers: ItemHandlers;
};

const FileGlyph: FC<{ file: MediaFile; size?: number }> = ({ file, size = 16 }) => (
	<KindGlyph
		kind={fileKind(file)}
		size={size}
	/>
);

/** A document's face in the grid: its kind's icon, large, over the extension. */
const DocFace: FC<{ file: MediaFile }> = ({ file }) => (
	<Flex
		h='full'
		direction='column'
		align='center'
		justify='center'
		gap={2}>
		<FileGlyph
			file={file}
			size={44}
		/>
		<Text
			fontSize='10px'
			fontWeight='700'
			letterSpacing='0.06em'
			color='fg.muted'
			px={1.5}
			py={0.5}
			borderRadius='sm'
			borderWidth='1px'
			borderColor='border'
			bg='bg.panel'>
			{extLabel(file)}
		</Text>
	</Flex>
);

/**
 * A video's first frame, with a play badge so it doesn't pass for a picture.
 * Only loaded once the tile scrolls near the screen, and only its metadata and
 * that one frame (`#t=`), not the whole file.
 */
const VideoFace: FC<{ file: MediaFile }> = ({ file }) => {
	const ref = useRef<HTMLDivElement>(null);
	const [near, setNear] = useState(false);
	const [failed, setFailed] = useState(false);
	useEffect(() => {
		const el = ref.current;
		if (!el || near) return;
		if (typeof IntersectionObserver === 'undefined') return setNear(true);
		const io = new IntersectionObserver(
			entries => {
				if (entries.some(e => e.isIntersecting)) {
					setNear(true);
					io.disconnect();
				}
			},
			{ rootMargin: '200px' }
		);
		io.observe(el);
		return () => io.disconnect();
	}, [near]);
	return (
		<Box
			ref={ref}
			position='relative'
			h='full'
			bg='bg.emphasized'>
			{near && !failed ? (
				<chakra.video
					src={`${file.url}#t=0.5`}
					preload='metadata'
					muted
					playsInline
					disablePictureInPicture
					tabIndex={-1}
					aria-hidden
					onError={() => setFailed(true)}
					w='full'
					h='full'
					objectFit='cover'
					pointerEvents='none'
				/>
			) : (
				<Flex
					h='full'
					align='center'
					justify='center'>
					<FileGlyph
						file={file}
						size={40}
					/>
				</Flex>
			)}
			<Flex
				position='absolute'
				inset={0}
				align='center'
				justify='center'
				pointerEvents='none'>
				<Flex
					align='center'
					justify='center'
					boxSize='40px'
					borderRadius='full'
					bg='rgba(0, 0, 0, 0.55)'
					color='white'
					boxShadow='0 2px 8px rgba(0, 0, 0, 0.3)'>
					<Play
						size={18}
						fill='currentColor'
						style={{ marginLeft: 2 }}
					/>
				</Flex>
			</Flex>
		</Box>
	);
};

/** The name field that replaces a label while renaming. Enter saves, Esc cancels, blur saves. */
const RenameInput: FC<{ initial: string; isFile: boolean; onSave: (v: string) => void; onCancel: () => void }> = ({
	initial,
	isFile,
	onSave,
	onCancel,
}) => {
	const [value, setValue] = useState(initial);
	const ref = useRef<HTMLInputElement>(null);
	const done = useRef(false);
	const mountedAt = useRef(0);
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		mountedAt.current = Date.now();
		el.focus();
		// Select the name, not the extension, like Drive/Finder.
		const end = isFile ? splitExt(initial)[0].length : initial.length;
		el.setSelectionRange(0, end);
	}, [initial, isFile]);
	const finish = (save: boolean) => {
		if (done.current) return;
		done.current = true;
		const v = value.trim();
		if (save && v && v !== initial) onSave(v);
		else onCancel();
	};
	return (
		<Input
			ref={ref}
			size='xs'
			h='26px'
			value={value}
			onChange={e => setValue(e.target.value)}
			onClick={e => e.stopPropagation()}
			onDoubleClick={e => e.stopPropagation()}
			onKeyDown={e => {
				e.stopPropagation();
				if (e.key === 'Enter') finish(true);
				if (e.key === 'Escape') finish(false);
			}}
			onBlur={e => {
				// Opened from the item menu, the menu hands focus back to where it
				// was as it closes — right after this mounts. Take it back rather
				// than treating that as "done".
				if (Date.now() - mountedAt.current < 600) {
					const el = e.currentTarget;
					setTimeout(() => el.focus(), 0);
					return;
				}
				finish(true);
			}}
		/>
	);
};

/** Always showing — hidden until hover, it was out of reach on touch screens and easy to miss everywhere else. */
const MenuButton: FC<{ onMenu: (point: { x: number; y: number }) => void }> = ({ onMenu }) => (
	<IconButton
		aria-label='More actions'
		size='xs'
		variant='ghost'
		flexShrink={0}
		color='fg.muted'
		_hover={{ color: 'fg', bg: 'bg.muted' }}
		onClick={e => {
			e.stopPropagation();
			const r = e.currentTarget.getBoundingClientRect();
			onMenu({ x: r.left, y: r.bottom + 4 });
		}}
		onDoubleClick={e => e.stopPropagation()}>
		<EllipsisVertical size={16} />
	</IconButton>
);

const SelectBox: FC<{ checked: boolean; show: boolean; onToggle: () => void }> = ({ checked, show, onToggle }) => (
	<Box
		onClick={e => e.stopPropagation()}
		onDoubleClick={e => e.stopPropagation()}
		opacity={show || checked ? 1 : 0}
		_groupHover={{ opacity: 1 }}
		transition='opacity .1s'>
		<Checkbox.Root
			size='sm'
			checked={checked}
			onCheckedChange={onToggle}
			aria-label={checked ? 'Deselect' : 'Select'}>
			<Checkbox.HiddenInput />
			<Checkbox.Control
				bg={checked ? undefined : 'bg.panel'}
				cursor='pointer'
			/>
		</Checkbox.Root>
	</Box>
);

/**
 * The item's icon, swapped for its checkbox on hover, when selected, while
 * picking several, and always on touch screens — the checkbox needs no space
 * of its own, as in Drive.
 */
const IconOrCheck: FC<{ icon: React.ReactNode; checked: boolean; show: boolean; onToggle: () => void }> = ({
	icon,
	checked,
	show,
	onToggle,
}) => {
	const always = show || checked;
	return (
		<Box
			position='relative'
			w='20px'
			h='20px'
			flexShrink={0}
			display='flex'
			alignItems='center'
			justifyContent='center'>
			<Box
				color='fg.muted'
				display='flex'
				opacity={always ? 0 : 1}
				_groupHover={{ opacity: 0 }}>
				{icon}
			</Box>
			<Box
				position='absolute'
				inset={0}
				display='flex'
				alignItems='center'
				justifyContent='center'>
				<SelectBox
					checked={checked}
					show={always}
					onToggle={onToggle}
				/>
			</Box>
		</Box>
	);
};

/** Shared pointer wiring for a tile/row: click, context menu, drag. */
const itemEvents = (key: ItemKey, touch: boolean, selecting: boolean, renaming: boolean, h: ItemHandlers) => ({
	draggable: !renaming && !touch,
	onClick: (e: React.MouseEvent) => {
		if (renaming) return;
		e.stopPropagation();
		// A plain click opens, as a tap does; selecting is the checkbox, or
		// ⌘/Ctrl/Shift + click. While picking several, a click adds or removes.
		if (!touch && (e.metaKey || e.ctrlKey || e.shiftKey)) h.onClick(key, e);
		else if (selecting) h.onToggle(key);
		else h.onOpen(key);
	},
	// The first click already opened it.
	onDoubleClick: (e: React.MouseEvent) => e.stopPropagation(),
	onContextMenu: (e: React.MouseEvent) => {
		if (renaming) return;
		e.preventDefault();
		e.stopPropagation();
		h.onMenu(key, { x: e.clientX, y: e.clientY });
	},
	onDragStart: (e: React.DragEvent) => h.onDragStart(key, e),
	onDragEnd: () => h.onDragEnd(),
});

const folderDropEvents = (id: string, h: ItemHandlers) => ({
	onDragOver: (e: React.DragEvent) => h.onFolderDragOver(id, e),
	onDragLeave: () => h.onFolderDragLeave(id),
	onDrop: (e: React.DragEvent) => h.onFolderDrop(id, e),
});

/* ------------------------------------------------------------------ grid */

const FolderTile = memo<Common & { folder: MediaFolder }>(
	({ folder, selected, renaming, dropTarget, dragging, touch, selecting, handlers }) => {
		const key = folderKey(folder._id);
		const isSel = selected.has(key);
		const isRenaming = renaming === key;
		return (
			<Flex
				role='group'
				data-media-item
				data-key={key}
				align='center'
				gap={2.5}
				pl={3}
				pr={1}
				h='52px'
				borderRadius='lg'
				borderWidth='1px'
				cursor='default'
				userSelect='none'
				transition='background .1s, border-color .1s'
				borderColor={dropTarget === folder._id || isSel ? 'fg' : 'border'}
				bg={dropTarget === folder._id || isSel ? 'bg.muted' : 'bg.panel'}
				boxShadow={isSel || dropTarget === folder._id ? '0 0 0 1px var(--chakra-colors-fg)' : undefined}
				opacity={dragging.has(key) ? 0.5 : 1}
				_hover={{ bg: isSel || dropTarget === folder._id ? 'bg.muted' : 'bg.subtle' }}
				{...itemEvents(key, touch, selecting, isRenaming, handlers)}
				{...folderDropEvents(folder._id, handlers)}>
				<IconOrCheck
					checked={isSel}
					show={touch || selecting}
					onToggle={() => handlers.onToggle(key)}
					icon={
						<Folder
							size={20}
							fill='currentColor'
							fillOpacity={0.15}
						/>
					}
				/>
				<Box
					flex={1}
					minW={0}>
					{isRenaming ? (
						<RenameInput
							initial={folder.name}
							isFile={false}
							onSave={v => handlers.onRename(key, v)}
							onCancel={handlers.onRenameCancel}
						/>
					) : (
						<>
							<Text
								fontSize='sm'
								fontWeight='500'
								truncate
								title={folder.name}>
								{folder.name}
							</Text>
							<Text
								fontSize='11px'
								color='fg.muted'
								truncate>
								{folderSummary(folder)}
							</Text>
						</>
					)}
				</Box>
				<MenuButton
					onMenu={p => handlers.onMenu(key, p)}
				/>
			</Flex>
		);
	}
);
FolderTile.displayName = 'FolderTile';

const FileTile = memo<Common & { file: MediaFile; location?: string }>(
	({ file, location, selected, renaming, dragging, touch, selecting, handlers }) => {
		const key = fileKey(file._id);
		const isSel = selected.has(key);
		const isRenaming = renaming === key;
		const [broken, setBroken] = useState(false);
		return (
			<Flex
				role='group'
				data-media-item
				data-key={key}
				direction='column'
				borderRadius='lg'
				borderWidth='1px'
				overflow='hidden'
				cursor='default'
				userSelect='none'
				transition='background .1s, border-color .1s'
				borderColor={isSel ? 'fg' : 'border'}
				bg={isSel ? 'bg.muted' : 'bg.panel'}
				boxShadow={isSel ? '0 0 0 1px var(--chakra-colors-fg)' : undefined}
				opacity={dragging.has(key) ? 0.5 : 1}
				_hover={{ bg: isSel ? 'bg.muted' : 'bg.subtle' }}
				{...itemEvents(key, touch, selecting, isRenaming, handlers)}>
				<Box
					position='relative'
					h={{ base: '120px', md: '150px' }}
					m={1.5}
					mb={0}
					borderRadius='md'
					bg='bg.muted'
					overflow='hidden'>
					{isImage(file) && !broken ? (
						<Image
							src={file.url}
							alt={file.name}
							loading='lazy'
							draggable={false}
							onError={() => setBroken(true)}
							w='full'
							h='full'
							objectFit='contain'
						/>
					) : fileKind(file) === 'video' ? (
						<VideoFace file={file} />
					) : (
						<DocFace file={file} />
					)}
					<Box
						position='absolute'
						top={2}
						left={2}>
						<SelectBox
							checked={isSel}
							show={touch || selecting}
							onToggle={() => handlers.onToggle(key)}
						/>
					</Box>
				</Box>
				<Flex
					align='center'
					gap={2}
					pl={3}
					pr={1}
					py={1.5}>
					<Box
						color='fg.muted'
						flexShrink={0}>
						<FileGlyph file={file} />
					</Box>
					<Box
						flex={1}
						minW={0}>
						{isRenaming ? (
							<RenameInput
								initial={file.name}
								isFile
								onSave={v => handlers.onRename(key, v)}
								onCancel={handlers.onRenameCancel}
							/>
						) : (
							<>
								<Text
									fontSize='sm'
									truncate
									title={file.name}>
									{file.name}
								</Text>
								{location && (
									<Text
										fontSize='11px'
										color='fg.muted'
										truncate>
										in {location}
									</Text>
								)}
							</>
						)}
					</Box>
					<MenuButton
						onMenu={p => handlers.onMenu(key, p)}
					/>
				</Flex>
			</Flex>
		);
	}
);
FileTile.displayName = 'FileTile';

/* ------------------------------------------------------------------ list */

const COLS = { base: 'minmax(0,1fr) 36px', md: 'minmax(0,1fr) 110px 90px 110px 36px' };

const ListHeader: FC<{ sort: string; onSort: (v: string) => void; showLocation: boolean }> = ({ sort, onSort, showLocation }) => {
	const key = sort.replace(/^-/, '');
	const desc = sort.startsWith('-');
	const head = (field: string, label: string, display?: any) => (
		<Flex
			as='button'
			align='center'
			gap={1}
			display={display}
			fontSize='xs'
			fontWeight='500'
			color={key === field ? 'fg' : 'fg.muted'}
			_hover={{ color: 'fg' }}
			onClick={() => onSort(key === field ? (desc ? field : `-${field}`) : field === 'name' || field === 'type' ? field : `-${field}`)}>
			{label}
			{key === field && (desc ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}
		</Flex>
	);
	return (
		<Grid
			templateColumns={COLS}
			alignItems='center'
			gap={3}
			px={3}
			h='36px'
			borderBottomWidth='1px'
			borderColor='border'>
			{head('name', showLocation ? 'Name · Location' : 'Name')}
			{head('createdAt', 'Date added', { base: 'none', md: 'flex' })}
			{head('size', 'Size', { base: 'none', md: 'flex' })}
			{head('type', 'Type', { base: 'none', md: 'flex' })}
			<span />
		</Grid>
	);
};

const Row: FC<
	Common & {
		k: ItemKey;
		icon: React.ReactNode;
		name: string;
		sub?: string;
		date?: string;
		size?: string;
		type?: string;
		isFile: boolean;
		folderId?: string;
	}
> = ({ k, icon, name, sub, date, size, type, isFile, folderId, selected, renaming, dropTarget, dragging, touch, selecting, handlers }) => {
	const isSel = selected.has(k);
	const isRenaming = renaming === k;
	const isDrop = !!folderId && dropTarget === folderId;
	return (
		<Grid
			role='group'
			data-media-item
			data-key={k}
			templateColumns={COLS}
			alignItems='center'
			gap={3}
			px={3}
			minH='44px'
			borderBottomWidth='1px'
			borderColor='border.muted'
			cursor='default'
			userSelect='none'
			outline={isDrop ? '2px solid' : undefined}
			outlineColor='fg'
			outlineOffset='-2px'
			bg={isSel || isDrop ? 'bg.muted' : undefined}
			opacity={dragging.has(k) ? 0.5 : 1}
			_hover={{ bg: isSel || isDrop ? 'bg.muted' : 'bg.subtle' }}
			{...itemEvents(k, touch, selecting, isRenaming, handlers)}
			{...(folderId ? folderDropEvents(folderId, handlers) : {})}>
			<Flex
				align='center'
				gap={3}
				minW={0}>
				<IconOrCheck
					checked={isSel}
					show={touch || selecting}
					onToggle={() => handlers.onToggle(k)}
					icon={icon}
				/>
				<Box
					flex={1}
					minW={0}>
					{isRenaming ? (
						<RenameInput
							initial={name}
							isFile={isFile}
							onSave={v => handlers.onRename(k, v)}
							onCancel={handlers.onRenameCancel}
						/>
					) : (
						<>
							<Text
								fontSize='sm'
								truncate
								title={name}>
								{name}
							</Text>
							{sub && (
								<Text
									fontSize='11px'
									color='fg.muted'
									truncate>
									{sub}
								</Text>
							)}
						</>
					)}
				</Box>
			</Flex>
			<Text
				display={{ base: 'none', md: 'block' }}
				fontSize='sm'
				color='fg.muted'>
				{date}
			</Text>
			<Text
				display={{ base: 'none', md: 'block' }}
				fontSize='sm'
				color='fg.muted'>
				{size}
			</Text>
			<Text
				display={{ base: 'none', md: 'block' }}
				fontSize='sm'
				color='fg.muted'
				truncate>
				{type}
			</Text>
			<MenuButton
				onMenu={p => handlers.onMenu(k, p)}
			/>
		</Grid>
	);
};

/* ----------------------------------------------------------------- views */

/** Two across on a phone, three on a tablet, four on a desktop. */
const GRID_COLS = { base: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' };

type ViewProps = Common & {
	view: 'grid' | 'list';
	folders: MediaFolder[];
	files: MediaFile[];
	loading: boolean;
	sort: string;
	onSort: (v: string) => void;
	locationOf?: (file: MediaFile) => string | undefined;
};

const SectionLabel: FC<{ children: React.ReactNode }> = ({ children }) => (
	<Text
		fontSize='xs'
		fontWeight='600'
		color='fg.muted'
		mb={2}
		mt={1}>
		{children}
	</Text>
);

export const MediaItems: FC<ViewProps> = ({ view, folders, files, loading, sort, onSort, locationOf, ...common }) => {
	if (loading) {
		return (
			<Grid
				templateColumns={GRID_COLS}
				gap={3}>
				{[...Array(8)].map((_, i) => (
					<Skeleton
						key={i}
						h={{ base: '160px', md: '200px' }}
						borderRadius='lg'
					/>
				))}
			</Grid>
		);
	}

	if (view === 'list') {
		return (
			<Box
				borderWidth='1px'
				borderColor='border'
				borderRadius='lg'
				bg='bg.panel'
				overflow='hidden'>
				<ListHeader
					sort={sort}
					onSort={onSort}
					showLocation={!!locationOf}
				/>
				{folders.map(f => (
					<Row
						key={f._id}
						k={folderKey(f._id)}
						folderId={f._id}
						isFile={false}
						icon={
							<Folder
								size={18}
								fill='currentColor'
								fillOpacity={0.15}
							/>
						}
						name={f.name}
						sub={folderSummary(f)}
						date={formatDate(f.createdAt)}
						size='—'
						type='Folder'
						{...common}
					/>
				))}
				{files.map(f => (
					<Row
						key={f._id}
						k={fileKey(f._id)}
						isFile
						icon={<FileGlyph file={f} size={18} />}
						name={f.name}
						sub={locationOf ? `in ${locationOf(f) || 'All Media'}` : undefined}
						date={formatDate(f.createdAt)}
						size={formatBytes(f.size)}
						type={typeLabel(f)}
						{...common}
					/>
				))}
			</Box>
		);
	}

	return (
		<Flex
			direction='column'
			gap={5}>
			{folders.length > 0 && (
				<Box>
					<SectionLabel>Folders</SectionLabel>
					<Grid
						templateColumns={GRID_COLS}
						gap={3}>
						{folders.map(f => (
							<FolderTile
								key={f._id}
								folder={f}
								{...common}
							/>
						))}
					</Grid>
				</Box>
			)}
			{files.length > 0 && (
				<Box>
					<SectionLabel>Files</SectionLabel>
					<Grid
						templateColumns={GRID_COLS}
						gap={3}>
						{files.map(f => (
							<FileTile
								key={f._id}
								file={f}
								location={locationOf ? locationOf(f) || 'All Media' : undefined}
								{...common}
							/>
						))}
					</Grid>
				</Box>
			)}
		</Flex>
	);
};

export default MediaItems;
