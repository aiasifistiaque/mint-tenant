'use client';

import { FC, useRef, useState, useEffect, ChangeEvent } from 'react';
import { Button, InputProps, Input, Flex, Text } from '@chakra-ui/react';
import { FormControl } from '../';
import { Icon, useAddFileMutation } from '../../../';
import Link from 'next/link';
import { ExternalLinkIcon } from 'lucide-react';

type InputContainerProps = InputProps & {
	label: string;
	isRequired?: boolean;
	helper?: string;
	value: any;
	placeholder?: any;
};

const VFile: FC<InputContainerProps> = ({
	label,
	isRequired,
	placeholder,
	value,
	helper,
	...props
}) => {
	const ref = useRef(null);
	const [trigger, result] = useAddFileMutation();
	const [file, setFile] = useState<any>(null);
	const onRefClick = () => {
		if (ref.current) {
			(ref.current as any).click();
		}
	};

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			setFile(file);
			// Create a new FormData object
			const formData = new FormData();

			// Append the file to the FormData object
			formData.append('file', file);
			formData.append('folder', 'products');

			// Trigger the mutation with the FormData object
			trigger(formData);
		}
	};

	const onRemoveFile = () => {
		if (value && props.onChange) {
			const event = {
				target: {
					name: props?.name,
					value: null,
				},
			} as any;
			props.onChange(event); // Call onChange with the synthetic event
		}
	};

	useEffect(() => {
		if (!result?.isLoading && result?.isSuccess) {
			if (props.onChange) {
				const event = {
					target: {
						name: props?.name,
						value: result?.data?.data?.url,
					},
				} as any;
				props.onChange(event); // Call onChange with the synthetic event
			}
		}
	}, [result?.isLoading]);

	return (
		<FormControl
			isRequired={isRequired}
			label={label}
			helper={helper}>
			<Button
				px={3}
				size='sm'
				disabled={result?.isLoading}
				loading={result?.isLoading}
				loadingText='Uploading'
				spinnerPlacement='start'
				onClick={onRefClick}
				// leftIcon={<Icon name='copy' />}
			>
				{value ? 'Change File' : 'Upload File'}
			</Button>
			{value && (
				<Flex
					mt={2}
					align='center'
					justify='space-between'
					gap={4}>
					<Link
						target='_blank'
						rel='noopener noreferrer'
						href={value}>
						<Text {...linkCss}>View Uploaded File</Text>
					</Link>
					<Flex
						align='center'
						gap={2}
						cursor='pointer'
						onClick={onRemoveFile}>
						<Text fontSize='12px'>Remove File</Text>
						<Icon name='delete' />
					</Flex>
				</Flex>
			)}
			<Input
				ref={ref}
				{...inputCss}
				type='file'
				placeholder={placeholder ? placeholder : label}
				onChange={handleFileChange}
			/>
		</FormControl>
	);
};

const linkCss: any = {
	fontSize: '12px',
	color: 'blue.500',
	fontWeight: '500',
	textDecoration: 'underline',
	// isExternal: true,
};

const inputCss: InputProps = {
	display: 'none',
	size: 'sm',
	px: 3,
};

export default VFile;
