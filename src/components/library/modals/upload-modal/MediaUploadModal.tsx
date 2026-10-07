'use client';
import { useEffect, useRef, useState, FC } from 'react';
import { Box, Button, Flex, Heading, Progress, Text, VStack } from '@chakra-ui/react';
import { LuCheck, LuUpload, LuX } from 'react-icons/lu';

import { useUploadMultipleImagesMutation, useAppSelector } from '../..';
import { styles } from '.';
import {
	GenericModal,
	GenericModalHeader,
	GenericModalCloseButton,
	GenericModalBody,
	GenericModalContent,
} from '../..';

type MediaUploadModalProps = {
	isOpen: boolean;
	onClose: () => void;
	initialFiles?: File[] | null;
	folder?: string;
	path?: string;
};

const formatBytes = (bytes: number) => {
	if (!bytes) return '0 B';
	const units = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(1024));
	return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
};

const MediaUploadModal: FC<MediaUploadModalProps> = ({
	isOpen,
	onClose,
	initialFiles,
	folder,
	path = 'images',
}) => {
	const { currentPath } = useAppSelector(state => state.table);
	const [files, setFiles] = useState<File[]>([]);
	const [isDragOver, setIsDragOver] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const [trigger, result] = useUploadMultipleImagesMutation();

	useEffect(() => {
		if (isOpen && initialFiles?.length) {
			setFiles(initialFiles);
		}
	}, [isOpen, initialFiles]);

	const handleClose = () => {
		setFiles([]);
		onClose();
	};

	const addFiles = (incoming: FileList | File[]) => {
		setFiles(prev => [...prev, ...Array.from(incoming)]);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragOver(false);
		if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
	};

	const handleUpload = async () => {
		if (!files.length) return;
		await trigger({ files, folder: folder || currentPath, path });
	};

	const removeFile = (index: number) => setFiles(prev => prev.filter((_, i) => i !== index));

	const isDone = result?.isSuccess || result?.isError;

	return (
		<GenericModal
			isOpen={isOpen}
			onClose={handleClose}
			size='lg'
			isCentered>
			<GenericModalContent {...styles.modalContentCss}>
				<GenericModalHeader
					px={{ base: 4, md: 6 }}
					pb={2}
					pt={4}>
					Add Media
				</GenericModalHeader>
				<GenericModalCloseButton />
				<GenericModalBody
					minH='40vh'
					px={{ base: 4, md: 6 }}
					pb={4}>
					{result?.isLoading ? (
						<VStack
							gap={4}
							py={10}>
							<Heading size='md'>Uploading {files.length} file(s)...</Heading>
							<Progress.Root
								colorPalette='brand'
								w='100%'
								size='sm'
								borderRadius='40px'
								value={null}>
								<Progress.Track>
									<Progress.Range />
								</Progress.Track>
							</Progress.Root>
						</VStack>
					) : isDone ? (
						<VStack
							gap={2}
							align='stretch'
							py={2}>
							<Text fontWeight={500}>
								{result?.data
									? `${result.data.uploaded} uploaded, ${result.data.failed} failed`
									: 'Upload failed'}
							</Text>
							{result?.data?.results?.map((r: any, i: number) => (
								<Flex
									key={i}
									align='center'
									gap={2}
									px={2}
									py={1}
									borderRadius='md'
									bg='bg.subtle'>
									{r.ok ? (
										<LuCheck color='var(--chakra-colors-green-500)' />
									) : (
										<LuX color='var(--chakra-colors-red-500)' />
									)}
									<Text
										fontSize='sm'
										flex={1}
										truncate>
										{r.originalName}
									</Text>
									{!r.ok && (
										<Text
											fontSize='xs'
											color='red.500'>
											{r.error}
										</Text>
									)}
								</Flex>
							))}
						</VStack>
					) : (
						<VStack
							gap={3}
							align='stretch'>
							<Box
								onDragOver={e => {
									e.preventDefault();
									setIsDragOver(true);
								}}
								onDragLeave={e => {
									e.preventDefault();
									setIsDragOver(false);
								}}
								onDrop={handleDrop}
								onClick={() => inputRef.current?.click()}
								cursor='pointer'
								borderRadius='8px'
								border='2px dashed'
								borderColor={isDragOver ? 'accent.solid' : 'border'}
								backgroundColor={isDragOver ? 'accent.subtle' : 'transparent'}
								transition='all 0.2s ease'
								py={10}
								textAlign='center'>
								<input
									ref={inputRef}
									type='file'
									accept='image/*'
									multiple
									style={{ display: 'none' }}
									onChange={e => e.target.files && addFiles(e.target.files)}
								/>
								<Box mb={2}>
									<LuUpload size={28} />
								</Box>
								<Heading size='md'>
									{isDragOver ? 'Drop images here' : 'Drag and drop images here'}
								</Heading>
								<Text
									mt={1}
									fontSize='sm'
									color='fg.muted'>
									or click to browse — single or multiple
								</Text>
							</Box>

							{files.length > 0 && (
								<VStack
									align='stretch'
									gap={1}
									maxH='200px'
									overflowY='auto'>
									{files.map((file, i) => (
										<Flex
											key={`${file.name}-${i}`}
											align='center'
											gap={2}
											px={2}
											py={1}
											borderRadius='md'
											bg='bg.subtle'>
											<Text
												fontSize='sm'
												flex={1}
												truncate>
												{file.name}
											</Text>
											<Text
												fontSize='xs'
												color='fg.muted'>
												{formatBytes(file.size)}
											</Text>
											<Box
												as='span'
												cursor='pointer'
												onClick={() => removeFile(i)}>
												<LuX size={14} />
											</Box>
										</Flex>
									))}
								</VStack>
							)}
						</VStack>
					)}
				</GenericModalBody>

				<Flex
					px={{ base: 4, md: 6 }}
					py={3}
					gap={2}
					justify='flex-end'
					border='1px solid'
					borderBottomRadius='md'
					borderColor={{ _light: 'border.light', _dark: 'border.dark' }}>
					<Button
						px={3}
						size='sm'
						variant='outline'
						onClick={handleClose}>
						{isDone ? 'Close' : 'Cancel'}
					</Button>
					{!isDone && (
						<Button
							px={3}
							size='sm'
							disabled={!files.length}
							loading={result?.isLoading}
							onClick={handleUpload}>
							Upload {files.length > 0 ? `(${files.length})` : ''}
						</Button>
					)}
				</Flex>
			</GenericModalContent>
		</GenericModal>
	);
};

export default MediaUploadModal;
