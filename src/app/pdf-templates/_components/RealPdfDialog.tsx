'use client';

import { FC, useEffect, useRef, useState } from 'react';
import { Box, Button, Flex, Spinner, Text } from '@chakra-ui/react';
import { Download, ExternalLink } from 'lucide-react';
import { useRenderPdfRecordsMutation, useRenderPdfSampleMutation, viewerZone } from '@/components/library';
import { PdfTemplate } from '@/components/library/pdf/types';
import Shell from './Shell';
import { ICON, errorOf } from './ui';

/**
 * The file itself, as the server makes it from the working copy (saved or
 * not): with the record the designer shows, else the template's sample data.
 * Page breaks, repeated table headings and page numbers are only here.
 */
const RealPdfDialog: FC<{ open: boolean; onClose: () => void; template: PdfTemplate; recordId?: string }> = ({ open, onClose, template, recordId }) => {
	const [byRecord] = useRenderPdfRecordsMutation();
	const [bySample] = useRenderPdfSampleMutation();
	const [url, setUrl] = useState('');
	const [err, setErr] = useState('');
	const last = useRef('');

	useEffect(() => {
		if (!open) return;
		let alive = true;
		setUrl('');
		setErr('');
		const run = async () => {
			try {
				const r =
					recordId && template.route
						? await byRecord({ route: template.route, ids: [recordId], template, tz: viewerZone() }).unwrap()
						: await bySample({ template, tz: viewerZone() }).unwrap();
				if (!alive) return URL.revokeObjectURL(r.url);
				last.current = r.url;
				setUrl(r.url);
			} catch (e) {
				if (alive) setErr(errorOf(e, 'Could not make the PDF'));
			}
		};
		run();
		return () => {
			alive = false;
			if (last.current) URL.revokeObjectURL(last.current);
			last.current = '';
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open]);

	return (
		<Shell
			open={open}
			onClose={onClose}
			title='Real PDF'
			description={recordId ? 'The file Download PDF makes for this record, with your unsaved changes.' : 'The file with sample data — pick a record above the page to see one of yours.'}
			maxW='980px'
			footer={
				<>
					<Button
						size='xs'
						h='28px'
						px={3}
						variant='ghost'
						mr='auto'
						disabled={!url}
						onClick={() => window.open(url, '_blank', 'noopener')}>
						<ExternalLink {...ICON} />
						Open in a new tab
					</Button>
					<Button
						size='xs'
						h='28px'
						px={3}
						variant='outline'
						onClick={onClose}>
						Close
					</Button>
					<Button
						size='xs'
						h='28px'
						px={3}
						disabled={!url}
						onClick={() => {
							const a = document.createElement('a');
							a.href = url;
							a.download = `${template.name || 'document'}.pdf`;
							a.click();
						}}>
						<Download {...ICON} />
						Download
					</Button>
				</>
			}>
			<Box
				h='72vh'
				borderRadius='md'
				overflow='hidden'
				bg='bg.muted'>
				{url ? (
					<iframe
						src={url}
						title='PDF'
						style={{ width: '100%', height: '100%', border: 0 }}
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
							<Spinner />
						)}
					</Flex>
				)}
			</Box>
		</Shell>
	);
};

export default RealPdfDialog;
