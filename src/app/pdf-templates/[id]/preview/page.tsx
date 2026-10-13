'use client';

import { Suspense, use, useEffect, useRef, useState } from 'react';
import NextLink from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Box, Button, Flex, Spinner, Text } from '@chakra-ui/react';
import { Download, PenLine, RefreshCw } from 'lucide-react';
import { Layout, useRenderPdfSampleMutation, viewerZone } from '@/components/library';
import { DocLink, ICON, designerHref, errorOf, previewDraftKey } from '../../_components/ui';

/**
 * Preview (backend docs/pdf-templates PT-18): the real PDF, in its own tab,
 * with every field filled — sample data made from the page's fields
 * (POST /pdf-templates/render, `dummy: true`), your business details and
 * saved texts where you have them. `?draft=1` shows the designer's unsaved
 * copy, which it left in localStorage.
 */
const Preview = ({ id }: { id: string }) => {
	const search = useSearchParams();
	const draft = search.get('draft') === '1';
	const [render, { isLoading }] = useRenderPdfSampleMutation();
	const [file, setFile] = useState<{ url: string; name: string } | null>(null);
	const [err, setErr] = useState('');
	const [name, setName] = useState('');
	const last = useRef('');

	const run = async () => {
		setErr('');
		let template: any = id;
		if (draft)
			try {
				const saved = JSON.parse(localStorage.getItem(previewDraftKey(id)) || 'null');
				if (saved) template = saved;
			} catch {
				/* the saved copy shows instead */
			}
		if (typeof template === 'object') setName(template.name || '');
		try {
			const r = await render({ template, dummy: true, tz: viewerZone() }).unwrap();
			if (last.current) URL.revokeObjectURL(last.current);
			last.current = r.url;
			const fileName = r.name || `${template?.name || 'Preview'}.pdf`;
			setFile({ url: r.url, name: fileName });
			if (typeof template !== 'object') setName(fileName.replace(/\.pdf$/i, ''));
		} catch (e) {
			setErr(errorOf(e, 'Could not make the preview'));
		}
	};

	useEffect(() => {
		run();
		return () => {
			if (last.current) URL.revokeObjectURL(last.current);
			last.current = '';
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id, draft]);

	useEffect(() => {
		if (name) document.title = `Preview · ${name}`;
	}, [name]);

	const download = () => {
		if (!file) return;
		const a = document.createElement('a');
		a.href = file.url;
		a.download = file.name;
		a.click();
	};
	const own = !id.startsWith('starter:');

	return (
		<Flex
			direction='column'
			h='calc(100dvh - var(--chakra-spacing-14))'>
			<Flex
				align='center'
				gap={2}
				px={{ base: 3, md: 5 }}
				py={2.5}
				borderBottomWidth='1px'
				borderColor='border'
				bg='bg.panel'
				flexWrap='wrap'>
				<Box
					minW={0}
					flex='1'>
					<Text
						fontSize='sm'
						fontWeight='600'
						truncate>
						{name || 'Preview'}
					</Text>
					<Text
						fontSize='xs'
						color='fg.muted'>
						{draft ? 'Your unsaved changes, ' : ''}every field filled with sample data — your business details and saved texts where you have them.{' '}
						<DocLink section='preview' />
					</Text>
				</Box>
				<Button
					size='xs'
					variant='ghost'
					loading={isLoading}
					onClick={run}>
					<RefreshCw {...ICON} />
					Again
				</Button>
				{own && (
					<NextLink href={designerHref(id)}>
						<Button
							size='xs'
							variant='outline'>
							<PenLine {...ICON} />
							Designer
						</Button>
					</NextLink>
				)}
				<Button
					size='xs'
					disabled={!file}
					onClick={download}>
					<Download {...ICON} />
					Download
				</Button>
			</Flex>
			<Box
				flex='1'
				minH={0}
				bg='bg.muted'>
				{file && !err ? (
					<iframe
						src={file.url}
						title='Preview'
						style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
					/>
				) : (
					<Flex
						h='full'
						align='center'
						justify='center'
						direction='column'
						gap={2}>
						{err ? (
							<Text
								fontSize='sm'
								color='red.500'>
								{err}
							</Text>
						) : (
							<>
								<Spinner />
								<Text
									fontSize='xs'
									color='fg.muted'>
									Making the PDF…
								</Text>
							</>
						)}
					</Flex>
				)}
			</Box>
		</Flex>
	);
};

const PreviewPage = ({ params }: { params: Promise<{ id: string }> }) => {
	const { id } = use(params);
	return (
		<Layout
			title='Preview'
			path='pdf-templates'
			type='pos'
			fullBleed>
			<Suspense>
				<Preview id={decodeURIComponent(id)} />
			</Suspense>
		</Layout>
	);
};

export default PreviewPage;
