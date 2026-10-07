'use client';

import { FC, useEffect } from 'react';
import { Box, Button, Dialog, Flex, IconButton, Image, Portal, Text } from '@chakra-ui/react';
import { ChevronLeft, ChevronRight, Copy, Download, FileText, X } from 'lucide-react';
import type { MediaFile } from '../../store/services/mediaApi';
import { formatBytes, formatDate, isImage, isVideo, typeLabel } from './utils';
import { DocLink } from './ui';

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

/**
 * Full-screen viewer: the file on a dark stage, a details column beside it, and
 * ←/→ (or the side arrows) to step through the files in the current view.
 */
const PreviewDialog: FC<Props> = ({ files, index, onIndex, onClose, onCopyLink, onDownload, location }) => {
	const file = index >= 0 ? files[index] : null;

	useEffect(() => {
		if (!file) return;
		const onKey = (e: KeyboardEvent) => {
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
										flex={1}
										minH={0}
										align='center'
										justify='center'
										position='relative'
										px={{ base: 2, md: 16 }}
										pb={4}>
										{isImage(file) ? (
											<Image
												src={file.url}
												alt={file.name}
												maxW='100%'
												maxH='100%'
												objectFit='contain'
												borderRadius='sm'
											/>
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
