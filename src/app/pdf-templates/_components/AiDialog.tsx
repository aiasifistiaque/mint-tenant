'use client';

import { FC, useEffect, useMemo, useState } from 'react';
import NextLink from 'next/link';
import { Box, Button, Code, Flex, Text, Textarea, useClipboard } from '@chakra-ui/react';
import { Check, Copy, Plug, RefreshCw } from 'lucide-react';
import { Dropdown } from '@/components/library/cl';
import { projectHref } from '@/components/library/config/lib/constants/panel';
import { mainRoute, modelLabel, useLinkModels } from '@/app/builder/_components/useLinkModels';
import Shell from './Shell';
import { DocLink, ICON, Labeled } from './ui';

const EXAMPLES = [
	'An invoice with our logo top left, a navy band behind the title, the line items with VAT, and our bank details at the bottom.',
	'A simple receipt: who paid, the amount large and in words, the payment method, and a signature line.',
	'A bill in the Bangladeshi style: centred BILL heading, SL numbers, grid table, total in words, “Received by” and “For <business>” signatures.',
];

/** What the user pastes into their AI — it does the rest through the builder MCP's PDF tools. */
const promptFor = ({ ask, route, page, template }: { ask: string; route: string; page: string; template?: any }) =>
	template
		? [
				`Use the e-mint connector to change my PDF template “${template.name}” (id ${template._id}), which prints my “${page}” page (route ${route}).`,
				ask.trim() || 'Ask me what to change.',
				'Read it with get_pdf_template and the page’s fields with get_pdf_fields first, and keep everything else as it is. Tell me what you’ll change, then save it with save_pdf_template using the same id.',
		  ].join('\n\n')
		: [
				`Use the e-mint connector to make a PDF template for my “${page}” page (route ${route}).`,
				ask.trim() || 'Ask me what it should look like.',
				'Read describe_pdf_templates and get_pdf_fields for the page first. Start from a gallery design with use_pdf_starter if one is close, or write it yourself. Use theme colour roles and the heading font, and offer me two or three looks (palette + fonts) to choose from. Show me your plan, then save it with save_pdf_template and give me the designer link.',
		  ].join('\n\n');

/**
 * Build or change a template with the user's own AI — Claude, ChatGPT, Cursor
 * or any MCP client, on their own subscription — through the builder MCP's PDF
 * tools (backend library/controllers/mcp/pdfTemplates.tools.ts). This writes
 * the prompt to paste; the AI saves the template itself. `onReload` fetches
 * what it saved: the list, or the designer's template (replacing the working
 * copy, so the designer asks to save first).
 */
const AiDialog: FC<{ open: boolean; onClose: () => void; route?: string; template?: any; dirty?: boolean; onReload?: () => void }> = ({
	open,
	onClose,
	route: presetRoute,
	template,
	dirty,
	onReload,
}) => {
	const { models } = useLinkModels();
	const [route, setRoute] = useState(presetRoute || template?.route || '');
	const [ask, setAsk] = useState('');
	useEffect(() => {
		if (open) setRoute(presetRoute || template?.route || '');
	}, [open, presetRoute, template?.route]);
	const pages = useMemo(() => models.map(m => ({ value: mainRoute(m), label: modelLabel(m), title: m.title || m.name.replace(/^T[0-9a-f]{24}_/, '') })), [models]);
	const changing = !!template;
	const page = pages.find(p => p.value === route)?.title || route;
	const prompt = route ? promptFor({ ask, route, page, template }) : '';
	const { copy, copied } = useClipboard({ value: prompt });

	return (
		<Shell
			open={open}
			onClose={onClose}
			title={changing ? 'Change it with your AI' : 'Build a template with your AI'}
			description={
				<>
					Your own AI does it — Claude, ChatGPT, Cursor or any MCP client — through the e-mint connector, and saves it here. <DocLink section='ai' />
				</>
			}
			footer={
				<>
					<NextLink
						href={projectHref('/model-builder/connect')}
						target='_blank'
						style={{ marginRight: 'auto' }}>
						<Button
							size='xs'
							h='28px'
							px={3}
							variant='ghost'>
							<Plug {...ICON} />
							Connect your AI
						</Button>
					</NextLink>
					{onReload && (
						<Button
							size='xs'
							h='28px'
							px={3}
							variant='outline'
							disabled={changing && dirty}
							onClick={() => {
								onReload();
								onClose();
							}}>
							<RefreshCw {...ICON} />
							{changing ? 'Load its changes' : 'Show what it made'}
						</Button>
					)}
					<Button
						size='xs'
						h='28px'
						px={3}
						disabled={!prompt}
						onClick={copy}>
						{copied ? <Check {...ICON} /> : <Copy {...ICON} />}
						{copied ? 'Copied' : 'Copy the prompt'}
					</Button>
				</>
			}>
			<Flex
				direction='column'
				gap={4}>
				{changing && dirty && (
					<Text
						fontSize='xs'
						color='orange.fg'>
						You have unsaved changes. Save first — your AI works on the saved copy, and loading its changes replaces what’s here.
					</Text>
				)}
				{!changing && (
					<Labeled label='Page it prints'>
						<Dropdown
							size='sm'
							value={route}
							searchable
							placeholder='Pick a page'
							onChange={setRoute}>
							{pages.map(p => (
								<option
									key={p.value}
									value={p.value}>
									{p.label}
								</option>
							))}
						</Dropdown>
					</Labeled>
				)}
				<Labeled
					label={changing ? 'What to change' : 'What it should look like'}
					hint='Optional — you can tell your AI in the chat instead.'>
					<Textarea
						size='sm'
						rows={4}
						value={ask}
						placeholder={changing ? 'Make the totals bigger and put the bank details in a box' : EXAMPLES[0]}
						onChange={e => setAsk(e.target.value)}
					/>
				</Labeled>
				{!changing && (
					<Flex
						direction='column'
						gap={1.5}>
						<Text
							fontSize='xs'
							color='fg.muted'>
							Try:
						</Text>
						{EXAMPLES.map(x => (
							<Text
								key={x}
								as='button'
								textAlign='left'
								fontSize='xs'
								color='fg.muted'
								_hover={{ color: 'fg' }}
								onClick={() => setAsk(x)}>
								“{x}”
							</Text>
						))}
					</Flex>
				)}
				<Labeled
					label='Paste this into your AI'
					hint='It reads the format and the page’s fields, shows you its plan, then saves the template — every save is checked like the designer’s.'>
					<Box
						borderWidth='1px'
						borderColor='border'
						borderRadius='md'
						bg='bg.subtle'
						px={3}
						py={2.5}
						maxH='200px'
						overflowY='auto'>
						<Code
							display='block'
							whiteSpace='pre-wrap'
							bg='transparent'
							fontSize='12px'
							color={prompt ? 'fg' : 'fg.subtle'}>
							{prompt || 'Pick a page first.'}
						</Code>
					</Box>
				</Labeled>
			</Flex>
		</Shell>
	);
};

export default AiDialog;
