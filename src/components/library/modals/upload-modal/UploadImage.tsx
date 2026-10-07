import React from 'react';
import { Button, Center, Progress, Text } from '@chakra-ui/react';
import { CircleAlert, Upload } from 'lucide-react';
import { useAddVideoMutation } from '../../store';

const HINT: Record<string, string> = {
	image: 'PNG, JPG, GIF, WebP or SVG',
	video: 'MP4 or WebM video',
};

const ACCEPT: Record<string, string> = {
	image: 'image/*',
	video: 'video/*',
};

/**
 * The upload modal's "Upload" tab: drop a file, choose one, or paste an image
 * from the clipboard. A finished upload is inserted straight away.
 */
const UploadImage = ({
	handleSelect,
	fileType = 'image',
	folder,
	active = true,
}: {
	handleSelect: any;
	fileType?: string;
	folder?: string;
	/** Whether this tab is the one showing — the paste shortcut only listens then. */
	active?: boolean;
}) => {
	const [file, setFile] = React.useState<File | null>(null);
	const [isDragOver, setIsDragOver] = React.useState(false);
	const inputRef = React.useRef<HTMLInputElement>(null);

	const [trigger, result] = useAddVideoMutation();

	const upload = (f: File) => {
		setFile(f);
		const formData = new FormData();
		formData.append('image', f);
		formData.append('folder', folder || 'uploads');
		trigger({ body: formData, type: fileType });
	};

	const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const f = event.target.files?.[0];
		if (f) upload(f);
		event.target.value = '';
	};

	const onDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragOver(false);
		const f = e.dataTransfer.files?.[0];
		if (f) upload(f);
	};

	// A screenshot on the clipboard uploads with ⌘V / Ctrl+V while this tab is open.
	React.useEffect(() => {
		if (fileType !== 'image' || !active) return;
		const onPaste = (e: ClipboardEvent) => {
			const f = Array.from(e.clipboardData?.files || []).find(x => x.type.startsWith('image/'));
			if (!f || result.isLoading) return;
			e.preventDefault();
			upload(f);
		};
		document.addEventListener('paste', onPaste);
		return () => document.removeEventListener('paste', onPaste);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fileType, result.isLoading, folder, active]);

	React.useEffect(() => {
		if (!result?.isLoading && result?.isSuccess) handleSelect(result?.data?.data?.url);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [result?.isLoading]);

	const retry = () => {
		result.reset();
		setFile(null);
	};

	const noun = fileType === 'video' ? 'a video' : fileType === 'image' ? 'an image' : 'a file';

	let body: React.ReactNode;
	if (result.isLoading)
		body = (
			<>
				<Text
					fontSize='14px'
					fontWeight='600'>
					Uploading…
				</Text>
				<Text
					fontSize='12px'
					color='fg.muted'
					maxW='320px'
					truncate>
					{file?.name}
				</Text>
				<Progress.Root
					w='260px'
					size='xs'
					mt={2}
					value={null}>
					<Progress.Track borderRadius='full'>
						<Progress.Range />
					</Progress.Track>
				</Progress.Root>
			</>
		);
	else if (result.isSuccess)
		body = (
			<Text
				fontSize='14px'
				fontWeight='600'>
				Uploaded
			</Text>
		);
	else if (result.isError)
		body = (
			<>
				<Center
					boxSize='44px'
					borderRadius='full'
					bg='red.subtle'
					color='red.fg'
					mb={1}>
					<CircleAlert size={20} />
				</Center>
				<Text
					fontSize='14px'
					fontWeight='600'>
					The upload didn’t go through
				</Text>
				<Text
					fontSize='12px'
					color='fg.muted'
					maxW='360px'>
					{(result as any)?.error?.data?.message || 'Check your connection and the file, then try again.'}
				</Text>
				<Button
					mt={2}
					size='sm'
					variant='outline'
					onClick={retry}>
					Try again
				</Button>
			</>
		);
	else
		body = (
			<>
				<Center
					boxSize='44px'
					borderRadius='full'
					bg={isDragOver ? 'accent.solid' : 'bg.muted'}
					color={isDragOver ? 'accent.contrast' : 'fg.muted'}
					mb={1}
					transition='all .15s ease'>
					<Upload size={20} />
				</Center>
				<Text
					fontSize='14px'
					fontWeight='600'>
					{isDragOver ? 'Drop to upload' : `Drag ${noun} here`}
				</Text>
				<Text
					fontSize='12px'
					color='fg.muted'>
					{HINT[fileType] || 'Any file'}
					{fileType === 'image' && ' · or paste one from the clipboard'}
				</Text>
				<Button
					mt={2}
					size='sm'
					variant='outline'
					onClick={() => inputRef.current?.click()}>
					Choose file
				</Button>
			</>
		);

	return (
		<Center
			flexDir='column'
			textAlign='center'
			gap={1}
			minH={{ base: '260px', md: '360px' }}
			h='full'
			px={4}
			borderRadius='xl'
			borderWidth='1.5px'
			borderStyle='dashed'
			borderColor={isDragOver ? 'accent.solid' : 'border.emphasized'}
			bg={isDragOver ? 'accent.subtle' : 'bg.subtle'}
			transition='all .15s ease'
			onDragOver={e => {
				e.preventDefault();
				setIsDragOver(true);
			}}
			onDragLeave={e => {
				e.preventDefault();
				setIsDragOver(false);
			}}
			onDrop={onDrop}>
			<input
				type='file'
				ref={inputRef}
				accept={ACCEPT[fileType]}
				style={{ display: 'none' }}
				onChange={onFileChange}
			/>
			{body}
		</Center>
	);
};

export default UploadImage;
