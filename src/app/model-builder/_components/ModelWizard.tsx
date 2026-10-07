'use client';

import { FC, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Collapsible, Flex, Grid, Switch, Text } from '@chakra-ui/react';
import { HOME, IS_TENANT_PANEL, createPath, pagePath, projectHref } from '@/components/library/config/lib/constants/panel';
import {
	ArrowLeft,
	ArrowRight,
	Check,
	ChevronDown,
	Eye,
	Hash,
	LayoutTemplate,
	ListChecks,
	Lock,
	LucideIcon,
	NotebookPen,
	PanelLeft,
	Plus,
	Rocket,
	RotateCcw,
	Settings2,
	Sparkles,
	Table2,
} from 'lucide-react';
import {
	Layout,
	useCreateBuiltModelMutation,
	useGetBuilderRoutesQuery,
	useGetModelBuilderOptionsQuery,
	usePreviewBuiltModelMutation,
} from '@/components/library';
import { ConsoleTabs, Dropdown, PageHeader, Panel } from '@/components/library/cl';
import { toaster } from '@/components/ui/toaster';
import SettingsEditor, { SettingsField } from '@/app/builder/_components/SettingsEditor';
import SectionsEditor from '@/app/builder/_components/SectionsEditor';
import FormRulesPanel from '@/app/builder/_components/FormRulesPanel';
import TableColumnsEditor, { TableField } from '@/app/builder/_components/TableColumnsEditor';
import { BulkActionsPanel, PageOptionsPanel, RowMenuPanel } from '@/app/builder/_components/PagePanels';
import FiltersPanel from '@/app/builder/_components/FiltersPanel';
import ViewLayoutPanel from '@/app/builder/_components/ViewLayoutPanel';
import PagePreview, { PreviewField, PreviewTab } from '@/app/builder/_components/PagePreview';
import { AREAS, AreaCard, AreaIntro, AreaKey, AreaTabLabel, ToneIcon, ToneTitle } from '@/app/builder/_components/areas';
import { DocLink, viewProblems } from '@/app/builder/_components/ui';
import { EditableFilter, fromServer, toServer, validate } from '@/app/builder/_components/filterTypes';
import { BULK_MENU_TYPES, ROW_MENU_TYPES, validateMenu } from '@/app/builder/_components/menuTypes';
import ModelPanels, {
	ModelWorking,
	codePreview,
	emptyModel,
	modelBody,
	requestedName,
	useFieldErrors,
	useNameAvailability,
} from './ModelPanels';
import AiBuilder from './AiBuilder';
import FormPreview from './FormPreview';
import { fromServer as fieldsFromServer, singular } from './modelKinds';

/**
 * A new model in three steps, in plain words:
 *
 *   1. What it stores — its name and its fields, with the form drawn beside them.
 *   2. Check the pages — the table page, form, record page and filters made
 *      from the fields, with Preview. They're fine as they are; each part opens
 *      in the same coloured tabs as the page builder for anyone who wants to
 *      change it.
 *   3. Finish — the sidebar, a summary in sentences, and Create.
 *
 * Nothing is created until the last step — step 2 works on a preview the
 * server generates (POST /builder/models/preview), and "Create" registers the
 * model, publishes the settings and config as edited, and adds the sidebar
 * entry in one go.
 *
 * Going back to step 1 and changing the fields keeps what was edited later:
 * the next preview patches the edited copies (a new field is added to them, a
 * removed one taken out) instead of starting them over.
 *
 * Progress is kept in this browser (localStorage), so a reload or a closed
 * tab picks up where it left off.
 *
 * "Build with AI" (AiBuilder, super admin only) fills every step at once from
 * a description; each can still be reviewed and changed.
 */

type StepKey = 'model' | 'pages' | 'finish';
const STEPS: { key: StepKey; title: string; hint: string; palette: string; icon: LucideIcon }[] = [
	{ key: 'model', title: 'What it stores', hint: 'A name, and the fields every record has', palette: 'blue', icon: NotebookPen },
	{ key: 'pages', title: 'Check the pages', hint: 'The table, form and record page — preview or change them', palette: 'teal', icon: LayoutTemplate },
	{ key: 'finish', title: 'Finish', hint: 'Where it shows, then create it', palette: 'green', icon: Rocket },
];

/** The parts of the pages step, in the page builder's colours. */
const PAGE_TABS: AreaKey[] = ['overview', 'table', 'form', 'view', 'filters', 'settings'];
const PREVIEW_FOR: Partial<Record<AreaKey, PreviewTab>> = { table: 'table', filters: 'table', form: 'form', settings: 'form', view: 'view' };

const STORAGE_KEY = 'model-wizard';

type Config = { rest: any; filters: EditableFilter[] };
const split = (config: any): Config => {
	const { filters, ...rest } = config || {};
	return { rest, filters: fromServer(filters || []) };
};
const join = ({ rest, filters }: Config) => ({ ...rest, filters: toServer(filters) });

type Saved = {
	/** 2 since the three-step wizard; older saves counted eight steps. */
	v?: number;
	model: ModelWorking;
	step: number;
	reached: number;
	preview: any | null;
	previewedDef: any | null;
	settings: SettingsField[];
	config: any | null;
	sidebar: { add: boolean; category: string };
	/** The parts of the pages step already looked at. */
	seen?: AreaKey[];
};

/** An eight-step save's step in the three steps: model, everything in between, sidebar & create. */
const fromOldStep = (n = 0) => (n <= 0 ? 0 : n >= 7 ? 2 : 1);

const load = (): Saved | null => {
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
};
const store = (value: Saved | null) => {
	try {
		if (value) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
		else window.localStorage.removeItem(STORAGE_KEY);
	} catch {
		// Private windows and blocked storage: the wizard works, it just won't resume.
	}
};

const differs = (a: any, b: any) => JSON.stringify(a) !== JSON.stringify(b);
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** The three steps across the top: a coloured number, the name, one line. */
const Stepper: FC<{ step: number; reached: number; onGo: (i: number) => void; busy: boolean }> = ({ step, reached, onGo, busy }) => (
	<Grid
		as='nav'
		// On a phone the other steps shrink to their number.
		templateColumns={{ base: STEPS.map((_, i) => (i === step ? 'minmax(0, 1fr)' : 'auto')).join(' '), md: 'repeat(3, minmax(0, 1fr))' }}
		gap={2}>
		{STEPS.map((s, i) => {
			const active = i === step;
			const done = i < step || (i <= reached && !active);
			const allowed = i <= reached && !busy && !active;
			return (
				<Flex
					key={s.key}
					as='button'
					align='center'
					gap={3}
					p={3}
					textAlign='left'
					borderRadius='lg'
					borderWidth='1px'
					borderColor={active ? `${s.palette}.solid` : 'border'}
					borderTopWidth='3px'
					borderTopColor={active || done ? `${s.palette}.solid` : 'border'}
					bg={active ? `${s.palette}.subtle` : 'bg.panel'}
					cursor={allowed ? 'pointer' : 'default'}
					opacity={i > reached && !active ? 0.6 : 1}
					_hover={allowed ? { boxShadow: 'sm' } : undefined}
					onClick={() => allowed && onGo(i)}
					aria-current={active ? 'step' : undefined}>
					<Flex
						align='center'
						justify='center'
						w='28px'
						h='28px'
						borderRadius='full'
						flexShrink={0}
						fontSize='13px'
						fontWeight='700'
						bg={active || done ? `${s.palette}.solid` : 'bg.muted'}
						color={active || done ? `${s.palette}.contrast` : 'fg.muted'}>
						{done ? <Check size={14} /> : i + 1}
					</Flex>
					<Box
						minW={0}
						display={{ base: active ? 'block' : 'none', md: 'block' }}>
						<Text
							fontSize='sm'
							fontWeight='600'
							color={active ? `${s.palette}.fg` : 'fg'}
							truncate>
							{s.title}
						</Text>
						<Text
							fontSize='xs'
							color='fg.muted'
							display={{ base: 'none', md: 'block' }}
							lineClamp={1}>
							{s.hint}
						</Text>
					</Box>
				</Flex>
			);
		})}
	</Grid>
);

const Problems: FC<{ items: string[] }> = ({ items }) =>
	items.length ? (
		<Box
			p={4}
			borderWidth='1px'
			borderColor='red.muted'
			borderLeftWidth='4px'
			borderLeftColor='red.solid'
			borderRadius='lg'
			bg='red.subtle'>
			<Text
				fontSize='sm'
				fontWeight='600'
				color='red.fg'
				mb={1}>
				Before you go on
			</Text>
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

/** A step's opening line: its colour, what it's for, and what to do. */
const StepIntro: FC<{ step: (typeof STEPS)[number]; children: ReactNode; actions?: ReactNode }> = ({ step, children, actions }) => (
	<Flex
		align={{ base: 'flex-start', md: 'center' }}
		direction={{ base: 'column', md: 'row' }}
		gap={4}
		p={4}
		borderWidth='1px'
		borderColor={`${step.palette}.muted`}
		borderLeftWidth='4px'
		borderLeftColor={`${step.palette}.solid`}
		borderRadius='lg'
		bg={`${step.palette}.subtle`}>
		<Flex
			gap={3}
			align='flex-start'
			flex='1'
			minW={0}>
			<Flex
				align='center'
				justify='center'
				flexShrink={0}
				w='36px'
				h='36px'
				borderRadius='lg'
				bg='bg.panel'
				color={`${step.palette}.fg`}>
				<step.icon
					size={18}
					strokeWidth={1.75}
				/>
			</Flex>
			<Box minW={0}>
				<Text
					fontSize='sm'
					fontWeight='600'
					color={`${step.palette}.fg`}>
					{step.title}
				</Text>
				<Text
					fontSize='sm'
					color='fg.muted'>
					{children}
				</Text>
			</Box>
		</Flex>
		{actions && (
			<Flex
				gap={2}
				align='center'
				flexShrink={0}
				flexWrap='wrap'>
				{actions}
			</Flex>
		)}
	</Flex>
);

/** One line of the summary: a coloured picture and a sentence. */
const Fact: FC<{ icon: LucideIcon; palette: string; children: ReactNode }> = ({ icon, palette, children }) => (
	<Flex
		gap={3}
		align='center'
		py={2.5}
		borderBottomWidth='1px'
		borderColor='border.muted'
		_last={{ borderBottomWidth: 0 }}>
		<ToneIcon
			icon={icon}
			palette={palette}
		/>
		<Text
			fontSize='sm'
			minW={0}>
			{children}
		</Text>
	</Flex>
);

/** What the wizard sits in: the panel's Layout, or a plain box on a mock page (no sign-in). */
type Frame = FC<{ title: string; path: string; children: ReactNode }>;

const ModelWizard: FC<{ frame?: Frame }> = ({ frame: Wrap = Layout as Frame }) => {
	const router = useRouter();
	const { data: options } = useGetModelBuilderOptionsQuery();
	const { data: allRoutes } = useGetBuilderRoutesQuery();
	const [previewModel, { isLoading: previewing }] = usePreviewBuiltModelMutation();
	const [createModel, { isLoading: creating }] = useCreateBuiltModelMutation();

	const [model, setModel] = useState<ModelWorking>(emptyModel);
	const [step, setStep] = useState(0);
	const [reached, setReached] = useState(0);
	const [preview, setPreview] = useState<any | null>(null);
	const [previewedDef, setPreviewedDef] = useState<any | null>(null);
	const [settings, setSettings] = useState<SettingsField[]>([]);
	const [config, setConfig] = useState<Config>({ rest: {}, filters: [] });
	const [sidebar, setSidebar] = useState({ add: true, category: '' });
	const [problems, setProblems] = useState<string[]>([]);
	const [created, setCreated] = useState<any | null>(null);
	const [resumed, setResumed] = useState(false);
	const [ai, setAi] = useState<{ summary: string; warnings: string[]; model?: string } | null>(null);
	const [area, setArea] = useState<AreaKey>('overview');
	// Step 2 goes through its parts one by one; Finish opens once all were seen.
	const [seen, setSeen] = useState<AreaKey[]>(['overview']);
	const [moreOpen, setMoreOpen] = useState(false);
	const [previewOpen, setPreviewOpen] = useState(false);
	const [previewTab, setPreviewTab] = useState<PreviewTab>('table');
	const loaded = useRef(false);

	// Pick up an unfinished wizard from this browser.
	useEffect(() => {
		const saved = load();
		if (saved?.model) {
			const at = (n?: number) => (saved.v === 2 ? n || 0 : fromOldStep(n));
			// Saved by an earlier version, it may lack newer parts (access).
			setModel({ ...emptyModel(), ...saved.model, access: saved.model.access || emptyModel().access });
			setStep(Math.min(at(saved.step), STEPS.length - 1));
			setReached(Math.min(at(saved.reached), STEPS.length - 1));
			setPreview(saved.preview);
			setPreviewedDef(saved.previewedDef);
			setSettings(saved.settings || []);
			setConfig(split(saved.config));
			setSidebar(saved.sidebar || { add: true, category: '' });
			setSeen(saved.seen || (at(saved.step) >= 2 ? PAGE_TABS : ['overview']));
			setResumed(true);
		}
		loaded.current = true;
	}, []);
	useEffect(() => {
		if (!loaded.current || created) return;
		const t = setTimeout(
			() =>
				store({
					v: 2,
					model,
					step,
					reached,
					preview,
					previewedDef,
					settings,
					config: preview ? join(config) : null,
					sidebar,
					seen,
				}),
			300
		);
		return () => clearTimeout(t);
	}, [model, step, reached, preview, previewedDef, settings, config, sidebar, seen, created]);

	// Default the sidebar category once the categories arrive.
	useEffect(() => {
		if (!sidebar.category && options?.categories?.length)
			setSidebar(s => ({ ...s, category: (options.categories.find((c: any) => /config|data|model/i.test(c.name)) || options.categories[0])._id }));
	}, [options, sidebar.category]);

	const name = useNameAvailability(model, true);
	const fieldErrors = useFieldErrors(model.fields, model.access.enabled);
	const definition = useMemo(() => ({ ...modelBody(model), name: requestedName(model), route: model.route }), [model]);
	const modelChanged = !previewedDef || JSON.stringify(definition) !== JSON.stringify(previewedDef);

	const route = preview?.availability?.route || '';
	const generated = preview?.generated;
	const tableFields: TableField[] = settings.map((f: any) => ({
		key: f.key,
		label: f.schema?.label || f.title || f.key,
		type: f.type,
		input: f.schema?.type,
		options: f.schema?.options || f.options,
		default: !!f.schema?.default,
	}));
	const previewFields: PreviewField[] = tableFields.map(f => ({ ...f, required: !!settings.find((x: any) => x.key === f.key)?.required }));
	const page = config.rest.route || {};
	const formSections: any[] = config.rest.form || [];
	const viewSections: any[] = config.rest.view || [];
	const setRest = (patch: any) => setConfig(c => ({ ...c, rest: { ...c.rest, ...patch } }));
	const routeOptions = [
		...(allRoutes?.doc || []).filter((r: any) => r.kind !== 'custom' && r.model),
		...(route ? [{ route, model: preview.availability.name, title: model.title }] : []),
	].map((r: any) => ({ route: r.route, model: r.model, title: r.title }));
	const filterCheck = useMemo(() => validate(config.filters), [config.filters]);
	const recordName = singular(model.title.trim()) || 'record';
	const settingsChanged = differs({ fields: settings }, generated?.settings);
	// Both sides through the editor's filter format, so an untouched config never reads as changed.
	const configChanged = !generated?.config || differs(join(config), join(split(generated.config)));

	/** What's wrong in the pages, and which part it's in. */
	const pageProblems = (): { area: AreaKey; text: string }[] => {
		const menu =
			Object.keys(validateMenu(page.menu || [], ROW_MENU_TYPES)).length +
			Object.keys(validateMenu(page.select?.menu || [], BULK_MENU_TYPES)).length;
		return [
			...(menu ? [{ area: 'table' as AreaKey, text: 'Table page: a menu item is incomplete — fix the items marked in red' }] : []),
			...viewProblems(config.rest.view).map(text => ({ area: 'view' as AreaKey, text: `Record page: ${text}` })),
			...(Object.keys(filterCheck.errors).length ? [{ area: 'filters' as AreaKey, text: 'Filters: some need attention' }] : []),
		];
	};

	/** Problems that stop the wizard leaving a step. */
	const stepProblems = (key: StepKey): string[] => {
		switch (key) {
			case 'model':
				return [
					...(!model.title.trim() ? ['Give it a name (Title), like “Customers”'] : []),
					...(!model.fields.length ? ['Add at least one field — what every record holds'] : []),
					...(Object.keys(fieldErrors).length ? ['Some fields need attention — they’re marked in red'] : []),
					...(name.error ? [(name.error as any)?.data?.message || 'The name isn’t usable'] : []),
				];
			case 'pages': {
				const found = pageProblems();
				if (found.length) setArea(found[0].area);
				return found.map(p => p.text);
			}
			case 'finish':
				return sidebar.add && !sidebar.category ? ['Pick a sidebar group, or turn the sidebar off'] : [];
		}
	};

	/** (Re)builds the pages from the model. */
	const runPreview = async () => {
		try {
			const res = await previewModel({
				...definition,
				...(previewedDef && preview && { previous: { definition: previewedDef, settings: { fields: settings }, config: join(config) } }),
			}).unwrap();
			const hadCopies = !!preview;
			setPreview(res);
			setPreviewedDef(definition);
			setSettings(res.settings?.fields || []);
			setConfig(split(res.config));
			if (hadCopies)
				toaster.create({
					title: 'Pages updated for your changes',
					description: 'New fields were added to them and removed ones taken out. Your other changes are kept.',
					type: 'info',
				});
			return true;
		} catch (e: any) {
			setProblems(e?.data?.problems?.length ? e.data.problems : [e?.data?.message || 'Could not check the model']);
			return false;
		}
	};

	const go = async (target: number) => {
		setProblems([]);
		if (target > step) {
			const found = stepProblems(STEPS[step].key);
			if (found.length) return setProblems(found);
		}
		if (target === 2 && !allSeen) {
			setStep(1);
			return setProblems([`Look at every part of the pages first — next is ${AREAS[firstUnseen].label}. Press Next to go on.`]);
		}
		// Leaving the first step with changes rebuilds the pages from it.
		if (step === 0 && target > 0 && modelChanged && !(await runPreview())) return;
		setStep(target);
		setReached(r => Math.max(r, target));
		window.scrollTo({ top: 0 });
	};

	/* The pages step, one part at a time. */
	const partIndex = PAGE_TABS.indexOf(area);
	const nextPart: AreaKey | undefined = PAGE_TABS[partIndex + 1];
	const allSeen = PAGE_TABS.every(t => seen.includes(t));
	const firstUnseen = PAGE_TABS.find(t => !seen.includes(t)) || 'overview';
	const showPart = (t: AreaKey) => {
		setArea(t);
		setSeen(s => (s.includes(t) ? s : [...s, t]));
		window.scrollTo({ top: 0 });
	};
	const nextOfPages = () => {
		setProblems([]);
		const found = pageProblems().filter(p => p.area === area);
		if (found.length) return setProblems(found.map(p => p.text));
		if (nextPart) showPart(nextPart);
		else go(2);
	};
	const backOfPages = () => {
		setProblems([]);
		if (partIndex > 0) showPart(PAGE_TABS[partIndex - 1]);
		else go(0);
	};
	/** A card or tab: parts already seen open any time; the next one opens like Next; the rest wait their turn. */
	const openPart = (t: AreaKey) => {
		if (seen.includes(t) || t === firstUnseen) return showPart(t);
		toaster.create({
			title: 'One part at a time',
			description: `Next is ${AREAS[firstUnseen].label} — press Next to go through the parts in order.`,
			type: 'info',
		});
	};

	const create = async () => {
		setProblems([]);
		for (let i = 0; i < STEPS.length; i++) {
			const found = stepProblems(STEPS[i].key);
			if (found.length) {
				setStep(i);
				return setProblems(found);
			}
		}
		if (modelChanged) {
			setStep(0);
			return setProblems(['The fields changed since the pages were made — press Next to make them again']);
		}
		const cfg = join(config);
		try {
			const res = await createModel({
				...definition,
				// Only what was changed from the generated copies is published;
				// the rest runs on what the model generates, and follows it.
				...(settingsChanged && { settings: { fields: settings } }),
				...(configChanged && { config: cfg }),
				sidebar: { category: sidebar.add ? sidebar.category : '' },
			}).unwrap();
			store(null);
			setCreated(res);
			toaster.create({ title: `${res.doc.title} created`, description: 'Its pages are ready to use.', type: 'success' });
		} catch (e: any) {
			const found: string[] = e?.data?.problems || [e?.data?.message || 'Could not create the model'];
			setProblems(found);
			const first = found[0] || '';
			if (/^Settings:/.test(first)) {
				setStep(1);
				setArea('settings');
			} else if (/^Config:/.test(first)) setStep(1);
			else if (!/pages/i.test(e?.data?.message || '')) setStep(0);
		}
	};

	/** A draft from the AI builder: the model, and the pages built as it laid them out. */
	const applyAi = (res: any) => {
		const d = res.definition || {};
		const base = emptyModel();
		const next: ModelWorking = {
			...base,
			title: d.title || '',
			name: d.name || '',
			description: d.description || '',
			displayField: d.displayField || '',
			code: { ...base.code, ...(d.code || {}) },
			access: { ...base.access, ...(d.access || {}) },
			fields: fieldsFromServer(d.fields || []),
		};
		setModel(next);
		setPreview(res.preview);
		// What the preview was made from, exactly as `definition` will compute it — so it isn't rebuilt on Next.
		setPreviewedDef({ ...modelBody(next), name: requestedName(next), route: next.route });
		setSettings(res.preview?.settings?.fields || []);
		setConfig(split(res.preview?.config));
		if (res.sidebarCategory) setSidebar({ add: true, category: res.sidebarCategory });
		// Everything is filled in, but the pages are still looked at one by one.
		setReached(1);
		setSeen(['overview']);
		setArea('overview');
		setProblems([]);
		setResumed(false);
		setAi({ summary: res.summary || '', warnings: res.warnings || [], model: res.model });
		toaster.create({
			title: `${d.title || 'The model'} drafted`,
			description: 'Every step is filled in. Go through them with Next, then create it on the last step.',
			type: 'success',
		});
	};

	const startOver = () => {
		store(null);
		setModel(emptyModel());
		setStep(0);
		setReached(0);
		setPreview(null);
		setPreviewedDef(null);
		setSettings([]);
		setConfig({ rest: {}, filters: [] });
		setProblems([]);
		setResumed(false);
		setCreated(null);
		setAi(null);
		setArea('overview');
		setSeen(['overview']);
	};

	const openPreview = (tab: PreviewTab = 'table') => {
		setPreviewTab(tab);
		setPreviewOpen(true);
	};

	const key = STEPS[step].key;
	const last = step === STEPS.length - 1;
	const busy = previewing || creating;
	const crumbs = [
		{ href: HOME, title: 'Home' },
		{ href: projectHref('/model-builder'), title: 'Models' },
		{ href: '', title: 'New model' },
	];
	const categoryName = (options?.categories || []).find((c: any) => c._id === sidebar.category)?.name;
	const required = model.fields.filter(f => f.required).length;

	if (created) {
		const r = created.doc.route;
		return (
			<Wrap
				title='Model created'
				path='model-builder'>
				<Flex
					direction='column'
					gap={5}
					pb={10}
					maxW='760px'>
					<PageHeader
						breadcrumbs={crumbs}
						title={`${created.doc.title} is ready`}
						meta='Its table page, form and record page are live.'
					/>
					<StepIntro
						step={STEPS[2]}
						actions={
							<Button
								size='sm'
								colorPalette='green'
								onClick={() => router.push(createPath(r))}>
								<Plus size={14} />
								Add the first {singular(created.doc.title).toLowerCase() || 'record'}
							</Button>
						}>
						All set. Add a first record to try the form, or open the table.
						{created.doc.sidebarItem ? ` You’ll find it in the sidebar${categoryName ? ` under ${categoryName}` : ''}.` : ''}
					</StepIntro>
					<Panel title='What was made'>
						<Fact
							icon={Table2}
							palette='teal'>
							A table page listing every {singular(created.doc.title).toLowerCase() || 'record'}, with a form to add and edit them and a page for each one.
						</Fact>
						<Fact
							icon={Lock}
							palette='purple'>
							{created.doc.access?.enabled
								? 'Each record is private to whoever made it unless they share it.'
								: 'Everyone who can open the page sees every record.'}
						</Fact>
						<Fact
							icon={PanelLeft}
							palette='orange'>
							{created.doc.sidebarItem ? 'Added to the sidebar.' : 'Not in the sidebar — add it later on the Sidebar page.'}
						</Fact>
						{!IS_TENANT_PANEL && (
							<Fact
								icon={Settings2}
								palette='gray'>
								{created.doc.name} at /{r}
								{created.availability?.changed ? ` (${created.availability.reasons.join('; ')})` : ''} · permissions view-, create-, edit-,
								delete-{created.doc.permission} — roles with * have them; grant others on the Roles page
							</Fact>
						)}
						{created.warnings?.length > 0 && (
							<Text
								fontSize='xs'
								color='orange.fg'
								mt={2}>
								{created.warnings.join(' ')}
							</Text>
						)}
					</Panel>
					<Flex
						gap={2}
						flexWrap='wrap'>
						<Button
							size='sm'
							variant='outline'
							onClick={() => router.push(pagePath(r))}>
							<Table2 size={14} />
							Open the table
						</Button>
						<Button
							size='sm'
							variant='outline'
							onClick={() => router.push(projectHref(`/model-builder/${created.doc._id}`))}>
							<ListChecks size={14} />
							Change the fields
						</Button>
						<Button
							size='sm'
							variant='outline'
							onClick={() => router.push(projectHref(`/builder/${r}`))}>
							<LayoutTemplate size={14} />
							Change the pages
						</Button>
						<Button
							size='sm'
							variant='ghost'
							onClick={startOver}>
							Create another
						</Button>
					</Flex>
				</Flex>
			</Wrap>
		);
	}

	/* -------------------------------------------------------- step 1 */

	const modelStep = (
		<Grid
			templateColumns={{ base: '1fr', xl: 'minmax(0, 1fr) 360px' }}
			gap={6}
			alignItems='start'>
			<Flex
				direction='column'
				gap={5}
				minW={0}>
				{/* The platform's AI key; tenant projects bring their own AI over MCP (D10). */}
				{!IS_TENANT_PANEL && (
					<AiBuilder
						current={definition}
						hasModel={model.fields.some(f => f.key) && !!model.title.trim()}
						disabled={busy}
						onBuilt={applyAi}
					/>
				)}

				{ai && (
					<Panel
						title={
							<ToneTitle
								icon={Sparkles}
								palette='purple'>
								Drafted by Claude
							</ToneTitle>
						}
						subtitle={ai.model ? `With ${ai.model}. Check the fields below and the pages before creating it.` : undefined}
						actions={
							<Button
								size='xs'
								variant='ghost'
								onClick={() => setAi(null)}>
								Dismiss
							</Button>
						}>
						{ai.summary && <Text fontSize='sm'>{ai.summary}</Text>}
						{ai.warnings.map(w => (
							<Text
								key={w}
								fontSize='xs'
								color='orange.fg'
								mt={2}>
								{w}
							</Text>
						))}
					</Panel>
				)}

				<ModelPanels
					working={model}
					onChange={setModel}
					mode='create'
					targets={options?.targets || []}
					name={name}
					only={['basics', 'fields']}
					namesApart
				/>

				{/* Record numbers and privacy: most models never need them, so they wait here. */}
				<Collapsible.Root
					open={moreOpen}
					onOpenChange={e => setMoreOpen(e.open)}>
					<Collapsible.Trigger asChild>
						<Flex
							as='button'
							w='full'
							align='center'
							gap={3}
							p={3}
							borderWidth='1px'
							borderStyle='dashed'
							borderRadius='lg'
							textAlign='left'
							_hover={{ bg: 'bg.subtle' }}>
							<ToneIcon
								icon={Settings2}
								palette='gray'
							/>
							<Box
								flex='1'
								minW={0}>
								<Text
									fontSize='sm'
									fontWeight='600'>
									More options
								</Text>
								<Text
									fontSize='xs'
									color='fg.muted'>
									Names and address · Record numbers: {model.code.enabled ? `on, like ${codePreview(model.code)}` : 'off'} · Who sees
									each record: {model.access.enabled ? 'only who it’s shared with' : 'everyone with access'}
								</Text>
							</Box>
							<Box
								as='span'
								transform={moreOpen ? 'rotate(180deg)' : undefined}
								transition='transform 0.15s'>
								<ChevronDown size={16} />
							</Box>
						</Flex>
					</Collapsible.Trigger>
					<Collapsible.Content>
						<Flex
							direction='column'
							gap={5}
							mt={4}>
							<ModelPanels
								working={model}
								onChange={setModel}
								mode='create'
								targets={options?.targets || []}
								name={name}
								only={['names', 'numbers', 'privacy']}
								namesApart
							/>
						</Flex>
					</Collapsible.Content>
				</Collapsible.Root>
			</Flex>

			<Box
				position={{ xl: 'sticky' }}
				top={{ xl: 4 }}>
				<Flex
					align='baseline'
					justify='space-between'
					mb={2}>
					<Flex
						align='center'
						gap={2}>
						<ToneIcon
							icon={Eye}
							palette='orange'
							size={24}
						/>
						<Text
							fontSize='sm'
							fontWeight='600'>
							The form, so far
						</Text>
					</Flex>
					<Text
						fontSize='xs'
						color='fg.muted'>
						Updates as you type
					</Text>
				</Flex>
				<FormPreview
					fields={model.fields}
					recordName={singular(model.title.trim()) || 'Record'}
					code={{ enabled: model.code.enabled, preview: codePreview(model.code) }}
					access={model.access.enabled}
					targets={options?.targets || []}
				/>
			</Box>
		</Grid>
	);

	/* -------------------------------------------------------- step 2 */

	const countFields = (sections: any[]) =>
		sections.reduce((n, s) => n + (s.fields || []).flat().filter((x: any) => typeof x === 'string').length, 0);
	const hasAdd = !!page.button || !!page.isModal;

	const overview = (
		<Grid
			templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }}
			gap={3}>
			<AreaCard
				area='table'
				onPreview={() => openPreview('table')}
				lines={[
					`${plural((config.rest.table || []).length, 'column')} · ${plural((page.menu || []).length, 'item')} in the ⋯ menu`,
					[hasAdd && 'add button', page.export && 'export', page.select?.show && 'actions on selected rows'].filter(Boolean).join(' · ') ||
						'No header buttons',
				]}
				onOpen={() => openPart('table')}
			/>
			<AreaCard
				area='form'
				onPreview={() => openPreview('form')}
				lines={[
					`${plural(formSections.length, 'section')} · ${plural(countFields(formSections), 'field')}`,
					formSections.map(s => s.sectionTitle || 'Untitled').join(', '),
				].filter(Boolean)}
				onOpen={() => openPart('form')}
			/>
			<AreaCard
				area='view'
				onPreview={() => openPreview('view')}
				lines={
					viewSections.length
						? [`${plural(viewSections.length, 'section')} · ${plural(countFields(viewSections), 'field')}`, viewSections.map(s => s.title || 'Untitled').join(', ')]
						: ['Follows the form’s sections']
				}
				onOpen={() => openPart('view')}
			/>
			<AreaCard
				area='filters'
				lines={[plural(config.filters.length, 'filter'), config.filters.map(f => f.label || f.name).slice(0, 4).join(', ') || 'None']}
				onOpen={() => openPart('filters')}
			/>
			<AreaCard
				area='settings'
				onPreview={() => openPreview('form')}
				lines={[
					`${plural(settings.length, 'field')} · ${settings.filter((f: any) => f.required).length} required · ${settings.filter((f: any) => f.edit).length} can be changed later`,
					settingsChanged ? 'Changed by you' : 'As made from the fields',
				]}
				onOpen={() => openPart('settings')}
			/>
		</Grid>
	);

	const resetButton = (show: boolean, onClick: () => void) =>
		show && (
			<Button
				size='xs'
				variant='ghost'
				onClick={onClick}>
				<RotateCcw size={12} />
				Put back as made
			</Button>
		);

	const pagesStep = (
		<ConsoleTabs
			tabs={PAGE_TABS.map(t => ({
				value: t,
				label: <AreaTabLabel area={t} />,
				disabled: !seen.includes(t) && t !== firstUnseen,
			}))}
			value={area}
			onChange={v => openPart(v as AreaKey)}>
			{area === 'overview' && overview}

			{area === 'table' && (
				<Flex
					direction='column'
					gap={5}>
					<AreaIntro
						area='table'
						onPreview={() => openPreview('table')}
					/>
					<PageOptionsPanel
						value={page}
						onChange={next => setRest({ route: next })}
						route={route}
						code={generated?.config?.route}
					/>
					<Panel
						title={
							<ToneTitle
								icon={Table2}
								palette='teal'>
								Columns
							</ToneTitle>
						}
						subtitle='The columns the table starts with, in order. Drag to reorder; each person can still hide columns for themselves.'>
						<TableColumnsEditor
							columns={config.rest.table || []}
							fields={tableFields}
							onChange={table => setRest({ table })}
						/>
					</Panel>
					<RowMenuPanel
						value={page}
						onChange={next => setRest({ route: next })}
						route={route}
						code={generated?.config?.route}
						fields={tableFields}
					/>
					<BulkActionsPanel
						value={page}
						onChange={next => setRest({ route: next })}
						route={route}
						code={generated?.config?.route}
						fields={tableFields}
					/>
				</Flex>
			)}

			{area === 'form' && (
				<Flex
					direction='column'
					gap={5}>
					<AreaIntro
						area='form'
						onPreview={() => openPreview('form')}
					/>
					<Panel
						title={
							<ToneTitle
								icon={ListChecks}
								palette='orange'>
								Sections
							</ToneTitle>
						}
						subtitle='The form in sections. A row holds one field, or several side by side.'>
						<SectionsEditor
							mode='form'
							sections={formSections}
							fields={tableFields}
							onChange={form => setRest({ form })}
						/>
					</Panel>
					<FormRulesPanel
						rules={config.rest.formRules || {}}
						inherited={Object.fromEntries(
							settings.filter((f: any) => f.schema?.renderIf?.field).map((f: any) => [f.key, f.schema.renderIf])
						)}
						fields={(() => {
							const inForm = new Set<string>(
								formSections.flatMap((sec: any) => (sec.fields || []).flat()).filter((k: any) => typeof k === 'string')
							);
							return settings
								.filter((f: any) => !inForm.size || inForm.has(f.key))
								.map((f: any) => ({
									key: f.key,
									label: f.schema?.label || f.title,
									input: f.schema?.type,
									type: f.type,
									options: Array.isArray(f.schema?.options) ? f.schema.options : undefined,
									required: !!f.required,
								}));
						})()}
						onChange={formRules => setRest({ formRules })}
					/>
				</Flex>
			)}

			{area === 'view' && (
				<Flex
					direction='column'
					gap={5}>
					<AreaIntro
						area='view'
						onPreview={() => openPreview('view')}
					/>
					<ViewLayoutPanel
						sections={viewSections}
						onChange={view => {
							if (view) setRest({ view });
							else
								setConfig(c => {
									const { view: _removed, ...rest } = c.rest;
									return { ...c, rest };
								});
						}}
						formSections={formSections}
						allKeys={settings.filter((f: any) => !f.exclude).map((f: any) => f.key)}
						fields={tableFields}
						modelFields={preview?.fields || []}
						routes={routeOptions}
						model={preview?.availability?.name || ''}
					/>
				</Flex>
			)}

			{area === 'filters' && (
				<Flex
					direction='column'
					gap={5}>
					<AreaIntro
						area='filters'
						onPreview={() => openPreview('table')}
					/>
					<FiltersPanel
						filters={config.filters}
						onChange={filters => setConfig(c => ({ ...c, filters }))}
						fields={preview?.fields || []}
						models={preview?.models || []}
						codeFilters={generated?.config?.filters || []}
						onImportCode={() => setConfig(c => ({ ...c, filters: fromServer(generated?.config?.filters || []) }))}
					/>
				</Flex>
			)}

			{area === 'settings' && (
				<Flex
					direction='column'
					gap={5}>
					<AreaIntro
						area='settings'
						onPreview={() => openPreview('form')}
						actions={resetButton(settingsChanged, () => setSettings(generated?.settings?.fields || []))}
					/>
					<SettingsEditor
						fields={settings}
						codeFields={generated?.settings?.fields || []}
						modelFields={preview?.fields || []}
						onChange={setSettings}
					/>
				</Flex>
			)}
		</ConsoleTabs>
	);

	/* -------------------------------------------------------- step 3 */

	const finishStep = (
		<Flex
			direction='column'
			gap={5}
			maxW='860px'>
			<Panel
				title={
					<ToneTitle
						icon={PanelLeft}
						palette='orange'>
						In the sidebar
					</ToneTitle>
				}
				subtitle='Put the new table page in the sidebar, for everyone whose role can see it.'>
				<Flex
					direction='column'
					gap={4}>
					<Switch.Root
						checked={sidebar.add}
						onCheckedChange={e => setSidebar(s => ({ ...s, add: e.checked }))}>
						<Switch.HiddenInput />
						<Switch.Control>
							<Switch.Thumb />
						</Switch.Control>
						<Switch.Label fontSize='sm'>Add it to the sidebar</Switch.Label>
					</Switch.Root>
					{sidebar.add && (
						<Box maxW='320px'>
							<Text
								fontSize='xs'
								fontWeight='600'
								mb={1.5}>
								In which group
							</Text>
							<Dropdown
								value={sidebar.category}
								placeholder='Pick a group'
								onChange={v => setSidebar(s => ({ ...s, category: v }))}>
								{(options?.categories || []).map((c: any) => (
									<option
										key={c._id}
										value={c._id}>
										{c.name}
									</option>
								))}
							</Dropdown>
						</Box>
					)}
				</Flex>
			</Panel>

			<Panel
				title={
					<ToneTitle
						icon={Rocket}
						palette='green'>
						What “Create” makes
					</ToneTitle>
				}
				actions={
					<Button
						size='xs'
						variant='outline'
						onClick={() => openPreview('table')}>
						<Eye size={12} />
						Preview the pages
					</Button>
				}>
				<Fact
					icon={NotebookPen}
					palette='blue'>
					<b>{model.title.trim() || 'Your model'}</b> — each {recordName.toLowerCase()} holds {plural(model.fields.length, 'field')}
					{required ? `, ${required} of them required` : ''}.
				</Fact>
				<Fact
					icon={Table2}
					palette='teal'>
					A table page with {plural((config.rest.table || []).length, 'column')}
					{config.filters.length ? ` and ${plural(config.filters.length, 'filter')}` : ''}, a form in {plural(formSections.length, 'section')}, and a page
					for each {recordName.toLowerCase()}.
					{settingsChanged || configChanged ? ' Includes your changes.' : ''}
				</Fact>
				<Fact
					icon={Hash}
					palette='orange'>
					{model.code.enabled ? `Each record gets a number, like ${codePreview(model.code)}.` : 'No record numbers.'}
				</Fact>
				<Fact
					icon={Lock}
					palette='purple'>
					{model.access.enabled
						? 'Each record is private to whoever made it, unless they share it.'
						: 'Everyone who can open the page sees every record.'}
				</Fact>
				<Fact
					icon={PanelLeft}
					palette='orange'>
					{sidebar.add ? `In the sidebar under ${categoryName || '—'}.` : 'Not in the sidebar.'}
				</Fact>
				{!IS_TENANT_PANEL && preview && (
					<Fact
						icon={Settings2}
						palette='gray'>
						Registers as {preview.availability.name} at /{route}
						{preview.availability.changed ? ` — ${preview.availability.reasons.join('; ')}` : ''}
					</Fact>
				)}
			</Panel>
		</Flex>
	);

	/* ---------------------------------------------------------- page */

	const intro: Record<StepKey, ReactNode> = {
		model: 'Name what you’re keeping track of — Customers, Orders, Bookings… — and list what every record holds. The form preview shows what people will fill in.',
		pages: 'Your pages, made from the fields. Go through each part with Next — what it is, and a Preview of how it looks. They’re ready as they are; change anything you like on the way.',
		finish: 'Choose where it shows in the sidebar, check the summary, and create it. You can change everything later.',
	};

	return (
		<Wrap
			title='New model'
			path='model-builder'>
			<Flex
				direction='column'
				gap={5}
				pb={10}>
				<PageHeader
					breadcrumbs={crumbs}
					title={model.title.trim() || 'New model'}
					meta='Nothing is created until you press Create on the last step.'
					actions={
						(resumed || reached > 0) && (
							<Button
								size='sm'
								variant='ghost'
								disabled={busy}
								onClick={startOver}>
								<RotateCcw size={14} />
								Start over
							</Button>
						)
					}
				/>

				{resumed && (
					<Text
						fontSize='xs'
						color='fg.muted'
						mt={-3}>
						Picked up where you left off in this browser.
					</Text>
				)}

				<Stepper
					step={step}
					reached={reached}
					onGo={go}
					busy={busy}
				/>

				<StepIntro
					step={STEPS[step]}
					actions={
						<>
							<DocLink section={key === 'model' ? 'models-wizard' : key === 'pages' ? AREAS_DOC[area] : 'models-wizard'} />
							{key === 'pages' && (
								<Button
									size='sm'
									variant='outline'
									bg='bg.panel'
									onClick={() => openPreview(PREVIEW_FOR[area] || 'table')}>
									<Eye size={14} />
									Preview
								</Button>
							)}
						</>
					}>
					{intro[key]}
				</StepIntro>

				<Problems items={problems} />

				{key === 'model' && modelStep}
				{key === 'pages' && pagesStep}
				{key === 'finish' && finishStep}

				{/* Back and Next stay in reach on long steps. */}
				<Flex
					position='sticky'
					bottom={0}
					zIndex={2}
					justify='space-between'
					align='center'
					gap={3}
					py={3}
					px={4}
					bg='bg.panel'
					borderWidth='1px'
					borderColor='border'
					borderRadius='lg'
					boxShadow='sm'>
					<Button
						size='sm'
						variant='outline'
						disabled={step === 0 || busy}
						onClick={() => (key === 'pages' ? backOfPages() : go(step - 1))}>
						<ArrowLeft size={14} />
						Back
					</Button>
					<Text
						fontSize='xs'
						color='fg.muted'
						display={{ base: 'none', md: 'block' }}>
						Step {step + 1} of {STEPS.length}
						{key === 'pages' && ` · part ${partIndex + 1} of ${PAGE_TABS.length}: ${AREAS[area].label}`}
					</Text>
					{last ? (
						<Button
							size='sm'
							colorPalette='green'
							loading={creating}
							loadingText='Creating'
							disabled={busy}
							onClick={create}>
							<Check size={14} />
							Create {model.title.trim() || 'it'}
						</Button>
					) : (
						<Button
							size='sm'
							loading={previewing}
							loadingText='Making the pages'
							disabled={busy}
							onClick={() => (key === 'pages' ? nextOfPages() : go(step + 1))}>
							Next: {(key === 'pages' && nextPart ? AREAS[nextPart].label : STEPS[step + 1].title).toLowerCase()}
							<ArrowRight size={14} />
						</Button>
					)}
				</Flex>
			</Flex>

			<PagePreview
				isOpen={previewOpen}
				onClose={() => setPreviewOpen(false)}
				tab={previewTab}
				onTabChange={setPreviewTab}
				page={page}
				columns={config.rest.table || []}
				fields={previewFields}
				filters={config.filters}
				form={formSections}
				formRules={config.rest.formRules}
				view={viewSections}
				viewTabs={config.rest.viewTabs || []}
				records={[]}
			/>
		</Wrap>
	);
};

/** The guide section for each part of the pages step. */
const AREAS_DOC: Record<AreaKey, string> = {
	overview: 'models-wizard',
	settings: 'settings',
	table: 'table',
	filters: 'filters',
	form: 'form',
	view: 'view',
	source: 'source',
};

export default ModelWizard;
