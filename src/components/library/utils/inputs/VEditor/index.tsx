'use client';
import { useEffect, useState, useRef, useMemo } from 'react';
import { FormControl } from '../input-components';
import dynamic from 'next/dynamic';

const URL = {
	backend: process.env.NEXT_PUBLIC_BACKEND,
	api: process.env.NEXT_PUBLIC_BACKEND,
};

import 'react-quill-new/dist/quill.snow.css';

// Dynamically import ReactQuill without SSR
const ReactQuill: any = dynamic(() => import('react-quill-new').then(mod => mod.default), {
	ssr: false,
});

// Dynamically import Quill without SSR (if needed)
const Quill: any = dynamic(() => import('react-quill-new').then((mod: any) => mod.Quill), {
	ssr: false,
});

import { ImageUploader } from '@/components/library/modals';

import { useDisclosure } from '@chakra-ui/react';

const HEIGHT = 400;
const MARGIN_BOTTOM = '50px';

interface QuillEditorProps {
	value: string;
	onChange: any;
	name: any;
	isRequired?: boolean;
	label?: string;
	helper?: string;
	type?: 'blog' | 'basic';
}

const QuillEditor = ({
	value,
	onChange,
	name,
	isRequired,
	label,
	helper,
	type = 'blog',
}: QuillEditorProps) => {
	const [mounted, setMounted] = useState(false);

	const { onOpen, open: isOpen, onClose } = useDisclosure();

	const container = [
		[{ header: [1, 2, 3, 4, 5, 6, false] }],
		['bold', 'italic', 'underline', 'strike'],
		[{ font: ['Roboto'] }],
		[{ align: [] }],
		[{ script: 'sub' }, { script: 'super' }],
		[{ color: [] }, { background: [] }], // dropdown with defaults from theme
		['blockquote', 'code-block'],
		['clean'],
		[{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
		['image', 'link'],
	];

	const basicContainer = [
		['bold', 'italic', 'underline', 'strike'],
		[{ align: [] }],
		[{ script: 'sub' }, { script: 'super' }],
		[{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
	];

	// useEffect(() => {
	// 	const ImageResize = require('quill-image-resize-module-react').default;
	// 	if (Quill && typeof window !== 'undefined') {
	// 		Quill.register('modules/imageResize', ImageResize);
	// 	}
	// }, []);

	const quillRef = useRef<any>(null);

	useEffect(() => {
		setMounted(true);
		return () => setMounted(false);
	}, []);

	const handleImage = (image: string) => {
		const quillObj: any = quillRef?.current?.getEditor();
		if (!quillObj) console.log('Quill Object Not Found');
		const range = quillObj.getSelection() || { index: 0 };
		quillObj.insertEmbed(range.index, 'image', image);
		quillObj.setSelection(range.index + 1);
	};

	const modules = useMemo(
		() => ({
			imageResize: {
				modules: ['Resize', 'DisplaySize'],
			},
			toolbar: {
				clipboard: {
					// toggle to add extra line breaks when pasting HTML:
					matchVisual: false,
				},
				container: type === 'blog' ? container : basicContainer,
				handlers: {
					image: onOpen,
				},
			},
		}),
		[]
	);

	return (
		<FormControl
			isRequired={isRequired}
			label={label || ''}
			helper={helper}
			minHeight={HEIGHT}>
			<ImageUploader
				handleImage={handleImage}
				isOpen={isOpen}
				onClose={onClose}
				onOpen={onOpen}
			/>
			{mounted && (
				<ReactQuill
					ref={quillRef}
					style={quillStyle}
					theme='snow'
					value={value}
					modules={modules}
					onChange={(content: any, _delta: any, _source: any, editor: any) => {
						onChange({
							target: {
								name,
								value: editor.getHTML(),
							},
						});
					}}
				/>
			)}
		</FormControl>
	);
};

const quillStyle = {
	backgroundColor: 'white',
	minHeight: HEIGHT,
	height: HEIGHT,
	marginBottom: MARGIN_BOTTOM,
};

export default QuillEditor;
