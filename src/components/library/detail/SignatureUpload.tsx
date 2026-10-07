import { FC, useRef, useState } from 'react';
import { Box, Button, Flex, Image, Spinner, Text } from '@chakra-ui/react';
import { ImageUp, PenLine } from 'lucide-react';
import { useUploadSignatureMutation } from '../store';
import SignaturePad from './SignaturePad';

type SignatureUploadProps = {
	value?: string;
	onChange: (url: string) => void;
	helper?: string;
};

// Dedicated uploader for the admin's signature — drawn on the pad (finger,
// stylus, mouse or trackpad) or uploaded as an image; both end up as the same
// uploaded PNG/image URL. Unlike the generic image
// picker, this never browses or saves into the shared media library — it
// uploads straight to S3 (see POST /upload/signature) and only ever hands
// back a URL for the admin's own `signature` field.
//
// A drop zone the size of the preview: click it or drop an image on it. The
// preview is paper-white in both themes, since a signature is dark ink on a
// transparent image and disappears on a dark panel.
const SignatureUpload: FC<SignatureUploadProps> = ({ value, onChange, helper }) => {
	const inputRef = useRef<HTMLInputElement>(null);
	const [uploadSignature, result] = useUploadSignatureMutation();
	const [over, setOver] = useState(false);
	const [error, setError] = useState('');
	const [mode, setMode] = useState<'draw' | 'upload'>('draw');

	const pick = () => !result.isLoading && inputRef.current?.click();

	const upload = async (file?: File) => {
		setError('');
		if (!file) return;
		if (!file.type.startsWith('image/')) return setError('That isn’t an image. Use a PNG, JPG or WebP.');

		const formData = new FormData();
		formData.append('image', file);

		const res: any = await uploadSignature(formData);
		const url = res?.data?.data?.url;
		if (url) onChange(url);
		else setError(res?.error?.data?.message || 'Upload failed. Try again.');
	};

	const tabs = (
		<Flex
			role='tablist'
			aria-label='How to add your signature'
			gap={1}
			p='3px'
			borderRadius='md'
			bg='bg.muted'
			w='fit-content'>
			{[
				{ id: 'draw' as const, label: 'Draw', Icon: PenLine },
				{ id: 'upload' as const, label: 'Upload', Icon: ImageUp },
			].map(t => (
				<Button
					key={t.id}
					role='tab'
					aria-selected={mode === t.id}
					size='xs'
					h='26px'
					px={3}
					variant={mode === t.id ? 'outline' : 'ghost'}
					bg={mode === t.id ? 'bg' : 'transparent'}
					onClick={() => {
						setMode(t.id);
						setError('');
					}}>
					<t.Icon size={13} />
					{t.label}
				</Button>
			))}
		</Flex>
	);

	if (mode === 'draw')
		return (
			<Flex
				direction='column'
				gap={3}>
				{tabs}
				{value && (
					<Flex
						align='center'
						gap={3}>
						<Flex
							h='56px'
							px={3}
							align='center'
							borderRadius='md'
							borderWidth='1px'
							borderColor='border'
							bg='white'>
							<Image
								src={value}
								alt='Current signature'
								maxH='44px'
								maxW='160px'
								objectFit='contain'
							/>
						</Flex>
						<Text
							fontSize='12px'
							color='fg.muted'>
							Your current signature. Draw below to replace it.
						</Text>
					</Flex>
				)}
				<SignaturePad
					// A fresh, empty pad once a drawn signature is saved as the value.
					key={value || 'empty'}
					busy={result.isLoading}
					onDone={upload}
				/>
				{error && (
					<Text
						fontSize='12px'
						color='red.fg'>
						{error}
					</Text>
				)}
			</Flex>
		);

	return (
		<Flex
			direction='column'
			gap={2}>
			{tabs}
			<input
				ref={inputRef}
				type='file'
				accept='image/*'
				style={{ display: 'none' }}
				onChange={e => {
					const file = e.target.files?.[0];
					e.target.value = '';
					upload(file);
				}}
			/>
			<Flex
				role='button'
				tabIndex={0}
				aria-label={value ? 'Replace signature image' : 'Upload a signature image'}
				onClick={pick}
				onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), pick())}
				onDragOver={e => {
					e.preventDefault();
					setOver(true);
				}}
				onDragLeave={() => setOver(false)}
				onDrop={e => {
					e.preventDefault();
					setOver(false);
					upload(e.dataTransfer.files?.[0]);
				}}
				position='relative'
				h='140px'
				align='center'
				justify='center'
				borderRadius='lg'
				borderWidth='1px'
				borderStyle='dashed'
				borderColor={over ? 'fg' : 'border.emphasized'}
				bg={value ? 'white' : over ? 'bg.muted' : 'bg.subtle'}
				cursor={result.isLoading ? 'progress' : 'pointer'}
				overflow='hidden'
				transition='border-color 150ms, background-color 150ms'
				_hover={{ borderColor: 'fg.muted' }}
				_focusVisible={{ outline: '2px solid', outlineColor: 'fg', outlineOffset: '2px' }}>
				{value && (
					<Image
						src={value}
						alt='Signature'
						maxH='96px'
						maxW='70%'
						objectFit='contain'
						opacity={result.isLoading ? 0.3 : 1}
					/>
				)}
				{result.isLoading ? (
					<Flex
						position='absolute'
						direction='column'
						align='center'
						gap={2}
						color={value ? 'gray.600' : 'fg.muted'}>
						<Spinner size='sm' />
						<Text fontSize='13px'>Uploading…</Text>
					</Flex>
				) : (
					!value && (
						<Flex
							direction='column'
							align='center'
							gap={2}
							color='fg.muted'
							textAlign='center'
							px={4}>
							<ImageUp
								size={20}
								strokeWidth={1.5}
							/>
							<Text fontSize='13px'>
								<Text
									as='span'
									color='fg'
									fontWeight='500'>
									Choose an image
								</Text>{' '}
								or drop it here
							</Text>
						</Flex>
					)
				)}
			</Flex>

			<Flex
				align='center'
				justify='space-between'
				gap={3}
				flexWrap='wrap'>
				<Text
					fontSize='12px'
					color={error ? 'red.fg' : 'fg.muted'}>
					{error || helper || 'PNG, JPG or WebP. Click the box or drop a file to replace it.'}
				</Text>
				{value && (
					<Button
						size='xs'
						px={2}
						variant='ghost'
						disabled={result.isLoading}
						onClick={pick}>
						Choose another
					</Button>
				)}
			</Flex>
		</Flex>
	);
};

export default SignatureUpload;
