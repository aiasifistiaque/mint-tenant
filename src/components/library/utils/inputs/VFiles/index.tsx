'use client';

import { FC, useRef, useState, ChangeEvent } from 'react';
import { Button, Flex, Input, InputProps, Stack, Text } from '@chakra-ui/react';
import Link from 'next/link';

import { FormControl } from '../';
import { useAddFileMutation } from '../../../';

type FormDataType = {
	value: string[] | undefined;
	onChange: any;
	isRequired?: boolean;
	label?: string;
	helper?: string;
	name?: string;
	folder?: string;
	/** Same idea as `VImageArray`'s `limit` — hides the upload button once
	 *  reached instead of enforcing anything server-side. */
	limit?: number;
};

/**
 * The multi-file sibling of `VFile`: same direct-upload mechanism (no media
 * library browsing — a generic file like a PDF or spreadsheet isn't
 * previewable the way `UploadModal`'s image grid expects), but managing an
 * array of uploaded files instead of one, the way `VImageArray` manages an
 * array of images instead of one.
 *
 * `value` is a plain array of file URLs. Picking several files in one go
 * (the input is `multiple`) uploads them one at a time and appends every
 * one that succeeds — a single failed upload never loses the others.
 */
const VFiles: FC<FormDataType> = ({
	value,
	onChange,
	isRequired = false,
	label,
	helper,
	name,
	folder,
	limit = 999,
}) => {
	const ref = useRef<HTMLInputElement>(null);
	const [trigger] = useAddFileMutation();
	const [uploading, setUploading] = useState(false);
	const files = value || [];

	const emit = (next: string[]) => {
		if (onChange) {
			const event = { target: { name, value: next } } as any;
			onChange(event);
		}
	};

	const onRefClick = () => {
		if (ref.current) ref.current.click();
	};

	const handleFilesChange = async (event: ChangeEvent<HTMLInputElement>) => {
		const picked = Array.from(event.target.files || []);
		if (!picked.length) return;

		setUploading(true);
		try {
			const uploaded: string[] = [];
			for (const file of picked) {
				const fd = new FormData();
				fd.append('file', file);
				fd.append('folder', folder || 'files');
				try {
					const res = await trigger(fd).unwrap();
					const url = res?.data?.url;
					if (url) uploaded.push(url);
				} catch (err: any) {
					// One bad file (too large, wrong type, a dropped connection)
					// must never lose the files that uploaded fine before it.
					console.error('Failed to upload file:', file.name, err?.message);
				}
			}
			if (uploaded.length) emit([...files, ...uploaded]);
		} finally {
			setUploading(false);
			// Reset so picking the exact same file again still fires onChange.
			event.target.value = '';
		}
	};

	const onRemoveFile = (url: string) => emit(files.filter(existing => existing !== url));

	const fileName = (url: string) => {
		try {
			return decodeURIComponent(url.split('/').pop() || url);
		} catch {
			return url;
		}
	};

	return (
		<FormControl
			isRequired={isRequired}
			label={label}
			helper={helper}>
			<Stack
				w='full'
				gap={2}>
				{files.length > 0 && (
					<Flex
						wrap='wrap'
						align='center'
						gap={1}>
						{files.map((url, i) => (
							<Flex
								key={`${url}-${i}`}
								align='center'
								gap={1}>
								<Link
									target='_blank'
									rel='noopener noreferrer'
									href={url}>
									<Text {...linkCss}>{fileName(url)}</Text>
								</Link>
								<Text
									fontSize='12px'
									cursor='pointer'
									color={{ _light: 'red.500', _dark: 'red.400' }}
									onClick={() => onRemoveFile(url)}>
									&times;
								</Text>
								{i < files.length - 1 && <Text fontSize='12px'>,</Text>}
							</Flex>
						))}
					</Flex>
				)}

				{files.length < limit && (
					<Button
						alignSelf='flex-start'
						px={3}
						size='sm'
						disabled={uploading}
						loading={uploading}
						loadingText='Uploading'
						spinnerPlacement='start'
						onClick={onRefClick}>
						{files.length ? 'Add More Files' : 'Upload Files'}
					</Button>
				)}
			</Stack>
			<Input
				ref={ref}
				{...inputCss}
				type='file'
				multiple
				onChange={handleFilesChange}
			/>
		</FormControl>
	);
};

const linkCss: any = {
	fontSize: '12px',
	color: 'blue.500',
	fontWeight: '500',
	textDecoration: 'underline',
};

const inputCss: InputProps = {
	display: 'none',
	size: 'sm',
	px: 3,
};

export default VFiles;
