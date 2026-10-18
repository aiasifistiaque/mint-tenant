'use client';

import { FC, useState } from 'react';
import { Button } from '@chakra-ui/react';
import { FileDown } from 'lucide-react';
import { useDownloadMutation } from '../store/services/bulkApi';
import { toaster } from '@/components/ui/toaster';

/**
 * Download DOCX: one record's rich-text field (a blog post's body) as a Word
 * file — POST /<route>/export/docx, saved as it arrives. The row menu's
 * "Download DOCX" item and the button on a rich-text field's panel use it.
 */
export const useDownloadDocx = () => {
	const [download, { isLoading }] = useDownloadMutation();
	const run = async (route: string, id: string, field: string) => {
		try {
			await download({ url: `${route}/export/docx`, body: { id, field }, fallbackName: `${field}.docx` }).unwrap();
			return true;
		} catch (e: any) {
			toaster.create({ type: 'error', title: 'Could not make the Word file', description: e?.data?.message || e?.message || '' });
			return false;
		}
	};
	return { download: run, isLoading };
};

/** A rich-text field's own Download DOCX, for the heading of its panel on a record page. */
export const DownloadDocxButton: FC<{ route: string; id?: string; field: string }> = ({ route, id, field }) => {
	const { download } = useDownloadDocx();
	const [busy, setBusy] = useState(false);
	if (!route || !id || !field) return null;
	return (
		<Button
			size='xs'
			variant='ghost'
			color='fg.muted'
			loading={busy}
			onClick={async () => {
				setBusy(true);
				await download(route, id, field);
				setBusy(false);
			}}>
			<FileDown size={14} />
			Download DOCX
		</Button>
	);
};
