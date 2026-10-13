'use client';

import { FC, useState } from 'react';
import { Button, Menu, Portal, Text } from '@chakra-ui/react';
import { ChevronDown, FileDown } from 'lucide-react';
import { useDownloadMutation } from '../store/services/bulkApi';
import { useGetPdfTemplatesQuery, viewerZone } from '../store/services/pdfTemplatesApi';
import { toaster } from '@/components/ui/toaster';

/**
 * Download PDF (backend docs/pdf-templates, PT-07): a page's records printed
 * with one of its PDF templates — POST /<route>/export/template, the file
 * saved as it arrives. No template id: the page's default.
 */
export const useDownloadPdf = () => {
	const [download, { isLoading }] = useDownloadMutation();
	const run = async (route: string, ids: string[], template?: string) => {
		try {
			await download({ url: `${route}/export/template`, body: { ids, ...(template && { template }), tz: viewerZone() }, fallbackName: `${route}.pdf` }).unwrap();
			return true;
		} catch (e: any) {
			toaster.create({ type: 'error', title: 'Could not make the PDF', description: e?.data?.message || e?.message || '' });
			return false;
		}
	};
	return { download: run, isLoading };
};

/**
 * A record page's Download PDF: nothing when its page has no template, a
 * button for one, a menu (default first) for several.
 */
export const DownloadPdfButton: FC<{ route: string; id: string }> = ({ route, id }) => {
	// Drafts stay in the designer (PT-33).
	const { data } = useGetPdfTemplatesQuery({ route, published: true }, { skip: !route });
	const { download } = useDownloadPdf();
	const [busy, setBusy] = useState(false);
	const templates: any[] = data?.templates || [];
	if (!templates.length) return null;
	const go = async (template?: string) => {
		setBusy(true);
		await download(route, [id], template);
		setBusy(false);
	};
	if (templates.length === 1)
		return (
			<Button
				size='sm'
				variant='outline'
				loading={busy}
				onClick={() => go(templates[0]._id)}>
				<FileDown size={14} />
				Download PDF
			</Button>
		);
	return (
		<Menu.Root positioning={{ placement: 'bottom-end' }}>
			<Menu.Trigger asChild>
				<Button
					size='sm'
					variant='outline'
					loading={busy}>
					<FileDown size={14} />
					Download PDF
					<ChevronDown size={12} />
				</Button>
			</Menu.Trigger>
			<Portal>
				<Menu.Positioner>
					<Menu.Content minW='220px'>
						{templates.map(t => (
							<Menu.Item
								key={t._id}
								value={t._id}
								onClick={() => go(t._id)}>
								<Text flex='1'>{t.name}</Text>
								{t.isDefault && (
									<Text
										fontSize='xs'
										color='fg.muted'>
										default
									</Text>
								)}
							</Menu.Item>
						))}
					</Menu.Content>
				</Menu.Positioner>
			</Portal>
		</Menu.Root>
	);
};
