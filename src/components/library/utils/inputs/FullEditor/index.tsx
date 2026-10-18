'use client';
import React, { useMemo, useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Box, Text } from '@chakra-ui/react';
import ImageUploader from '../../../modals/upload-modal/ImageUploader';
import { useDisclosure } from '@chakra-ui/react';
import '../editor/editor.css';
import './style.css';
import { FULL_FORMATS, FULL_TOOLBAR, editorHtml } from '../editor/quill';

const QuillNoSSRWrapper = dynamic(
	async () => {
		const { default: RQ } = await import('react-quill-new');
		// Assign a display name to the component
		const Component = ({ forwardedRef, ...props }: any) => (
			<RQ
				ref={forwardedRef}
				{...props}
			/>
		);
		Component.displayName = 'QuillNoSSRWrapper';
		return Component;
	},
	{
		ssr: false,
		loading: () => <p>Loading ...</p>,
	}
);

const FullEditor = ({ value, onChange, name, isRequired, label, helper }: any) => {
	// Register quill-resize-image module for React 19 compatibility
	useEffect(() => {
		const registerImageResize = async () => {
			if (typeof window !== 'undefined') {
				try {
					const ReactQuill = (await import('react-quill-new')).default;
					const Quill = ReactQuill.Quill;
					const ImageResize = (await import('quill-resize-image')).default;

					if (Quill) {
						Quill.register('modules/resize', ImageResize);
					}
				} catch (error) {
					console.warn('Failed to register image resize module:', error);
				}
			}
		};

		registerImageResize();
	}, []);

	const quillRef = useRef(null);
	const { onOpen, open: isOpen, onClose } = useDisclosure();

	// Uncontrolled while typing (it saves clean HTML, not what Quill holds);
	// a value from outside — the record loading — remounts it.
	const emitted = useRef<string>(value || '');
	const [mount, setMount] = useState(0);
	useEffect(() => {
		if ((value || '') !== emitted.current) {
			emitted.current = value || '';
			setMount(m => m + 1);
		}
	}, [value]);

	const handleImage = (image: string) => {
		const quillObj: any = (quillRef as any)?.current?.getEditor();
		if (!quillObj) return;
		const range = quillObj.getSelection() || { index: quillObj.getLength() };
		quillObj.insertEmbed(range.index, 'image', image, 'user');
		quillObj.setSelection(range.index + 1);
	};

	const modules = useMemo(
		() => ({
			resize: {
				locale: {},
			},
			toolbar: {
				container: FULL_TOOLBAR,
				handlers: {
					image: onOpen,
				},
			},
		}),
		[onOpen]
	);

	return (
		<div className='full-editor-quill'>
			<Box mb={4}>
				{label && (
					<Text
						fontSize='sm'
						fontWeight='medium'
						mb={2}>
						{label}
						{isRequired && (
							<Text
								as='span'
								color='red.500'
								ml={1}>
								*
							</Text>
						)}
					</Text>
				)}
				{helper && (
					<Text
						fontSize='xs'
						color='fg.muted'
						mb={2}>
						{helper}
					</Text>
				)}
				<ImageUploader
					handleImage={handleImage}
					isOpen={isOpen}
					onClose={onClose}
					onOpen={onOpen}
				/>
				<QuillNoSSRWrapper
					key={mount}
					forwardedRef={quillRef}
					theme='snow'
					className='custom-quill-editor'
					style={{
						overflow: 'hidden',
						maxW: '50vw',
						marginBottom: '20px',
					}}
					modules={modules}
					formats={FULL_FORMATS}
					defaultValue={emitted.current}
					onChange={(_html: string, _delta: any, source: string, editor: any) => {
						// Only typing and the toolbar: Quill also reports loading a value
						// (source 'api'), which would mark an untouched record as changed.
						if (source !== 'user') return;
						const html = editorHtml(editor);
						if (html === emitted.current) return;
						emitted.current = html;
						onChange({ target: { name, value: html } });
					}}
				/>
			</Box>
		</div>
	);
};

export default FullEditor;
