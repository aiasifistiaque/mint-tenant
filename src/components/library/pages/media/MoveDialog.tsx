'use client';

import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Flex, Input, Spinner, Text } from '@chakra-ui/react';
import { ChevronRight, Folder, FolderPlus, HardDrive } from 'lucide-react';
import { useCreateMediaFolderMutation, useGetMediaTreeQuery, MediaFolder } from '../../store/services/mediaApi';
import DiscardButton from '../../components/buttons/DiscardButton';
import { MediaDialog } from './ui';
import { useMediaRoot } from './useMediaRoot';

const NO_FOLDERS: MediaFolder[] = [];

type Props = {
	isOpen: boolean;
	onClose: () => void;
	/** Folder the items are in now — preselected, and not a useful target. */
	current: string | null;
	/** Folders being moved: they and their subtrees can't be picked. */
	movingFolders: string[];
	count: number;
	busy?: boolean;
	onConfirm: (target: string | null) => void;
};

/**
 * "Move to…" — pick a destination in a folder tree (not a flat dropdown). Folders
 * being moved, and everything inside them, are greyed out: a folder can't go
 * into itself. A new folder can be made inside the highlighted one on the spot.
 */
const MoveDialog: FC<Props> = ({ isOpen, onClose, current, movingFolders, count, busy, onConfirm }) => {
	const ROOT = useMediaRoot();
	const { data, isFetching } = useGetMediaTreeQuery(undefined, { skip: !isOpen });
	const [createFolder, { isLoading: creating }] = useCreateMediaFolderMutation();
	const [target, setTarget] = useState<string | null>(current);
	const [open, setOpen] = useState<Set<string>>(new Set());
	const [filter, setFilter] = useState('');
	const [newName, setNewName] = useState<string | null>(null);
	const findRef = useRef<HTMLInputElement>(null);

	const folders = data?.folders || NO_FOLDERS;
	const children = useMemo(() => {
		const map = new Map<string, MediaFolder[]>();
		folders.forEach(f => {
			const k = f.parent ? String(f.parent) : 'root';
			map.set(k, [...(map.get(k) || []), f]);
		});
		return map;
	}, [folders]);
	const byId = useMemo(() => new Map(folders.map(f => [f._id, f])), [folders]);

	// Moving folders and their descendants are off-limits.
	const blocked = useMemo(() => {
		const out = new Set<string>(movingFolders);
		const stack = [...movingFolders];
		while (stack.length) {
			const id = stack.pop()!;
			(children.get(id) || []).forEach(c => {
				out.add(c._id);
				stack.push(c._id);
			});
		}
		return out;
	}, [movingFolders, children]);

	// Open the path down to the current folder so it's visible.
	useEffect(() => {
		if (!isOpen) return;
		setTarget(current);
		setFilter('');
		setNewName(null);
		// Also open the current folder itself: its subfolders are the likeliest targets.
		const next = new Set<string>(current ? [current] : []);
		let id = current ? byId.get(current)?.parent : null;
		while (id) {
			next.add(String(id));
			id = byId.get(String(id))?.parent || null;
		}
		setOpen(next);
	}, [isOpen, current, byId]);

	// Bring the highlighted folder into view when the dialog opens.
	const listRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (!isOpen || !folders.length) return;
		const t = setTimeout(() => listRef.current?.querySelector('[data-target="true"]')?.scrollIntoView({ block: 'center' }), 50);
		return () => clearTimeout(t);
	}, [isOpen, folders.length]);

	const toggle = (id: string) =>
		setOpen(prev => {
			const next = new Set(prev);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		});

	const addFolder = async () => {
		const name = (newName || '').trim();
		if (!name) return;
		const res: any = await createFolder({ name, parent: target });
		if (res?.data?.doc) {
			if (target) setOpen(prev => new Set(prev).add(target));
			setTarget(res.data.doc._id);
		}
		setNewName(null);
	};

	const row = (f: MediaFolder, depth: number) => {
		const kids = children.get(f._id) || [];
		const isBlocked = blocked.has(f._id);
		const isOpenRow = open.has(f._id);
		return (
			<Box key={f._id}>
				<Flex
					data-target={target === f._id}
					align='center'
					gap={1.5}
					pl={`${8 + depth * 18}px`}
					pr={2}
					h='34px'
					borderRadius='md'
					cursor={isBlocked ? 'not-allowed' : 'pointer'}
					opacity={isBlocked ? 0.45 : 1}
					bg={target === f._id ? 'bg.muted' : undefined}
					boxShadow={target === f._id ? 'inset 0 0 0 1px var(--chakra-colors-fg)' : undefined}
					_hover={isBlocked ? undefined : { bg: target === f._id ? 'bg.muted' : 'bg.subtle' }}
					onClick={() => !isBlocked && setTarget(f._id)}
					onDoubleClick={() => kids.length && toggle(f._id)}>
					<Box
						as='button'
						w='18px'
						display='flex'
						justifyContent='center'
						color='fg.muted'
						visibility={kids.length ? 'visible' : 'hidden'}
						transform={isOpenRow ? 'rotate(90deg)' : undefined}
						transition='transform .15s'
						onClick={(e: any) => {
							e.stopPropagation();
							toggle(f._id);
						}}
						aria-label={isOpenRow ? 'Collapse' : 'Expand'}>
						<ChevronRight size={14} />
					</Box>
					<Folder size={16} />
					<Text
						fontSize='sm'
						truncate>
						{f.name}
					</Text>
					{f._id === current && (
						<Text
							fontSize='xs'
							color='fg.muted'
							ml='auto'
							flexShrink={0}>
							current
						</Text>
					)}
				</Flex>
				{isOpenRow && kids.map(k => row(k, depth + 1))}
			</Box>
		);
	};

	const term = filter.trim().toLowerCase();
	const matches = term ? folders.filter(f => f.name.toLowerCase().includes(term)) : [];
	const pathOf = (f: MediaFolder) => {
		const names: string[] = [];
		let id = f.parent ? String(f.parent) : null;
		while (id && byId.get(id)) {
			names.unshift(byId.get(id)!.name);
			id = byId.get(id)!.parent ? String(byId.get(id)!.parent) : null;
		}
		return names.join(' / ') || ROOT;
	};

	const same = target === current;

	return (
		<MediaDialog
			isOpen={isOpen}
			onClose={onClose}
			size='md'
			placement='top'
			title={`Move ${count} item${count === 1 ? '' : 's'}`}
			doc='move'
			busy={busy}
			initialFocusEl={() => findRef.current}
			footer={
				<>
					<DiscardButton
						onClick={onClose}
						disabled={busy}>
						Cancel
					</DiscardButton>
					<Button
						size='sm'
						px={3}
						loading={busy}
						disabled={same}
						onClick={() => onConfirm(target)}>
						Move here
					</Button>
				</>
			}>
			<Input
				ref={findRef}
				size='sm'
				mb={3}
				placeholder='Find a folder'
				value={filter}
				onChange={e => setFilter(e.target.value)}
			/>
			<Box
				ref={listRef}
				h='320px'
				overflowY='auto'
				borderWidth='1px'
				borderColor='border'
				borderRadius='md'
				p={1}>
				{isFetching && !folders.length ? (
					<Flex
						h='full'
						align='center'
						justify='center'>
						<Spinner size='sm' />
					</Flex>
				) : term ? (
					matches.length ? (
						matches.map(f => {
							const isBlocked = blocked.has(f._id);
							return (
								<Flex
									key={f._id}
									direction='column'
									px={3}
									py={1.5}
									borderRadius='md'
									cursor={isBlocked ? 'not-allowed' : 'pointer'}
									opacity={isBlocked ? 0.45 : 1}
									bg={target === f._id ? 'bg.muted' : undefined}
									boxShadow={target === f._id ? 'inset 0 0 0 1px var(--chakra-colors-fg)' : undefined}
									_hover={isBlocked ? undefined : { bg: target === f._id ? 'bg.muted' : 'bg.subtle' }}
									onClick={() => !isBlocked && setTarget(f._id)}>
									<Text fontSize='sm'>{f.name}</Text>
									<Text
										fontSize='xs'
										color='fg.muted'
										truncate>
										{pathOf(f)}
									</Text>
								</Flex>
							);
						})
					) : (
						<Text
							p={3}
							fontSize='sm'
							color='fg.muted'>
							No folder matches “{filter}”.
						</Text>
					)
				) : (
					<>
						<Flex
							align='center'
							gap={2}
							px={2}
							h='34px'
							borderRadius='md'
							cursor='pointer'
							bg={target === null ? 'bg.muted' : undefined}
							boxShadow={target === null ? 'inset 0 0 0 1px var(--chakra-colors-fg)' : undefined}
							_hover={{ bg: target === null ? 'bg.muted' : 'bg.subtle' }}
							onClick={() => setTarget(null)}>
							<HardDrive size={16} />
							<Text
								fontSize='sm'
								fontWeight='500'>
								{ROOT}
							</Text>
							{current === null && (
								<Text
									fontSize='xs'
									color='fg.muted'
									ml='auto'>
									current
								</Text>
							)}
						</Flex>
						{(children.get('root') || []).map(f => row(f, 1))}
					</>
				)}
			</Box>

			{newName === null ? (
				<Button
					mt={3}
					size='xs'
					variant='ghost'
					px={2}
					onClick={() => setNewName('')}>
					<FolderPlus size={14} />
					New folder in {target ? byId.get(target)?.name || 'this folder' : ROOT}
				</Button>
			) : (
				<Flex
					mt={3}
					gap={2}>
					<Input
						size='sm'
						autoFocus
						placeholder='Folder name'
						value={newName}
						onChange={e => setNewName(e.target.value)}
						onKeyDown={e => {
							if (e.key === 'Enter') addFolder();
							if (e.key === 'Escape') {
								e.stopPropagation();
								setNewName(null);
							}
						}}
					/>
					<Button
						size='sm'
						px={3}
						variant='outline'
						loading={creating}
						disabled={!newName.trim()}
						onClick={addFolder}>
						Create
					</Button>
				</Flex>
			)}
		</MediaDialog>
	);
};

export default MoveDialog;
