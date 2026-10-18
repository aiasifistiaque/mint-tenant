'use client';
import React, { useMemo, useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import './editor/editor.css';
import { FormControl } from './input-components';
import ImageUploader from '../../modals/upload-modal/ImageUploader';
import { useDisclosure } from '@chakra-ui/react';
import { BASIC_FORMATS, BASIC_TOOLBAR, FULL_FORMATS, FULL_TOOLBAR, editorHtml } from './editor/quill';

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
		loading: () => <div style={{ height: 200 }} />,
	}
);

/**
 * The `editor` and `basic-editor` field input (Quill). It saves clean HTML
 * (editor/quill.ts) a site can show. Quill keeps its own markup inside, so it
 * runs uncontrolled while typing: a value from outside (the record loading,
 * a reset) remounts it.
 */
const QuillEditor = ({ value, onChange, name, isRequired, label, helper, type, readOnly }: any) => {
	// FormInput passes the field's own type ('basic-editor') after the descriptor's 'basic'.
	const basic = type === 'basic' || type === 'basic-editor';
	// The full-page editor (RichTextEditorPage): the full toolbar over a page of paper.
	const doc = type === 'document';
	// Register quill-resize-image module for React 19 compatibility
	useEffect(() => {
		if (basic) return;
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
	}, [basic]);

	const quillRef = useRef(null);
	const { onOpen, open: isOpen, onClose } = useDisclosure();

	// What this editor last sent; any other value came from outside.
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
		() =>
			basic
				? { toolbar: { container: BASIC_TOOLBAR } }
				: {
						resize: {
							locale: {},
						},
						toolbar: {
							container: FULL_TOOLBAR,
							handlers: {
								image: onOpen,
							},
						},
					},
		[basic]
	);

	return (
		<>
			<FormControl
				isRequired={isRequired}
				label={label}
				helper={helper}>
				{!basic && (
					<ImageUploader
						handleImage={handleImage}
						isOpen={isOpen}
						onClose={onClose}
						onOpen={onOpen}
					/>
				)}
				<QuillNoSSRWrapper
					key={mount}
					forwardedRef={quillRef}
					theme='snow'
					className={`mint-editor${basic ? ' mint-editor--basic' : ''}${doc ? ' mint-editor--doc' : ''}${readOnly ? ' is-readonly' : ''}`}
					readOnly={readOnly}
					placeholder={doc ? 'Start writing…' : undefined}
					modules={modules}
					formats={basic ? BASIC_FORMATS : FULL_FORMATS}
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
			</FormControl>
		</>
	);
};

export default QuillEditor;
