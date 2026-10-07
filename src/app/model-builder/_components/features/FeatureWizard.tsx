'use client';

import { FC, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import NextLink from 'next/link';
import { Badge, Box, Button, Flex, Grid, Input, Switch, Text, Textarea } from '@chakra-ui/react';
import {
	ArrowLeft,
	ArrowRight,
	Check,
	CircleAlert,
	ExternalLink,
	Link2,
	Pencil,
	Plug,
	Plus,
	RotateCcw,
	Sparkles,
	Undo2,
} from 'lucide-react';
import {
	Layout,
	useBuildFeatureMutation,
	useCheckFeaturePlanMutation,
	useGetFeatureCatalogQuery,
	usePlanFeatureWithAiMutation,
} from '@/components/library';
import { Dropdown, PageHeader, Panel } from '@/components/library/cl';
import { toaster } from '@/components/ui/toaster';
import { DocLink } from '@/app/builder/_components/ui';
import ModelPanels, { requestedName } from '../ModelPanels';
import FieldsEditor, { LinkTarget } from '../FieldsEditor';
import { FieldKind, kindLabel, newUid, toModelName, validateFields } from '../modelKinds';
import {
	CreateStep,
	UpdateStep,
	Wizard,
	WizardStep,
	emptyWorking,
	planFromWizard,
	reconcile,
	stepTitle,
	wizardFromPlan,
} from './featurePlan';
import { HOME } from '@/components/library/config/lib/constants/panel';

/**
 * A feature — several models and the links between them — planned from a
 * description and built in one go.
 *
 * 1. Describe: Claude (the server's key) drafts the plan: new models, fields
 *    for existing ones, and how they link. Or start from a blank model.
 * 2. One screen per model, in order, with what the AI suggested and why. A
 *    new model is edited with the model builder's own panels; an existing one
 *    shows only what changes — fields added or changed, tabs on its page.
 *    Confirm to move on, or skip it.
 * 3. Review: every step, the links, where the pages go — then Build, which
 *    creates it all or nothing.
 *
 * The plan is re-checked by the server as it's edited (POST
 * /builder/features/plan), which is where names, links, suggested tabs and
 * problems come from. Progress is kept in this browser.
 *
 * The same plans can come from the user's own AI over MCP (Connect your AI).
 */

const STORAGE_KEY = 'feature-wizard';

type Saved = { wizard: Wizard | null; at: number };
const load = (): Saved | null => {
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
};
const store = (v: Saved | null) => {
	try {
		if (v) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
		else window.localStorage.removeItem(STORAGE_KEY);
	} catch {
		// Blocked storage: the wizard works, it just won't resume.
	}
};

const EXAMPLES = [
	'Leave management: leave types with yearly allowances, leave requests by staff members with dates, a status (pending, approved, rejected) and an approver, and each staff member’s remaining allowance.',
	'Asset tracking: assets with a category, serial number, purchase date and value; assignments of assets to staff with dates; and maintenance records per asset with cost and notes.',
	'Recruitment: job openings, candidates with CVs, applications linking the two with a stage (applied, interview, offer, hired, rejected), and interview notes with a rating.',
];

const errorOf = (e: any, fallback: string) => ({
	message: e?.data?.message || (e?.status === 'FETCH_ERROR' ? 'The server didn’t answer' : fallback),
	problems: e?.data?.problems as string[] | undefined,
});

/* ------------------------------------------------------------ pieces */

const ProblemList: FC<{ items: string[]; title?: string }> = ({ items, title = 'Fix these before going on' }) =>
	items.length ? (
		<Box
			borderWidth='1px'
			borderColor='red.muted'
			bg='red.subtle'
			borderRadius='md'
			px={4}
			py={3}>
			<Flex
				align='center'
				gap={2}
				mb={1}
				color='red.fg'>
				<CircleAlert size={14} />
				<Text
					fontSize='sm'
					fontWeight='600'>
					{title}
				</Text>
			</Flex>
			<Box
				as='ul'
				pl={5}
				fontSize='sm'
				listStyleType='disc'
				color='red.fg'>
				{items.map(p => (
					<li key={p}>{p}</li>
				))}
			</Box>
		</Box>
	) : null;

const Suggested: FC<{ step: WizardStep; aiModel?: string }> = ({ step, aiModel }) =>
	step.rationale ? (
		<Box
			borderWidth='1px'
			borderColor='border'
			borderLeftWidth='3px'
			borderLeftColor='fg'
			borderRadius='md'
			px={4}
			py={3}
			bg='bg.subtle'>
			<Flex
				align='center'
				gap={1.5}
				mb={1}
				fontSize='xs'
				fontWeight='600'
				color='fg.muted'>
				<Sparkles size={13} />
				What the AI suggested{aiModel ? ` · ${aiModel}` : ''}
			</Flex>
			<Text
				fontSize='sm'
				whiteSpace='pre-wrap'>
				{step.rationale}
			</Text>
		</Box>
	) : null;

/** The links a step makes, and the tabs other steps' links put on its page. */
const Connections: FC<{ step: WizardStep; onTabs: (tabs: WizardStep['tabs']) => void }> = ({ step, onTabs }) => {
	if (!step.links.length && !step.tabs.length) return null;
	return (
		<Panel
			title='Connections'
			subtitle='How this model links to the rest of the feature.'
			actions={<DocLink section='features-links' />}>
			<Flex
				direction='column'
				gap={4}>
				{step.links.length > 0 && (
					<Box>
						<Text
							fontSize='xs'
							fontWeight='600'
							mb={1.5}>
							Links to
						</Text>
						<Flex
							direction='column'
							gap={1}>
							{step.links.map(l => (
								<Flex
									key={l.field}
									align='center'
									gap={2}
									fontSize='sm'>
									<Link2 size={13} />
									<Text>
										<strong>{l.label}</strong> → {l.to}
										{l.many ? ' (several)' : ''}
									</Text>
								</Flex>
							))}
						</Flex>
					</Box>
				)}
				{step.tabs.length > 0 && (
					<Box>
						<Text
							fontSize='xs'
							fontWeight='600'
							mb={0.5}>
							Tabs on this page
						</Text>
						<Text
							fontSize='xs'
							color='fg.muted'
							mb={2}>
							Each lists the records that link here, on the detail page after Overview.
						</Text>
						<Flex
							direction='column'
							gap={2}>
							{step.tabs.map((t, i) => (
								<Flex
									key={`${t.from}.${t.field}`}
									align='center'
									gap={3}
									flexWrap='wrap'>
									<Switch.Root
										size='sm'
										checked={t.enabled}
										onCheckedChange={e => onTabs(step.tabs.map((x, j) => (j === i ? { ...x, enabled: e.checked } : x)))}>
										<Switch.HiddenInput />
										<Switch.Control>
											<Switch.Thumb />
										</Switch.Control>
									</Switch.Root>
									<Input
										size='xs'
										maxW='220px'
										value={t.title}
										disabled={!t.enabled}
										onChange={e => onTabs(step.tabs.map((x, j) => (j === i ? { ...x, title: e.target.value, edited: true } : x)))}
									/>
									<Text
										fontSize='xs'
										color='fg.muted'>
										{t.from} › {t.field}
									</Text>
								</Flex>
							))}
						</Flex>
					</Box>
				)}
			</Flex>
		</Panel>
	);
};

const Rail: FC<{ w: Wizard | null; at: number; onGo: (i: number) => void; busy: boolean }> = ({ w, at, onGo, busy }) => {
	const items: { key: string; title: string; hint: string; state: 'done' | 'skipped' | 'problem' | 'todo'; icon?: ReactNode }[] = [
		{ key: 'describe', title: 'Describe', hint: 'What the feature does', state: w ? 'done' : 'todo' },
		...(w?.steps || []).map(s => ({
			key: s.id,
			title: stepTitle(s),
			hint: s.kind === 'create' ? 'New model' : s.synthesized && !s.add.length && !s.change.length ? 'Existing · tabs only' : 'Existing · changes',
			state: (s.skipped ? 'skipped' : s.problems.length ? 'problem' : s.confirmed ? 'done' : 'todo') as any,
			icon: s.kind === 'create' ? <Plus size={11} /> : <Pencil size={11} />,
		})),
		...(w ? [{ key: 'review', title: 'Review & build', hint: 'Build it all at once', state: 'todo' as const }] : []),
	];
	return (
		<Flex
			as='nav'
			direction={{ base: 'row', lg: 'column' }}
			gap={1}
			overflowX={{ base: 'auto', lg: 'visible' }}
			position={{ lg: 'sticky' }}
			top={{ lg: '16px' }}>
			{items.map((s, i) => {
				const index = i - 1;
				const active = index === at;
				return (
					<Flex
						key={s.key}
						as='button'
						align='center'
						gap={3}
						px={2.5}
						py={2}
						borderRadius='md'
						textAlign='left'
						flexShrink={0}
						bg={active ? 'bg.muted' : 'transparent'}
						cursor={busy ? 'default' : 'pointer'}
						_hover={!active && !busy ? { bg: 'bg.subtle' } : undefined}
						onClick={() => !busy && (index === -1 || w) && onGo(index)}
						aria-current={active ? 'step' : undefined}>
						<Flex
							align='center'
							justify='center'
							w='22px'
							h='22px'
							borderRadius='full'
							fontSize='11px'
							fontWeight='600'
							flexShrink={0}
							borderWidth='1px'
							borderColor={active ? 'fg' : s.state === 'problem' ? 'red.solid' : 'border'}
							bg={active ? 'fg' : s.state === 'done' ? 'bg.muted' : 'transparent'}
							color={active ? 'bg' : s.state === 'problem' ? 'red.fg' : 'fg.muted'}>
							{s.state === 'done' && !active ? <Check size={12} /> : s.state === 'problem' && !active ? '!' : s.icon || i + 1}
						</Flex>
						<Box
							display={{ base: active ? 'block' : 'none', lg: 'block' }}
							minW={0}>
							<Text
								fontSize='sm'
								fontWeight={active ? '600' : '500'}
								truncate
								textDecoration={s.state === 'skipped' ? 'line-through' : undefined}
								color={s.state === 'skipped' ? 'fg.muted' : undefined}>
								{s.title}
							</Text>
							<Text
								fontSize='xs'
								color='fg.muted'
								display={{ base: 'none', lg: 'block' }}>
								{s.state === 'skipped' ? 'Skipped' : s.hint}
							</Text>
						</Box>
					</Flex>
				);
			})}
		</Flex>
	);
};

/* -------------------------------------------------------- describe */

const Describe: FC<{
	w: Wizard | null;
	onPlanned: (w: Wizard) => void;
	onBlank: () => void;
}> = ({ w, onPlanned, onBlank }) => {
	const [plan, { isLoading }] = usePlanFeatureWithAiMutation();
	const [prompt, setPrompt] = useState('');
	const [refine, setRefine] = useState(true);
	const [error, setError] = useState<{ message: string; problems?: string[] } | null>(null);
	const changing = !!w?.steps.length && refine;

	const run = async () => {
		setError(null);
		try {
			const res = await plan({ prompt: prompt.trim(), ...(changing && { current: planFromWizard(w!) }) }).unwrap();
			onPlanned(wizardFromPlan(res.plan, res.model));
			setPrompt('');
		} catch (e) {
			setError(errorOf(e, 'Could not plan the feature'));
		}
	};

	return (
		<Flex
			direction='column'
			gap={5}>
			<Panel
				title={changing ? 'Change the plan with AI' : 'Describe the feature'}
				subtitle={
					changing
						? 'Say what to change. Claude revises the whole plan; your edits to the steps are replaced.'
						: 'What should people be able to manage? Claude plans the models, how they link to each other and to what already exists — then you go through them one by one.'
				}
				actions={<DocLink section='features' />}>
				<Flex
					direction='column'
					gap={3}>
					<Textarea
						size='sm'
						rows={5}
						value={prompt}
						disabled={isLoading}
						placeholder='e.g. Leave management: leave types, leave requests by staff members with dates, status and an approver…'
						onChange={e => setPrompt(e.target.value)}
						onKeyDown={e => {
							if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && prompt.trim()) run();
						}}
					/>
					{!changing && !prompt && (
						<Flex
							gap={2}
							flexWrap='wrap'>
							{EXAMPLES.map(x => (
								<Button
									key={x}
									size='2xs'
									variant='outline'
									maxW='100%'
									title={x}
									onClick={() => setPrompt(x)}>
									<Text truncate>{x.split(':')[0]}</Text>
								</Button>
							))}
						</Flex>
					)}
					<Flex
						align='center'
						gap={4}
						flexWrap='wrap'>
						<Button
							size='sm'
							loading={isLoading}
							loadingText='Claude is planning it…'
							disabled={!prompt.trim()}
							onClick={run}>
							<Sparkles size={14} />
							{changing ? 'Revise the plan' : 'Plan with AI'}
						</Button>
						{!!w?.steps.length && (
							<Switch.Root
								size='sm'
								checked={refine}
								disabled={isLoading}
								onCheckedChange={e => setRefine(e.checked)}>
								<Switch.HiddenInput />
								<Switch.Control>
									<Switch.Thumb />
								</Switch.Control>
								<Switch.Label fontSize='sm'>Change the current plan instead of starting over</Switch.Label>
							</Switch.Root>
						)}
						{isLoading && (
							<Text
								fontSize='xs'
								color='fg.muted'>
								Usually 30–90 seconds for a few models.
							</Text>
						)}
					</Flex>
					{error && (
						<ProblemList
							title={error.message}
							items={error.problems?.length ? error.problems : []}
						/>
					)}
					{error && !error.problems?.length && (
						<Text
							fontSize='sm'
							color='red.fg'>
							{error.message}
						</Text>
					)}
				</Flex>
			</Panel>

			{!w && (
				<Flex
					gap={3}
					flexWrap='wrap'>
					<Button
						size='sm'
						variant='outline'
						onClick={onBlank}>
						<Plus size={14} />
						Start without AI
					</Button>
					<Button
						size='sm'
						variant='ghost'
						asChild>
						<NextLink href='/model-builder/connect'>
							<Plug size={14} />
							Use your own AI instead (Claude, ChatGPT…)
						</NextLink>
					</Button>
				</Flex>
			)}
		</Flex>
	);
};

/* ------------------------------------------------------ step views */

const CreateView: FC<{
	step: CreateStep;
	targets: LinkTarget[];
	aiModel?: string;
	checking: boolean;
	onChange: (s: CreateStep) => void;
}> = ({ step, targets, aiModel, checking, onChange }) => {
	const planned = step.planned;
	const asked = toModelName(requestedName(step.working));
	// The model panels' name line, from the last plan check.
	const name: any = {
		availability: planned
			? {
					requested: asked,
					name: planned.name,
					route: planned.route,
					collectionName: planned.route,
					changed: !!asked && planned.name !== asked,
					reasons: planned.name !== asked ? ['That name is taken'] : [],
			  }
			: undefined,
		error: undefined,
		checking,
		query: asked,
	};
	const layout = step.layout;
	return (
		<>
			<Suggested
				step={step}
				aiModel={aiModel}
			/>
			<ModelPanels
				working={step.working}
				onChange={working => onChange({ ...step, working, confirmed: false })}
				mode='create'
				targets={targets}
				name={name}
			/>
			<Connections
				step={step}
				onTabs={tabs => onChange({ ...step, tabs })}
			/>
			{layout && (
				<Panel
					title='Page layout'
					subtitle='The columns, filters and form the AI laid out. Off: the generated layout. Change it later in the route builder.'
					actions={<DocLink section='features-layout' />}>
					<Flex
						direction='column'
						gap={2}
						fontSize='sm'>
						<Switch.Root
							size='sm'
							checked={step.useLayout}
							onCheckedChange={e => onChange({ ...step, useLayout: e.checked })}>
							<Switch.HiddenInput />
							<Switch.Control>
								<Switch.Thumb />
							</Switch.Control>
							<Switch.Label fontSize='sm'>Use the suggested layout</Switch.Label>
						</Switch.Root>
						{step.useLayout && (
							<Box
								color='fg.muted'
								fontSize='xs'>
								{layout.table?.length ? <Text>Columns: {layout.table.join(', ')}</Text> : null}
								{layout.filters?.length ? <Text>Filters: {layout.filters.join(', ')}</Text> : null}
								{layout.form?.length ? <Text>Form sections: {layout.form.map((s: any) => s.sectionTitle || 'Untitled').join(', ')}</Text> : null}
								{layout.view?.length ? <Text>Detail sections: {layout.view.map((s: any) => s.title || 'Untitled').join(', ')}</Text> : null}
								{layout.buttonTitle ? <Text>Add button: {layout.buttonTitle}</Text> : null}
							</Box>
						)}
					</Flex>
				</Panel>
			)}
		</>
	);
};

const UpdateView: FC<{
	step: UpdateStep;
	targets: LinkTarget[];
	aiModel?: string;
	onChange: (s: UpdateStep) => void;
}> = ({ step, targets, aiModel, onChange }) => {
	const addErrors = useMemo(() => validateFields(step.add), [step.add]);
	const changeErrors = useMemo(() => validateFields(step.change), [step.change]);
	const changedKeys = new Set(step.change.map(f => f.key));
	const addedKeys = new Set(step.add.map(f => f.key));
	const unchanged = step.existingFields.filter(f => !changedKeys.has(f.key) && !addedKeys.has(f.key));
	const savedKinds: Record<string, FieldKind> = Object.fromEntries(step.existingFields.map(f => [f.key, f.kind as FieldKind]));

	return (
		<>
			<Suggested
				step={step}
				aiModel={aiModel}
			/>
			{!step.built && (
				<Box
					fontSize='sm'
					color='fg.muted'
					borderWidth='1px'
					borderColor='border'
					borderRadius='md'
					px={4}
					py={3}>
					{step.title} is defined in code, so its fields stay as they are. The feature links to it from the new models, and can add tabs to
					its page.
				</Box>
			)}
			{step.built && (
				<Panel
					title='New fields'
					subtitle={`Added to ${step.title}. Existing records get them empty (or with their default).`}
					actions={<DocLink section='features-existing' />}>
					<FieldsEditor
						fields={step.add}
						onChange={add => onChange({ ...step, add, confirmed: false })}
						errors={addErrors}
						targets={targets}
						selfName={step.model}
					/>
				</Panel>
			)}
			{step.built && step.change.length > 0 && (
				<Panel
					title='Changed fields'
					subtitle='Existing fields with new settings. The key and kind stay; what was there before is shown under each.'>
					<Flex
						direction='column'
						gap={2}
						mb={3}>
						{step.change.map(f => {
							const was = step.before[f.key];
							if (!was) return null;
							const parts = [
								was.label !== f.label && `label “${was.label || was.key}”`,
								!!was.required !== !!f.required && (was.required ? 'required' : 'optional'),
								JSON.stringify(was.options || []) !== JSON.stringify(f.options || []) &&
									`options ${(was.options || []).map((o: any) => o.value).join(', ') || 'none'}`,
								(was.helper || '') !== (f.helper || '') && `help “${was.helper || ''}”`,
							].filter(Boolean);
							return (
								<Text
									key={f.uid}
									fontSize='xs'
									color='fg.muted'>
									<strong>{f.label || f.key}</strong> — was {parts.length ? parts.join(', ') : 'the same'}
								</Text>
							);
						})}
					</Flex>
					<FieldsEditor
						fields={step.change}
						onChange={change => onChange({ ...step, change, confirmed: false })}
						errors={changeErrors}
						targets={targets}
						selfName={step.model}
						savedKinds={savedKinds}
						hasRecords
						fixed
					/>
				</Panel>
			)}
			<Connections
				step={step}
				onTabs={tabs => onChange({ ...step, tabs })}
			/>
			{unchanged.length > 0 && (
				<Panel
					title='Stays as it is'
					subtitle={`${step.title}’s other fields — not touched by this feature.`}>
					<Flex
						gap={1.5}
						flexWrap='wrap'>
						{unchanged.map(f => (
							<Badge
								key={f.key}
								variant='outline'
								size='sm'
								fontWeight='400'>
								{f.label || f.key}
								<Text
									as='span'
									color='fg.muted'>
									{' '}
									· {kindLabel(f.kind)}
									{f.ref ? ` → ${f.ref}` : ''}
								</Text>
							</Badge>
						))}
					</Flex>
				</Panel>
			)}
		</>
	);
};

/* ---------------------------------------------------------- review */

const Review: FC<{
	w: Wizard;
	categories: { _id: string; name: string }[];
	onChange: (w: Wizard) => void;
	onGo: (i: number) => void;
	relations: { from: string; field: string; to: string; many: boolean }[];
}> = ({ w, categories, onChange, onGo, relations }) => (
	<>
		<Panel
			title='The feature'
			subtitle='Its name is used for the new sidebar category and in the build history.'
			actions={<DocLink section='features-review' />}>
			<Grid
				templateColumns={{ base: '1fr', md: 'repeat(2, minmax(0, 1fr))' }}
				gap={4}>
				<Box>
					<Text
						fontSize='xs'
						fontWeight='600'
						mb={1.5}>
						Title
					</Text>
					<Input
						size='sm'
						value={w.title}
						placeholder='Leave management'
						onChange={e => onChange({ ...w, title: e.target.value })}
					/>
				</Box>
				<Box>
					<Text
						fontSize='xs'
						fontWeight='600'
						mb={1.5}>
						New pages go in
					</Text>
					<Dropdown
						value={w.sidebarCategory}
						onChange={v => onChange({ ...w, sidebarCategory: v })}>
						<option value='new'>A new category: {w.title || 'the feature'}</option>
						{categories.map(c => (
							<option
								key={c._id}
								value={c._id}>
								{c.name}
							</option>
						))}
						<option value=''>Not in the sidebar</option>
					</Dropdown>
				</Box>
				{w.summary && (
					<Box gridColumn={{ md: 'span 2' }}>
						<Text
							fontSize='sm'
							color='fg.muted'>
							{w.summary}
						</Text>
					</Box>
				)}
			</Grid>
		</Panel>

		<Panel
			title='What gets built'
			flush>
			{w.steps.map((s, i) => (
				<Flex
					key={s.id}
					align='center'
					gap={3}
					px={4}
					py={2.5}
					borderTopWidth={i ? '1px' : 0}
					borderColor='border.muted'
					opacity={s.skipped ? 0.55 : 1}>
					<Badge
						size='sm'
						variant={s.kind === 'create' ? 'solid' : 'outline'}
						flexShrink={0}>
						{s.skipped ? 'Skipped' : s.kind === 'create' ? 'New' : 'Change'}
					</Badge>
					<Box
						flex={1}
						minW={0}>
						<Text
							fontSize='sm'
							fontWeight='500'
							truncate>
							{stepTitle(s)}
							{s.kind === 'create' && s.planned ? (
								<Text
									as='span'
									color='fg.muted'
									fontWeight='400'
									fontFamily='mono'
									fontSize='xs'>
									{' '}
									{s.planned.name} · /{s.planned.route}
								</Text>
							) : null}
						</Text>
						<Text
							fontSize='xs'
							color={s.problems.length ? 'red.fg' : 'fg.muted'}>
							{s.problems.length
								? `${s.problems.length} problem${s.problems.length > 1 ? 's' : ''}`
								: s.kind === 'create'
								? `${s.working.fields.length} fields${s.tabs.filter(t => t.enabled).length ? ` · ${s.tabs.filter(t => t.enabled).length} tab(s)` : ''}`
								: [
										s.add.length && `adds ${s.add.map(f => f.label || f.key).join(', ')}`,
										s.change.length && `changes ${s.change.map(f => f.label || f.key).join(', ')}`,
										s.tabs.filter(t => t.enabled).length && `tabs: ${s.tabs.filter(t => t.enabled).map(t => t.title).join(', ')}`,
								  ]
										.filter(Boolean)
										.join(' · ') || 'nothing'}
						</Text>
					</Box>
					<Button
						size='xs'
						variant='ghost'
						onClick={() => onGo(i)}>
						Open
					</Button>
				</Flex>
			))}
		</Panel>

		{relations.length > 0 && (
			<Panel
				title='Links'
				subtitle='Each is a reference field; the linked page gets a tab listing the records.'>
				<Flex
					direction='column'
					gap={1}>
					{relations.map(r => (
						<Flex
							key={`${r.from}.${r.field}`}
							align='center'
							gap={2}
							fontSize='xs'
							fontFamily='mono'>
							<Text>
								{r.from}.{r.field}
							</Text>
							<ArrowRight size={12} />
							<Text>
								{r.to}
								{r.many ? ' (many)' : ''}
							</Text>
						</Flex>
					))}
				</Flex>
			</Panel>
		)}
	</>
);

/* ----------------------------------------------------------- done */

const Done: FC<{ result: any; onAgain: () => void }> = ({ result, onAgain }) => (
	<Flex
		direction='column'
		gap={5}>
		<Panel title='New pages'>
			{result.created.length ? (
				<Flex
					direction='column'
					gap={2}>
					{result.created.map((c: any) => (
						<Flex
							key={c.id}
							align='center'
							justify='space-between'
							gap={3}
							flexWrap='wrap'>
							<Text fontSize='sm'>
								<strong>{c.title}</strong>{' '}
								<Text
									as='span'
									color='fg.muted'
									fontFamily='mono'
									fontSize='xs'>
									/{c.route}
								</Text>
							</Text>
							<Flex gap={2}>
								<Button
									size='xs'
									variant='outline'
									asChild>
									<a
										href={`/${c.route}`}
										target='_blank'
										rel='noopener noreferrer'>
										<ExternalLink size={12} />
										Open
									</a>
								</Button>
								<Button
									size='xs'
									variant='ghost'
									asChild>
									<NextLink href={`/model-builder/${c.id}`}>Model</NextLink>
								</Button>
								<Button
									size='xs'
									variant='ghost'
									asChild>
									<NextLink href={`/builder/${c.route}`}>Route builder</NextLink>
								</Button>
							</Flex>
						</Flex>
					))}
				</Flex>
			) : (
				<Text
					fontSize='sm'
					color='fg.muted'>
					No new models.
				</Text>
			)}
		</Panel>
		{(result.updated.length > 0 || result.tabs.length > 0) && (
			<Panel title='Changed'>
				<Flex
					direction='column'
					gap={1}
					fontSize='sm'>
					{result.updated.map((u: any) => (
						<Text key={u.name}>
							<strong>{u.title}</strong> — {[u.added.length && `added ${u.added.join(', ')}`, u.changed.length && `changed ${u.changed.join(', ')}`].filter(Boolean).join('; ')}
						</Text>
					))}
					{result.tabs.map((t: any) => (
						<Text key={`${t.route}.${t.title}`}>
							Tab “{t.title}” on the <NextLink href={`/${t.route}`}>{t.page}</NextLink> page
						</Text>
					))}
				</Flex>
			</Panel>
		)}
		{result.warnings?.length > 0 && (
			<Panel title='Notes'>
				{result.warnings.map((w: string) => (
					<Text
						key={w}
						fontSize='sm'
						color='orange.fg'>
						{w}
					</Text>
				))}
			</Panel>
		)}
		<Text
			fontSize='sm'
			color='fg.muted'>
			Roles with “*” can use the new pages now; give other roles their view/create/edit permissions on the Roles page.
		</Text>
		<Flex gap={2}>
			<Button
				size='sm'
				onClick={onAgain}>
				<Plus size={14} />
				Build another feature
			</Button>
			<Button
				size='sm'
				variant='outline'
				asChild>
				<NextLink href='/model-builder/features'>Built features</NextLink>
			</Button>
		</Flex>
	</Flex>
);

/* ---------------------------------------------------------- wizard */

const FeatureWizard: FC = () => {
	const { data: catalog } = useGetFeatureCatalogQuery();
	const [check, { isLoading: checking }] = useCheckFeaturePlanMutation();
	const [build, { isLoading: building }] = useBuildFeatureMutation();

	const [w, setWState] = useState<Wizard | null>(null);
	const [at, setAt] = useState(-1);
	const [ready, setReady] = useState(false);
	const [resumed, setResumed] = useState(false);
	const [globalProblems, setGlobalProblems] = useState<string[]>([]);
	const [relations, setRelations] = useState<any[]>([]);
	const [result, setResult] = useState<any>(null);
	const [buildError, setBuildError] = useState<{ message: string; problems?: string[] } | null>(null);
	const [dirty, setDirty] = useState(false);

	// Every edit bumps the version; a check's answer only lands if nothing changed since it was sent.
	const version = useRef(0);
	const latest = useRef<Wizard | null>(null);
	const setW = useCallback((next: Wizard | null) => {
		version.current++;
		latest.current = next;
		setWState(next);
		setDirty(true);
	}, []);

	useEffect(() => {
		const saved = load();
		if (saved?.wizard) {
			latest.current = saved.wizard;
			setWState(saved.wizard);
			setAt(Math.min(saved.at, saved.wizard.steps.length));
			setResumed(true);
			setDirty(true);
		}
		setReady(true);
	}, []);

	useEffect(() => {
		if (ready && !result) store(w ? { wizard: w, at } : null);
	}, [w, at, ready, result]);

	/** Checks the plan as it is now; the answer lands only if nothing changed meanwhile. */
	const runCheck = useCallback(async (): Promise<Wizard | null> => {
		const current = latest.current;
		if (!current) return null;
		const sentAt = version.current;
		try {
			const res = await check({ plan: planFromWizard(current) }).unwrap();
			if (sentAt !== version.current) return null;
			const { wizard, globalProblems } = reconcile(current, res.plan);
			latest.current = wizard;
			setWState(wizard);
			setGlobalProblems(globalProblems);
			setRelations(res.plan?.relations || []);
			setDirty(false);
			return wizard;
		} catch (e) {
			setGlobalProblems([errorOf(e, 'Could not check the plan').message]);
			return null;
		}
	}, [check]);

	// Re-check a moment after the last edit.
	useEffect(() => {
		if (!w || !dirty || result) return;
		const t = setTimeout(runCheck, 700);
		return () => clearTimeout(t);
	}, [w, dirty, result, runCheck]);

	const targets: LinkTarget[] = useMemo(() => {
		const existing: LinkTarget[] = (catalog?.models || []).map((m: any) => ({
			name: m.name,
			route: m.route,
			title: m.title,
			display: m.display,
			built: m.built,
		}));
		const planned: LinkTarget[] = (w?.steps || [])
			.filter((s): s is CreateStep => s.kind === 'create' && !s.skipped)
			.map(s => {
				const name = s.planned?.name || toModelName(requestedName(s.working));
				return { name, route: s.planned?.route || '', title: `${s.working.title || name} (new)`, display: '', built: true };
			})
			.filter(t => t.name);
		return [...planned, ...existing.filter(e => !planned.some(p => p.name === e.name))];
	}, [catalog, w]);

	const step = w && at >= 0 && at < w.steps.length ? w.steps[at] : null;
	const onReview = !!w && at === w.steps.length;
	const busy = building;

	const setStep = (s: WizardStep) => w && setW({ ...w, steps: w.steps.map(x => (x.id === s.id ? s : x)) });

	const go = (i: number) => {
		setBuildError(null);
		setAt(i);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	const localProblems = (s: WizardStep) => {
		const errs = s.kind === 'create' ? validateFields(s.working.fields, { accessEnabled: s.working.access.enabled }) : { ...validateFields(s.add), ...validateFields(s.change) };
		const first = Object.values(errs)[0];
		if (s.kind === 'create' && !s.working.title.trim()) return 'Give the model a title';
		if (s.kind === 'create' && !s.working.fields.length) return 'Add at least one field';
		return first ? first.message : null;
	};

	const confirm = async () => {
		if (!step) return;
		const local = localProblems(step);
		if (local) return toaster.create({ type: 'error', title: 'Fix this step first', description: local });
		const fresh = await runCheck();
		const now = fresh?.steps.find(s => s.id === step.id) || step;
		if (now.problems.length) return toaster.create({ type: 'error', title: 'This step has problems', description: now.problems[0] });
		const base = fresh || w!;
		setW({ ...base, steps: base.steps.map(s => (s.id === step.id ? { ...s, confirmed: true, skipped: false } : s)) });
		go(at + 1);
	};

	const skip = () => {
		if (!step || !w) return;
		setW({ ...w, steps: w.steps.map(s => (s.id === step.id ? { ...s, skipped: !s.skipped, confirmed: false } : s)) });
		if (!step.skipped) go(at + 1);
	};

	const blankModel = (): CreateStep => ({
			id: `s${newUid()}`,
			kind: 'create',
			rationale: '',
			tabs: [],
			links: [],
			problems: [],
			confirmed: false,
			skipped: false,
			working: { ...emptyWorking(), fields: [{ uid: newUid(), key: 'name', label: 'Name', kind: 'text', required: true, showInTable: true, keyTouched: true }] },
			planned: null,
			layout: null,
			useLayout: false,
	});

	const addModel = () => {
		if (!w) return;
		setW({ ...w, steps: [...w.steps, blankModel()] });
		go(w.steps.length);
	};

	const changeModel = (name: string) => {
		const m = (catalog?.models || []).find((x: any) => x.name === name);
		if (!m || !w) return;
		const existing = w.steps.findIndex(s => s.kind === 'update' && s.model === name);
		if (existing >= 0) return go(existing);
		const s: UpdateStep = {
			id: `s${newUid()}`,
			kind: 'update',
			rationale: '',
			tabs: [],
			links: [],
			problems: [],
			confirmed: false,
			skipped: false,
			model: m.name,
			title: m.title,
			route: m.route,
			built: m.built,
			synthesized: false,
			existingFields: m.fields,
			add: [],
			change: [],
			before: {},
		};
		setW({ ...w, steps: [...w.steps, s] });
		go(w.steps.length);
	};

	const runBuild = async () => {
		if (!w) return;
		setBuildError(null);
		if (!w.title.trim()) return setBuildError({ message: 'Give the feature a title' });
		const fresh = await runCheck();
		const current = fresh || w;
		const bad = current.steps.filter(s => !s.skipped && s.problems.length);
		if (bad.length || globalProblems.length)
			return setBuildError({ message: 'Some steps have problems', problems: bad.map(s => `${stepTitle(s)}: ${s.problems[0]}`) });
		try {
			const res = await build({ plan: planFromWizard(current) }).unwrap();
			setResult(res);
			store(null);
			toaster.create({ type: 'success', title: `${current.title} is built`, description: `${res.created.length} new page(s)` });
		} catch (e) {
			setBuildError(errorOf(e, 'Could not build the feature'));
		}
	};

	const startOver = () => {
		store(null);
		latest.current = null;
		setWState(null);
		setResult(null);
		setGlobalProblems([]);
		setRelations([]);
		setResumed(false);
		setAt(-1);
	};

	const crumbs = [
		{ href: HOME, title: 'Home' },
		{ href: '/model-builder', title: 'Models' },
		{ href: '/model-builder/features', title: 'Features' },
		{ href: '/model-builder/features/new', title: 'New feature' },
	];

	if (result)
		return (
			<Layout
				title='Feature built'
				path='model-builder'>
				<Flex
					direction='column'
					gap={5}
					pb={10}
					maxW='820px'>
					<PageHeader
						breadcrumbs={crumbs}
						title={`${result.feature?.title || 'The feature'} is live`}
						meta={`${result.created.length} new · ${result.updated.length} changed · ${result.tabs.length} tabs`}
					/>
					<Done
						result={result}
						onAgain={startOver}
					/>
				</Flex>
			</Layout>
		);

	const selectable = (catalog?.models || []).filter((m: any) => !m.protected);

	return (
		<Layout
			title='New feature'
			path='model-builder'>
			<Flex
				direction='column'
				gap={5}
				pb={10}>
				<PageHeader
					breadcrumbs={crumbs}
					title={w?.title || 'New feature'}
					meta='Several models and their links, planned together and built in one go'
					actions={
						w ? (
							<Button
								size='sm'
								variant='ghost'
								disabled={busy}
								onClick={startOver}>
								<RotateCcw size={14} />
								Start over
							</Button>
						) : undefined
					}
				/>
				{resumed && (
					<Text
						fontSize='xs'
						color='fg.muted'>
						Picked up where you left off in this browser.
					</Text>
				)}

				<Grid
					templateColumns={{ base: '1fr', lg: '240px minmax(0, 1fr)' }}
					gap={6}
					alignItems='start'>
					<Flex
						direction='column'
						gap={3}>
						<Rail
							w={w}
							at={at}
							onGo={go}
							busy={busy}
						/>
						{w && (
							<Flex
								direction='column'
								gap={2}
								display={{ base: 'none', lg: 'flex' }}
								px={2.5}>
								<Button
									size='xs'
									variant='outline'
									disabled={busy}
									onClick={addModel}>
									<Plus size={12} />
									Add a new model
								</Button>
								<Dropdown
									size='xs'
									placeholder='Change an existing model…'
									value=''
									onChange={changeModel}>
									{selectable.map((m: any) => (
										<option
											key={m.name}
											value={m.name}>
											{m.title} ({m.name})
										</option>
									))}
								</Dropdown>
							</Flex>
						)}
					</Flex>

					<Flex
						direction='column'
						gap={5}
						minW={0}>
						{at === -1 && (
							<Describe
								w={w}
								onPlanned={next => {
									setW(next);
									go(0);
								}}
								onBlank={() => {
									setW({ title: '', description: '', summary: '', sidebarCategory: 'new', steps: [blankModel()] });
									go(0);
								}}
							/>
						)}

						{step && (
							<>
								<Flex
									align='baseline'
									justify='space-between'
									gap={3}>
									<Box minW={0}>
										<Text
											fontSize='xs'
											color='fg.muted'>
											Step {at + 1} of {w!.steps.length} · {step.kind === 'create' ? 'New model' : 'Existing model'}
											{checking ? ' · checking…' : ''}
										</Text>
										<Text
											fontSize='lg'
											fontWeight='600'
											truncate>
											{stepTitle(step)}
										</Text>
									</Box>
									<DocLink section={step.kind === 'create' ? 'features-steps' : 'features-existing'} />
								</Flex>
								{step.skipped && (
									<Text
										fontSize='sm'
										color='orange.fg'>
										Skipped — it won’t be built. Anything that links to it will need changing.
									</Text>
								)}
								<ProblemList items={step.problems} />
								{step.kind === 'create' ? (
									<CreateView
										step={step}
										targets={targets.filter(t => t.name !== (step.planned?.name || toModelName(requestedName(step.working))))}
										aiModel={w?.aiModel}
										checking={checking || dirty}
										onChange={setStep}
									/>
								) : (
									<UpdateView
										step={step}
										targets={targets}
										aiModel={w?.aiModel}
										onChange={setStep}
									/>
								)}
								<Flex
									justify='space-between'
									gap={2}
									pt={2}
									borderTopWidth='1px'
									borderColor='border.muted'
									flexWrap='wrap'>
									<Button
										size='sm'
										variant='ghost'
										onClick={() => go(at - 1)}>
										<ArrowLeft size={14} />
										Back
									</Button>
									<Flex gap={2}>
										<Button
											size='sm'
											variant='outline'
											onClick={skip}>
											{step.skipped ? (
												<>
													<Undo2 size={14} />
													Include it again
												</>
											) : (
												'Skip this model'
											)}
										</Button>
										<Button
											size='sm'
											loading={checking}
											disabled={step.skipped}
											onClick={confirm}>
											Confirm & next
											<ArrowRight size={14} />
										</Button>
									</Flex>
								</Flex>
							</>
						)}

						{onReview && w && (
							<>
								<Flex
									align='baseline'
									justify='space-between'>
									<Text
										fontSize='lg'
										fontWeight='600'>
										Review & build
									</Text>
									<DocLink section='features-review' />
								</Flex>
								<ProblemList
									title='The plan has problems'
									items={globalProblems}
								/>
								<Review
									w={w}
									categories={catalog?.categories || []}
									onChange={setW}
									onGo={go}
									relations={relations}
								/>
								{buildError && (
									<ProblemList
										title={buildError.message}
										items={buildError.problems || []}
									/>
								)}
								{buildError && !buildError.problems?.length && (
									<Text
										fontSize='sm'
										color='red.fg'>
										{buildError.message}
									</Text>
								)}
								<Flex
									justify='space-between'
									gap={2}
									pt={2}
									borderTopWidth='1px'
									borderColor='border.muted'>
									<Button
										size='sm'
										variant='ghost'
										disabled={busy}
										onClick={() => go(at - 1)}>
										<ArrowLeft size={14} />
										Back
									</Button>
									<Button
										size='sm'
										loading={building}
										loadingText='Building…'
										disabled={!w.steps.some(s => !s.skipped)}
										onClick={runBuild}>
										<Check size={14} />
										Build the feature
									</Button>
								</Flex>
								<Text
									fontSize='xs'
									color='fg.muted'>
									All or nothing: if any step fails, everything this build did is undone.
								</Text>
							</>
						)}
					</Flex>
				</Grid>
			</Flex>
		</Layout>
	);
};

export default FeatureWizard;
