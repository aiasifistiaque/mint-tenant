// import { useState, useEffect, forwardRef } from 'react';
// import dynamic from 'next/dynamic';
// import type ReactQuill from 'react-quill';

// interface QuillProps {
// 	value?: string;
// 	onChange?: (content: string, delta: any, source: any, editor: any) => void;
// 	modules?: any;
// 	style?: React.CSSProperties;
// 	theme?: string;
// }

// const QuillComponent = forwardRef<ReactQuill, QuillProps>((props, ref) => {
// 	const [Quill, setQuill] = useState<any>(null);

// 	useEffect(() => {
// 		let mounted = true;

// 		const loadQuill = async () => {
// 			const quillModule = await import('react-quill');
// 			if (mounted) {
// 				setQuill(() => quillModule.default);
// 			}
// 		};

// 		loadQuill();
// 		return () => {
// 			mounted = false;
// 		};
// 	}, []);

// 	if (!Quill) {
// 		return <div style={{ height: '600px', backgroundColor: '#f9f9f9' }}>Loading editor...</div>;
// 	}

// 	return (
// 		<Quill
// 			ref={ref}
// 			{...props}
// 		/>
// 	);
// });

// QuillComponent.displayName = 'QuillComponent';

// const QuillNoSSRWrapper = dynamic(() => Promise.resolve(QuillComponent), {
// 	ssr: false,
// 	loading: () => (
// 		<div style={{ height: '600px', backgroundColor: '#f9f9f9' }}>Loading editor...</div>
// 	),
// });

// export default QuillNoSSRWrapper;

import React from 'react';

const QuillNoSSRWrapper = () => {
	return <div>QuillNoSSRWrapper</div>;
};

export default QuillNoSSRWrapper;
