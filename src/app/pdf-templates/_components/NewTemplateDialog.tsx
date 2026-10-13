'use client';

import { FC, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Box, Button, Flex, Grid, Input, Spinner, Text } from '@chakra-ui/react';
import { FilePlus2, Sparkles } from 'lucide-react';
import {
	useCreatePdfTemplateMutation,
	useGetPdfFieldsQuery,
	useGetPdfGalleryQuery,
	useGetPdfSettingsQuery,
	useGuessPdfMappingMutation,
	useUsePdfTemplateMutation,
} from '@/components/library';
import { Dropdown } from '@/components/library/cl';
import { FieldTree, PdfTemplate, aliasOf, flattenFields } from '@/components/library/pdf/types';
import { mainRoute, modelLabel, useLinkModels } from '@/app/builder/_components/useLinkModels';
import { toaster } from '@/components/ui/toaster';
import Shell from './Shell';
import Thumb from './Thumb';
import { DocLink, ICON, Labeled, designerHref, errorOf } from './ui';

type Step = 'start' | 'page' | 'match';
const BLANK = 'blank';
const AI = 'ai';

const fits = (slotType: string, fieldType: string) =>
	slotType === 'number' ? fieldType === 'number' : slotType === 'date' ? fieldType === 'date' : slotType === 'list' ? fieldType === 'list' : fieldType !== 'list' && fieldType !== 'section';

/**
 * A new template: a starter from the gallery (or blank, or AI — PT-08), the
 * page it prints, then — for a starter — each thing it shows matched to one
 * of the page's fields. Guesses come from the server (POST /guess); what's
 * left blank prints nothing and can be matched later in the designer.
 */
const NewTemplateDialog: FC<{ open: boolean; onClose: () => void; route?: string; onAi?: (route: string) => void }> = ({ open, onClose, route: presetRoute, onAi }) => {
	const router = useRouter();
	const { data: gallery, isLoading: galleryLoading } = useGetPdfGalleryQuery(undefined, { skip: !open });
	const { data: settings } = useGetPdfSettingsQuery(undefined, { skip: !open });
	const { models } = useLinkModels();
	const [step, setStep] = useState<Step>('start');
	const [from, setFrom] = useState<string>('');
	const [route, setRoute] = useState(presetRoute || '');
	const [name, setName] = useState('');
	const [mapping, setMapping] = useState<Record<string, any>>({});
	const [guess, { data: guessed, isLoading: guessing }] = useGuessPdfMappingMutation();
	const { data: tree } = useGetPdfFieldsQuery(route, { skip: !route || step !== 'match' }) as { data?: FieldTree };
	const [create, { isLoading: creating }] = useCreatePdfTemplateMutation();
	const [use, { isLoading: using }] = useUsePdfTemplateMutation();

	useEffect(() => {
		if (!open) return;
		setStep('start');
		setFrom('');
		setRoute(presetRoute || '');
		setName('');
		setMapping({});
	}, [open, presetRoute]);

	const starters: PdfTemplate[] = gallery?.templates || [];
	const starter = starters.find(s => s._id === from);
	const pages = useMemo(() => models.map(m => ({ value: mainRoute(m), label: modelLabel(m), title: m.title || m.name })), [models]);
	const pageTitle = pages.find(p => p.value === route)?.title || route;

	const next = async () => {
		if (step === 'start') {
			if (from === AI && onAi) return onAi(route);
			setName(starter?.name || '');
			return setStep('page');
		}
		if (from === BLANK) {
			try {
				const doc = await create({
					name: name.trim() || 'Untitled template',
					route,
					alias: aliasOf(pageTitle),
					kind: 'other',
					page: { size: 'A4', orientation: 'portrait', margin: [42, 42, 42, 42] },
					style: { font: 'sans', size: 10, color: '#111827', muted: '#6b7280', accent: '#2563eb', lineHeight: 1.4 },
					header: [],
					body: [{ type: 'text', text: `{{${aliasOf(pageTitle)}._id}}`, size: 18, weight: 600 }],
					footer: [],
				}).unwrap();
				onClose();
				router.push(designerHref(doc._id));
			} catch (e) {
				toaster.create({ type: 'error', title: 'Could not make it', description: errorOf(e) });
			}
			return;
		}
		try {
			const r = await guess({ from, route }).unwrap();
			setMapping(r.mapping || {});
			setStep('match');
		} catch (e) {
			toaster.create({ type: 'error', title: 'Could not read that page', description: errorOf(e) });
		}
	};

	const finish = async () => {
		try {
			const doc = await use({ from, route, mapping, name: name.trim() || starter?.name }).unwrap();
			toaster.create({ type: 'success', title: `${doc.name} is ready`, description: doc.isDefault ? 'It’s this page’s Download PDF now.' : undefined });
			onClose();
			router.push(designerHref(doc._id));
		} catch (e) {
			toaster.create({ type: 'error', title: 'Could not make it', description: errorOf(e) });
		}
	};

	/* ------------------------------------------------------ matching */

	const slots: any[] = guessed?.slots || starter?.slots || [];
	const fieldsTree: FieldTree | undefined = tree || guessed?.fields;
	const flat = useMemo(() => flattenFields(fieldsTree?.fields || []), [fieldsTree]);
	const listValue = (m: any) => (!m ? '' : m.path ? `path:${m.path}` : `list:${m.route}|${m.foreignField}`);
	const listItems = (m: any) => {
		if (!m || !fieldsTree) return [];
		if (m.path) {
			// A section list's own row fields (item.…).
			const find = (nodes: any[]): any => nodes.flatMap(n => (n.path === m.path ? [n] : n.children ? [find(n.children)].filter(Boolean) : []))[0];
			return flattenFields(find(fieldsTree.fields)?.children || []);
		}
		const l = fieldsTree.lists.find(x => x.route === m.route && x.foreignField === m.foreignField);
		return flattenFields(l?.fields || []);
	};

	const row = (slot: any, options: { path: string; label: string; type: string }[], indent = false) => (
		<Grid
			key={slot.token}
			templateColumns='minmax(0, 1fr) minmax(0, 1.4fr)'
			gap={3}
			alignItems='center'
			pl={indent ? 5 : 0}>
			<Text
				fontSize='sm'
				color={indent ? 'fg.muted' : 'fg'}>
				{slot.label}
			</Text>
			<Dropdown
				size='sm'
				value={mapping[slot.token] || ''}
				onChange={v => setMapping(m => ({ ...m, [slot.token]: v }))}>
				<option value=''>— Leave blank</option>
				{options
					.filter(o => fits(slot.type, o.type))
					.map(o => (
						<option
							key={o.path}
							value={o.path}>
							{o.label}
						</option>
					))}
			</Dropdown>
		</Grid>
	);

	const matchStep = (
		<Flex
			direction='column'
			gap={2.5}>
			{!fieldsTree && <Spinner size='sm' />}
			{fieldsTree &&
				slots.map(slot => {
					if (slot.type !== 'list') return row(slot, flat);
					const m = mapping[slot.token];
					const items = listItems(m);
					return (
						<Box
							key={slot.token}
							borderWidth='1px'
							borderColor='border'
							borderRadius='md'
							p={3}>
							<Grid
								templateColumns='minmax(0, 1fr) minmax(0, 1.4fr)'
								gap={3}
								alignItems='center'
								mb={(slot.of || []).length ? 2.5 : 0}>
								<Text
									fontSize='sm'
									fontWeight='500'>
									{slot.label}
								</Text>
								<Dropdown
									size='sm'
									value={listValue(m)}
									onChange={v => {
										const next = !v ? '' : v.startsWith('path:') ? { path: v.slice(5) } : { route: v.slice(5).split('|')[0], foreignField: v.slice(5).split('|')[1] };
										setMapping(x => ({ ...x, [slot.token]: next, ...Object.fromEntries((slot.of || []).map((s: any) => [s.token, ''])) }));
									}}>
									<option value=''>— None</option>
									{flat
										.filter(f => f.type === 'list')
										.map(f => (
											<option
												key={f.path}
												value={`path:${f.path}`}>
												{f.label} (rows in this record)
											</option>
										))}
									{(fieldsTree.lists || []).map(l => (
										<option
											key={`${l.route}|${l.foreignField}`}
											value={`list:${l.route}|${l.foreignField}`}>
											{l.title} whose {l.fieldLabel} is this one
										</option>
									))}
								</Dropdown>
							</Grid>
							<Flex
								direction='column'
								gap={2}>
								{m ? (slot.of || []).map((s: any) => row(s, items, true)) : null}
							</Flex>
						</Box>
					);
				})}
		</Flex>
	);

	/* ---------------------------------------------------------- start */

	const card = (id: string, title: string, text: string, body: any, badge?: string) => (
		<Box
			key={id}
			as='button'
			textAlign='left'
			borderWidth={from === id ? '2px' : '1px'}
			borderColor={from === id ? 'colorPalette.solid' : 'border'}
			colorPalette='blue'
			borderRadius='lg'
			overflow='hidden'
			bg='bg.panel'
			_hover={{ borderColor: from === id ? 'colorPalette.solid' : 'border.emphasized' }}
			onClick={() => setFrom(id)}
			onDoubleClick={() => {
				setFrom(id);
				setTimeout(() => (id === AI && onAi ? onAi(route) : (setName(starters.find(s => s._id === id)?.name || ''), setStep('page'))));
			}}>
			{body}
			<Box p={3}>
				<Flex
					align='center'
					gap={2}>
					<Text
						fontSize='sm'
						fontWeight='600'>
						{title}
					</Text>
					{badge && (
						<Badge
							size='xs'
							variant='subtle'>
							{badge}
						</Badge>
					)}
				</Flex>
				<Text
					fontSize='xs'
					color='fg.muted'
					mt={1}
					lineClamp={2}>
					{text}
				</Text>
			</Box>
		</Box>
	);
	const icon = (Icon: any) => (
		<Flex
			h='200px'
			align='center'
			justify='center'
			bg='bg.subtle'
			borderBottomWidth='1px'
			borderColor='border'
			color='fg.muted'>
			<Icon
				size={28}
				strokeWidth={1.5}
			/>
		</Flex>
	);

	const startStep = (
		<Grid
			templateColumns={{ base: '1fr 1fr', md: 'repeat(3, 1fr)' }}
			gap={3}>
			{galleryLoading && <Spinner size='sm' />}
			{starters.map(s =>
				card(
					s._id!,
					s.name,
					s.description || '',
					<Thumb
						template={s}
						settings={settings}
						height={200}
					/>,
					s.kind && s.kind !== 'other' ? s.kind : undefined
				)
			)}
			{card(BLANK, 'Blank', 'An empty page to build from scratch.', icon(FilePlus2))}
			{onAi && card(AI, 'Build with AI', 'Describe it — AI lays it out from this page’s fields.', icon(Sparkles))}
		</Grid>
	);

	const pageStep = (
		<Flex
			direction='column'
			gap={4}>
			<Labeled
				label='Page it prints'
				hint='Its records get a Download PDF with this template.'>
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
			<Labeled label='Name'>
				<Input
					size='sm'
					value={name}
					placeholder={starter?.name || 'Untitled template'}
					onChange={e => setName(e.target.value)}
				/>
			</Labeled>
			{route && (
				<Text
					fontSize='xs'
					color='fg.muted'>
					Its fields go in as <code>{`{{${aliasOf(pageTitle)}.…}}`}</code>.
				</Text>
			)}
		</Flex>
	);

	const titles: Record<Step, string> = {
		start: 'New PDF template',
		page: from === BLANK ? 'A blank template' : `Use “${starter?.name || 'template'}”`,
		match: 'Match its data to your fields',
	};
	const descriptions: Record<Step, any> = {
		start: (
			<>
				Start from a design and make it yours, or from nothing. <DocLink section='start' />
			</>
		),
		page: 'Which page’s records it prints.',
		match: (
			<>
				We guessed from the names — check each one. What’s left blank prints nothing until you match it in the designer. <DocLink section='match' />
			</>
		),
	};

	return (
		<Shell
			open={open}
			onClose={onClose}
			title={titles[step]}
			description={descriptions[step]}
			maxW={step === 'start' ? '980px' : '640px'}
			footer={
				<>
					{step !== 'start' && (
						<Button
							size='xs'
							h='28px'
							px={3}
							variant='ghost'
							mr='auto'
							onClick={() => setStep(step === 'match' ? 'page' : 'start')}>
							Back
						</Button>
					)}
					<Button
						size='xs'
						h='28px'
						px={3}
						variant='outline'
						onClick={onClose}>
						Cancel
					</Button>
					{step === 'match' ? (
						<Button
							size='xs'
							h='28px'
							px={3}
							loading={using}
							onClick={finish}>
							Make the template
						</Button>
					) : (
						<Button
							size='xs'
							h='28px'
							px={3}
							disabled={!from || (step === 'page' && !route) || (from === AI && !onAi)}
							loading={guessing || creating}
							onClick={next}>
							{step === 'page' && from === BLANK ? 'Make the template' : 'Next'}
						</Button>
					)}
				</>
			}>
			{step === 'start' ? startStep : step === 'page' ? pageStep : matchStep}
		</Shell>
	);
};

export default NewTemplateDialog;
