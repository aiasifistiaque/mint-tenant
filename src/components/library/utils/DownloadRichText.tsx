'use client';

import { FC, ReactNode, useState } from 'react';
import { Button, Flex, Menu, Portal, Text } from '@chakra-ui/react';
import { ChevronDown, FileDown } from 'lucide-react';
import { useDownloadMutation } from '../store/services/bulkApi';
import PromptDialog from '../modals/modal-components/PromptDialog';
import { toaster } from '@/components/ui/toaster';

/**
 * Downloading one record's rich-text field (a blog post's body) as a file —
 * POST /<route>/export/richtext, saved as it arrives. The row menu's
 * "Download" item, the menu on a rich-text field's panel and the full-page
 * editor's Export use it.
 */

export type RichFormat = 'docx' | 'pdf' | 'md' | 'txt';

export const RICH_FORMATS: { value: RichFormat; label: string; ext: string; hint: string }[] = [
	{ value: 'docx', label: 'Word', ext: '.docx', hint: 'Opens in Word, Pages and Google Docs' },
	{ value: 'pdf', label: 'PDF', ext: '.pdf', hint: 'To print or send as it is' },
	{ value: 'md', label: 'Markdown', ext: '.md', hint: 'For GitHub, Notion and other editors' },
	{ value: 'txt', label: 'Plain text', ext: '.txt', hint: 'Just the words' },
];

const isFormat = (v: any): v is RichFormat => RICH_FORMATS.some(f => f.value === v);

export const useDownloadRichText = () => {
	const [download, { isLoading }] = useDownloadMutation();
	const run = async (route: string, id: string, field: string, format: RichFormat = 'docx') => {
		const f = RICH_FORMATS.find(x => x.value === format) || RICH_FORMATS[0];
		try {
			await download({ url: `${route}/export/richtext`, body: { id, field, format: f.value }, fallbackName: `${field}${f.ext}` }).unwrap();
			return true;
		} catch (e: any) {
			toaster.create({ type: 'error', title: `Could not make the ${f.label} file`, description: e?.data?.message || e?.message || '' });
			return false;
		}
	};
	return { download: run, isLoading };
};

type MenuProps = {
	route: string;
	id?: string;
	field: string;
	/** The button's words — "Download" on a panel, "Export" in the editor. */
	label?: ReactNode;
	size?: 'xs' | 'sm';
	variant?: 'ghost' | 'outline';
	/** Runs first and can stop the download — the editor saves unsaved words. */
	before?: () => Promise<boolean>;
};

/** A button that opens the four formats; picking one downloads it. */
export const DownloadRichTextMenu: FC<MenuProps> = ({ route, id, field, label = 'Download', size = 'xs', variant = 'ghost', before }) => {
	const { download } = useDownloadRichText();
	const [busy, setBusy] = useState(false);
	if (!route || !id || !field) return null;
	const go = async (format: RichFormat) => {
		setBusy(true);
		if (!before || (await before())) await download(route, id, field, format);
		setBusy(false);
	};
	return (
		<Menu.Root positioning={{ placement: 'bottom-end' }}>
			<Menu.Trigger asChild>
				<Button
					size={size}
					variant={variant}
					color={variant === 'ghost' ? 'fg.muted' : undefined}
					loading={busy}>
					<FileDown size={14} />
					{label}
					<ChevronDown size={12} />
				</Button>
			</Menu.Trigger>
			<Portal>
				<Menu.Positioner>
					<Menu.Content minW='220px'>
						{RICH_FORMATS.map(f => (
							<Menu.Item
								key={f.value}
								value={f.value}
								onClick={() => go(f.value)}>
								<Text flex='1'>{f.label}</Text>
								<Text
									fontSize='xs'
									color='fg.muted'
									fontFamily='mono'>
									{f.ext}
								</Text>
							</Menu.Item>
						))}
					</Menu.Content>
				</Menu.Positioner>
			</Portal>
		</Menu.Root>
	);
};

/**
 * The row menu's "Download" set to ask each time: the four formats to pick
 * from, then Download. `label` is the field's name ("Body").
 */
export const DownloadFormatDialog: FC<{ route: string; id: string; field: string; label?: string; onClose: () => void }> = ({ route, id, field, label, onClose }) => {
	const { download, isLoading } = useDownloadRichText();
	const [format, setFormat] = useState<RichFormat>(() => {
		try {
			const last = localStorage.getItem('mint.richFormat');
			return isFormat(last) ? last : 'docx';
		} catch {
			return 'docx';
		}
	});
	const go = async () => {
		try {
			localStorage.setItem('mint.richFormat', format);
		} catch {}
		if (await download(route, id, field, format)) onClose();
	};
	return (
		<PromptDialog
			open
			onClose={onClose}
			onConfirm={go}
			tone='default'
			icon={<FileDown size={18} strokeWidth={1.75} />}
			title={`Download ${label || 'this field'}`}
			description='Pick the kind of file.'
			confirmLabel='Download'
			loading={isLoading}
			loadingText='Making the file'>
			<Flex
				direction='column'
				gap={1.5}
				role='radiogroup'>
				{RICH_FORMATS.map(f => {
					const on = f.value === format;
					return (
						<Flex
							key={f.value}
							as='button'
							role='radio'
							aria-checked={on}
							onClick={() => setFormat(f.value)}
							onDoubleClick={() => !isLoading && go()}
							align='center'
							gap={3}
							px={3}
							py={2}
							textAlign='left'
							borderWidth='1px'
							borderRadius='md'
							borderColor={on ? 'colorPalette.solid' : 'border'}
							bg={on ? 'colorPalette.subtle' : 'transparent'}
							colorPalette='brand'
							cursor='pointer'
							_hover={{ borderColor: on ? 'colorPalette.solid' : 'border.emphasized' }}>
							<Flex
								direction='column'
								flex={1}
								minW={0}>
								<Text
									fontSize='13px'
									fontWeight='500'>
									{f.label}
								</Text>
								<Text
									fontSize='xs'
									color='fg.muted'>
									{f.hint}
								</Text>
							</Flex>
							<Text
								fontSize='xs'
								color='fg.muted'
								fontFamily='mono'>
								{f.ext}
							</Text>
						</Flex>
					);
				})}
			</Flex>
		</PromptDialog>
	);
};
