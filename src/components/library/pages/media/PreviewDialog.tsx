'use client';

import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, Dialog, Flex, IconButton, Image, Input, Portal, Text, Textarea } from '@chakra-ui/react';
import { ChevronLeft, ChevronRight, Copy, Download, FileText, X } from 'lucide-react';
import { toaster } from '@/components/ui/toaster';
import { useSaveMediaFileDetailsMutation, type MediaFile } from '../../store/services/mediaApi';
import { formatBytes, formatDate, isImage, isVideo, typeLabel } from './utils';
import { DocLink } from './ui';

type Focal = { x: number; y: number } | null;
type Details = { alt: string; caption: string; focal: Focal };
const detailsOf = (f: MediaFile | null): Details => ({ alt: f?.alt || '', caption: f?.caption || '', focal: f?.focal ?? null });
const same = (a: Details, b: Details) => a.alt.trim() === b.alt.trim() && a.caption.trim() === b.caption.trim() && JSON.stringify(a.focal) === JSON.stringify(b.focal);
const pct = (n: number) => `${Math.round(n * 100)}%`;

type Props = {
	files: MediaFile[];
	index: number;
	onIndex: (i: number) => void;
	onClose: () => void;
	onCopyLink: (file: MediaFile) => void;
	onDownload: (file: MediaFile) => void;
	location?: string;
};

const Row: FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
	<Box>
		<Text
			fontSize='11px'
			textTransform='uppercase'
			letterSpacing='0.04em'
			color='fg.muted'>
			{label}
		</Text>
		<Text
			fontSize='sm'
			wordBreak='break-all'>
			{value}
		</Text>
	</Box>
);

const label: any = { fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'fg.muted', mb: 1 };

/**
 * An image's details (backend docs/cms D12): alt text, caption and the focal
 * point — set by clicking the picture. Saved together; image fields "with
 * details" and the site read them by the picture's address.
 */
const ImageDetails: FC<{ file: MediaFile; draft: Details; onChange: (d: Details) => void }> = ({ file, draft, onChange }) => {
	const [save, saving] = useSaveMediaFileDetailsMutation();
	const saved = detailsOf(file);
	const dirty = !same(draft, saved);
	const submit = async () => {
		const res = await save({ id: file._id, alt: draft.alt.trim(), caption: draft.caption.trim(), focal: draft.focal });
		if ('error' in res) toaster.create({ type: 'error', title: 'Not saved', description: (res.error as any)?.data?.message || 'Try again' });
		else toaster.create({ type: 'success', title: 'Saved' });
	};
	return (
		<Flex
			direction='column'
			gap={3}
			pt={4}
			borderTopWidth='1px'
			borderColor='border'>
			<Flex
				align='center'
				justify='space-between'>
				<Text fontWeight='600'>For the site</Text>
				<DocLink section='image-details' />
			</Flex>
			<Box>
				<Text {...label}>Alt text</Text>
				<Textarea
					size='sm'
					rows={2}
					maxLength={300}
					value={draft.alt}
					onChange={e => onChange({ ...draft, alt: e.target.value })}
					placeholder='What the picture shows — “A loaf of sourdough on a wooden board”'
					aria-label='Alt text'
				/>
				<Text
					fontSize='11.5px'
					color='fg.muted'
					mt={1}>
					Read out by screen readers and used by search engines. Pages use it wherever the picture has none of its own.
				</Text>
			</Box>
			<Box>
				<Text {...label}>Caption</Text>
				<Input
					size='sm'
					maxLength={500}
					value={draft.caption}
					onChange={e => onChange({ ...draft, caption: e.target.value })}
					aria-label='Caption'
				/>
			</Box>
			<Box>
				<Text {...label}>Focal point</Text>
				<Text fontSize='sm'>
					{draft.focal ? `${pct(draft.focal.x)} across, ${pct(draft.focal.y)} down` : 'The middle'}
					{draft.focal && (
						<Button
							size='2xs'
							variant='ghost'
							ml={2}
							onClick={() => onChange({ ...draft, focal: null })}>
							Reset
						</Button>
					)}
				</Text>
				<Text
					fontSize='11.5px'
					color='fg.muted'
					mt={1}>
					Click the picture on what matters — it stays in view when the picture is cropped to fit.
				</Text>
			</Box>
			<Flex gap={2}>
				<Button
					size='sm'
					px={3}
					disabled={!dirty}
					loading={saving.isLoading}
					onClick={submit}>
					Save
				</Button>
				{dirty && (
					<Button
						size='sm'
						variant='ghost'
						px={3}
						onClick={() => onChange(saved)}>
						Discard
					</Button>
				)}
			</Flex>
		</Flex>
	);
};

/**
 * Full-screen viewer: the file on a dark stage, a details column beside it, and
 * ←/→ (or the side arrows) to step through the files in the current view. On
 * an image, a click sets its focal point (shown as a ring) for the details below.
 */
const PreviewDialog: FC<Props> = ({ files, index, onIndex, onClose, onCopyLink, onDownload, location }) => {
	const file = index >= 0 ? files[index] : null;
	const [draft, setDraft] = useState<Details>(detailsOf(file));
	// Another file, or this one saved: start from what it has.
	useEffect(() => setDraft(detailsOf(file)), [file?._id, file?.alt, file?.caption, JSON.stringify(file?.focal ?? null)]);

	// Where the picture sits on the stage, for the focal point's ring.
	const stage = useRef<HTMLDivElement>(null);
	const img = useRef<HTMLImageElement>(null);
	const [box, setBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
	const measure = useCallback(() => {
		const s = stage.current?.getBoundingClientRect();
		const r = img.current?.getBoundingClientRect();
		setBox(s && r && r.width ? { left: r.left - s.left, top: r.top - s.top, width: r.width, height: r.height } : null);
	}, []);
	useEffect(() => {
		setBox(null);
		window.addEventListener('resize', measure);
		return () => window.removeEventListener('resize', measure);
	}, [file?._id, measure]);
	const pick = (e: React.MouseEvent<HTMLImageElement>) => {
		const r = e.currentTarget.getBoundingClientRect();
		const clamp = (n: number) => Math.min(1, Math.max(0, Math.round(n * 1000) / 1000));
		setDraft(d => ({ ...d, focal: { x: clamp((e.clientX - r.left) / r.width), y: clamp((e.clientY - r.top) / r.height) } }));
	};

	useEffect(() => {
		if (!file) return;
		const onKey = (e: KeyboardEvent) => {
			// Typing alt text or a caption moves the cursor, not to another file.
			if ((e.target as HTMLElement)?.closest?.('input, textarea')) return;
			if (e.key === 'ArrowLeft' && index > 0) onIndex(index - 1);
			if (e.key === 'ArrowRight' && index < files.length - 1) onIndex(index + 1);
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [file, index, files.length, onIndex]);

	return (
		<Dialog.Root
			size='full'
			open={!!file}
			onOpenChange={e => !e.open && onClose()}>
			<Portal>
				<Dialog.Backdrop bg='rgba(0, 0, 0, 0.85)' />
				<Dialog.Positioner>
					{/* Its own near-solid stage: the theme's backdrop is too light for a viewer. */}
					<Dialog.Content
						bg='rgba(8, 8, 8, 0.96)'
						boxShadow='none'
						borderRadius={0}
						h='100dvh'>
						{file && (
							<Flex
								h='full'
								direction={{ base: 'column', md: 'row' }}>
								<Flex
									flex={1}
									minH={0}
									direction='column'>
									<Flex
										align='center'
										gap={3}
										px={4}
										h='56px'
										color='white'>
										<IconButton
											aria-label='Close preview'
											variant='ghost'
											size='sm'
											color='white'
											_hover={{ bg: 'whiteAlpha.200' }}
											onClick={onClose}>
											<X size={18} />
										</IconButton>
										<Text
											flex={1}
											fontSize='sm'
											fontWeight='500'
											truncate
											color='white'>
											{file.name}
										</Text>
										<Text
											fontSize='xs'
											color='whiteAlpha.700'>
											{index + 1} / {files.length}
										</Text>
									</Flex>
									<Flex
										ref={stage}
										flex={1}
										minH={0}
										align='center'
										justify='center'
										position='relative'
										px={{ base: 2, md: 16 }}
										pb={4}>
										{isImage(file) ? (
											<>
												<Image
													ref={img}
													src={file.url}
													alt={draft.alt || file.name}
													maxW='100%'
													maxH='100%'
													objectFit='contain'
													borderRadius='sm'
													cursor='crosshair'
													title='Click to set the focal point'
													onLoad={measure}
													onClick={pick}
												/>
												{box && draft.focal && (
													<Box
														position='absolute'
														pointerEvents='none'
														left={`${box.left + draft.focal.x * box.width}px`}
														top={`${box.top + draft.focal.y * box.height}px`}
														w='28px'
														h='28px'
														ml='-14px'
														mt='-14px'
														borderRadius='full'
														borderWidth='2px'
														borderColor='white'
														boxShadow='0 0 0 2px rgba(0,0,0,0.55), inset 0 0 0 2px rgba(0,0,0,0.55)'
													/>
												)}
											</>
										) : isVideo(file) ? (
											<video
												src={file.url}
												controls
												style={{ maxWidth: '100%', maxHeight: '100%' }}
											/>
										) : (
											<Flex
												direction='column'
												align='center'
												gap={3}
												color='white'>
												<FileText size={64} />
												<Text color='white'>No preview for this file type</Text>
												<Button
													size='sm'
													onClick={() => onDownload(file)}>
													<Download size={14} /> Download
												</Button>
											</Flex>
										)}
										{index > 0 && (
											<IconButton
												aria-label='Previous'
												position='absolute'
												left={{ base: 1, md: 4 }}
												top='50%'
												transform='translateY(-50%)'
												borderRadius='full'
												variant='subtle'
												onClick={() => onIndex(index - 1)}>
												<ChevronLeft size={20} />
											</IconButton>
										)}
										{index < files.length - 1 && (
											<IconButton
												aria-label='Next'
												position='absolute'
												right={{ base: 1, md: 4 }}
												top='50%'
												transform='translateY(-50%)'
												borderRadius='full'
												variant='subtle'
												onClick={() => onIndex(index + 1)}>
												<ChevronRight size={20} />
											</IconButton>
										)}
									</Flex>
								</Flex>

								<Flex
									w={{ base: 'full', md: '300px' }}
									maxH={{ base: '40dvh', md: 'none' }}
									overflowY='auto'
									direction='column'
									gap={4}
									p={5}
									bg='bg.panel'
									borderLeftWidth={{ md: '1px' }}
									borderColor='border'>
									<Flex
										align='center'
										justify='space-between'>
										<Text fontWeight='600'>Details</Text>
										<DocLink section='preview' />
									</Flex>
									<Row
										label='Name'
										value={file.name}
									/>
									<Row
										label='Type'
										value={`${typeLabel(file)} · ${file.type}`}
									/>
									<Row
										label='Size'
										value={formatBytes(file.size)}
									/>
									{file.width && file.height ? (
										<Row
											label='Dimensions'
											value={`${file.width} × ${file.height} px`}
										/>
									) : null}
									{location && (
										<Row
											label='Location'
											value={location}
										/>
									)}
									<Row
										label='Uploaded'
										value={formatDate(file.createdAt)}
									/>
									<Row
										label='Link'
										value={file.url}
									/>
									<Flex gap={2}>
										<Button
											size='sm'
											variant='outline'
											px={3}
											onClick={() => onCopyLink(file)}>
											<Copy size={14} /> Copy link
										</Button>
										<Button
											size='sm'
											variant='outline'
											px={3}
											onClick={() => onDownload(file)}>
											<Download size={14} /> Download
										</Button>
									</Flex>
									{isImage(file) && !file.trashedAt && (
										<ImageDetails
											file={file}
											draft={draft}
											onChange={setDraft}
										/>
									)}
								</Flex>
							</Flex>
						)}
					</Dialog.Content>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
};

export default PreviewDialog;
