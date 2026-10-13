'use client';

import { FC, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Flex, Text, Textarea } from '@chakra-ui/react';
import { Sparkles } from 'lucide-react';
import { useAiPdfTemplateMutation, useCreatePdfTemplateMutation } from '@/components/library';
import { Dropdown } from '@/components/library/cl';
import { mainRoute, modelLabel, useLinkModels } from '@/app/builder/_components/useLinkModels';
import { toaster } from '@/components/ui/toaster';
import Shell from './Shell';
import { DocLink, ICON, Labeled, designerHref, errorOf } from './ui';

const EXAMPLES = [
	'An invoice with our logo top left, a navy band behind the title, the line items with VAT, and our bank details at the bottom.',
	'A simple receipt: who paid, the amount large and in words, the payment method, and a signature line.',
	'A bill in the Bangladeshi style: centred BILL heading, SL numbers, grid table, total in words, “Received by” and “For <business>” signatures.',
];

/**
 * Build with AI (backend POST /pdf-templates/ai, PT-08). New: describe it, pick
 * the page — the template is made and opened in the designer. Change: with
 * `template`, the answer replaces the designer's working copy (`onChanged`),
 * unsaved until Save.
 */
const AiDialog: FC<{ open: boolean; onClose: () => void; route?: string; template?: any; onChanged?: (t: any, summary: string) => void }> = ({ open, onClose, route: presetRoute, template, onChanged }) => {
	const router = useRouter();
	const { models } = useLinkModels();
	const [route, setRoute] = useState(presetRoute || template?.route || '');
	const [prompt, setPrompt] = useState('');
	const [build, { isLoading }] = useAiPdfTemplateMutation();
	const [create, { isLoading: saving }] = useCreatePdfTemplateMutation();
	useEffect(() => {
		if (open) setRoute(presetRoute || template?.route || '');
	}, [open, presetRoute, template?.route]);
	const pages = useMemo(() => models.map(m => ({ value: mainRoute(m), label: modelLabel(m) })), [models]);
	const changing = !!template;

	const go = async () => {
		try {
			const r = await build({ prompt, route, ...(changing && { template }) }).unwrap();
			const note = r.warnings?.length ? `${r.warnings.length} field${r.warnings.length === 1 ? '' : 's'} it used don’t exist here — they print blank.` : undefined;
			if (changing) {
				onChanged?.(r.template, r.summary);
				toaster.create({ type: 'success', title: r.summary || 'Changed — save to keep it', description: note });
			} else {
				const doc = await create({ ...r.template, route }).unwrap();
				toaster.create({ type: 'success', title: r.summary || `${doc.name} is ready`, description: note });
				router.push(designerHref(doc._id));
			}
			setPrompt('');
			onClose();
		} catch (e) {
			toaster.create({ type: 'error', title: 'AI couldn’t do that', description: errorOf(e) });
		}
	};

	return (
		<Shell
			open={open}
			onClose={onClose}
			title={changing ? 'Change it with AI' : 'Build a template with AI'}
			description={
				<>
					{changing ? 'Say what to change — the rest stays. Nothing is saved until you press Save.' : 'Describe the document; AI lays it out from the page’s fields. You finish it in the designer.'}{' '}
					<DocLink section='ai' />
				</>
			}
			footer={
				<>
					{isLoading && (
						<Text
							fontSize='xs'
							color='fg.muted'
							mr='auto'>
							This takes up to a minute…
						</Text>
					)}
					<Button
						size='xs'
						h='28px'
						px={3}
						variant='outline'
						onClick={onClose}>
						Cancel
					</Button>
					<Button
						size='xs'
						h='28px'
						px={3}
						disabled={!prompt.trim() || !route}
						loading={isLoading || saving}
						onClick={go}>
						<Sparkles {...ICON} />
						{changing ? 'Change it' : 'Build it'}
					</Button>
				</>
			}>
			<Flex
				direction='column'
				gap={4}>
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
				<Labeled label={changing ? 'What to change' : 'What it should look like'}>
					<Textarea
						size='sm'
						rows={5}
						value={prompt}
						placeholder={changing ? 'Make the totals bigger and put the bank details in a box' : EXAMPLES[0]}
						onChange={e => setPrompt(e.target.value)}
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
								onClick={() => setPrompt(x)}>
								“{x}”
							</Text>
						))}
					</Flex>
				)}
			</Flex>
		</Shell>
	);
};

export default AiDialog;
