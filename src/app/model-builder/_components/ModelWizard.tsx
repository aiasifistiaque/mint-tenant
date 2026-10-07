'use client';

import { FC, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Box, Button, Flex, Grid, Switch, Text } from '@chakra-ui/react';
import { HOME, IS_TENANT_PANEL } from '@/components/library/config/lib/constants/panel';
import { ArrowLeft, ArrowRight, Check, ExternalLink, RotateCcw, Settings2 } from 'lucide-react';
import {
	Layout,
	useCreateBuiltModelMutation,
	useGetBuilderRoutesQuery,
	useGetModelBuilderOptionsQuery,
	usePreviewBuiltModelMutation,
} from '@/components/library';
import { Dropdown, PageHeader, Panel } from '@/components/library/cl';
import { toaster } from '@/components/ui/toaster';
import SettingsEditor, { SettingsField } from '@/app/builder/_components/SettingsEditor';
import SectionsEditor from '@/app/builder/_components/SectionsEditor';
import FormRulesPanel from '@/app/builder/_components/FormRulesPanel';
import TableColumnsEditor, { TableField } from '@/app/builder/_components/TableColumnsEditor';
import { BulkActionsPanel, PageOptionsPanel, RowMenuPanel } from '@/app/builder/_components/PagePanels';
import FiltersPanel from '@/app/builder/_components/FiltersPanel';
import ViewLayoutPanel from '@/app/builder/_components/ViewLayoutPanel';
import { DocLink, viewProblems } from '@/app/builder/_components/ui';
import { EditableFilter, fromServer, toServer, validate } from '@/app/builder/_components/filterTypes';
import { BULK_MENU_TYPES, ROW_MENU_TYPES, validateMenu } from '@/app/builder/_components/menuTypes';
import ModelPanels, {
	ModelWorking,
	emptyModel,
	modelBody,
	requestedName,
	useFieldErrors,
	useNameAvailability,
} from './ModelPanels';
import AiBuilder from './AiBuilder';
import { fromServer as fieldsFromServer } from './modelKinds';

/**
 * A new model, one step at a time: the model itself, then its settings, page
 * config, form, table, view and filters, then whether it goes in the sidebar.
 * Nothing is created until the last step — the steps after the first work on
 * a preview the server generates (POST /builder/models/preview), and "Create
 * model" registers the model, publishes the settings and config as edited,
 * and adds the sidebar entry in one go.
 *
 * Going back to the first step and changing the fields keeps what was edited
 * later: the next preview patches the edited copies (a new field is added to
 * them, a removed one taken out) instead of starting them over.
 *
 * Progress is kept in this browser (localStorage), so a reload or a closed
 * tab picks up where it left off.
 *
 * "Build with AI" (AiBuilder) fills every step at once from a description:
 * the model, and the settings and config Claude laid out, as if the user had
 * gone through the steps — each can still be reviewed and changed.
 */

const STEPS = [
	{ key: 'model', title: 'Model', hint: 'Name, code and fields', doc: 'models-wizard' },
	{ key: 'settings', title: 'Settings', hint: 'Validation and what the API does', doc: 'settings' },
	{ key: 'config', title: 'Config', hint: 'Page header, buttons, menus', doc: 'table' },
	{ key: 'form', title: 'Form', hint: 'The create and edit form', doc: 'form' },
	{ key: 'table', title: 'Table', hint: 'The columns', doc: 'table' },
	{ key: 'view', title: 'View', hint: 'The detail page', doc: 'view' },
	{ key: 'filters', title: 'Filters', hint: 'The filter chips', doc: 'filters' },
	{ key: 'sidebar', title: 'Sidebar & create', hint: 'Where it appears; create it', doc: 'models-wizard' },
] as const;
type StepKey = (typeof STEPS)[number]['key'];

const STORAGE_KEY = 'model-wizard';

type Config = { rest: any; filters: EditableFilter[] };
const split = (config: any): Config => {
	const { filters, ...rest } = config || {};
	return { rest, filters: fromServer(filters || []) };
};
const join = ({ rest, filters }: Config) => ({ ...rest, filters: toServer(filters) });

type Saved = {
	model: ModelWorking;
	step: number;
	reached: number;
	preview: any | null;
	previewedDef: any | null;
	settings: SettingsField[];
	config: any | null;
	sidebar: { add: boolean; category: string };
};

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

const StepList: FC<{ step: number; reached: number; onGo: (i: number) => void; busy: boolean }> = ({
	step,
	reached,
	onGo,
	busy,
}) => (
	<Flex
		as='nav'
		direction={{ base: 'row', lg: 'column' }}
		gap={1}
		overflowX={{ base: 'auto', lg: 'visible' }}
		position={{ lg: 'sticky' }}
		top={{ lg: '16px' }}>
		{STEPS.map((s, i) => {
			const active = i === step;
			const done = i < step || i <= reached;
			const allowed = i <= reached && !busy;
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
					cursor={allowed ? 'pointer' : 'default'}
					opacity={allowed || active ? 1 : 0.5}
					_hover={allowed && !active ? { bg: 'bg.subtle' } : undefined}
					onClick={() => allowed && onGo(i)}
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
						borderColor={active ? 'fg' : 'border'}
						bg={active ? 'fg' : done && i !== step ? 'bg.muted' : 'transparent'}
						color={active ? 'bg' : 'fg.muted'}>
						{done && !active ? <Check size={12} /> : i + 1}
					</Flex>
					<Box display={{ base: active ? 'block' : 'none', lg: 'block' }}>
						<Text
							fontSize='sm'
							fontWeight={active ? '600' : '500'}>
							{s.title}
						</Text>
						<Text
							fontSize='xs'
							color='fg.muted'
							display={{ base: 'none', lg: 'block' }}>
							{s.hint}
						</Text>
					</Box>
				</Flex>
			);
		})}
	</Flex>
);

const Problems: FC<{ title: string; items: string[] }> = ({ title, items }) =>
	items.length ? (
		<Panel title={title}>
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
		</Panel>
	) : null;

const Row: FC<{ label: string; children: ReactNode }> = ({ label, children }) => (
	<Flex
		gap={4}
		py={2}
		borderBottomWidth='1px'
		borderColor='border.muted'
		_last={{ borderBottomWidth: 0 }}>
		<Text
			fontSize='sm'
			color='fg.muted'
			w='150px'
			flexShrink={0}>
			{label}
		</Text>
		<Text
			fontSize='sm'
			minW={0}>
			{children}
		</Text>
	</Flex>
);

const ModelWizard = () => {
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
	const loaded = useRef(false);

	// Pick up an unfinished wizard from this browser.
	useEffect(() => {
		const saved = load();
		if (saved?.model) {
			// Saved by an earlier version, it may lack newer parts (access).
			setModel({ ...emptyModel(), ...saved.model, access: saved.model.access || emptyModel().access });
			setStep(saved.step || 0);
			setReached(saved.reached || 0);
			setPreview(saved.preview);
			setPreviewedDef(saved.previewedDef);
			setSettings(saved.settings || []);
			setConfig(split(saved.config));
			setSidebar(saved.sidebar || { add: true, category: '' });
			setResumed(true);
		}
		loaded.current = true;
	}, []);
	useEffect(() => {
		if (!loaded.current || created) return;
		const t = setTimeout(
			() =>
				store({
					model,
					step,
					reached,
					preview,
					previewedDef,
					settings,
					config: preview ? join(config) : null,
					sidebar,
				}),
			300
		);
		return () => clearTimeout(t);
	}, [model, step, reached, preview, previewedDef, settings, config, sidebar, created]);

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
		default: !!f.schema?.default,
	}));
	const page = config.rest.route || {};
	const setRest = (patch: any) => setConfig(c => ({ ...c, rest: { ...c.rest, ...patch } }));
	const routeOptions = [
		...(allRoutes?.doc || []).filter((r: any) => r.kind !== 'custom' && r.model),
		...(route ? [{ route, model: preview.availability.name, title: model.title }] : []),
	].map((r: any) => ({ route: r.route, model: r.model, title: r.title }));
	const filterCheck = useMemo(() => validate(config.filters), [config.filters]);

	/** Problems that stop the wizard leaving a step. */
	const stepProblems = (key: StepKey): string[] => {
		switch (key) {
			case 'model':
				return [
					...(!model.title.trim() ? ['Give the model a title'] : []),
					...(Object.keys(fieldErrors).length ? ['Some fields need attention — they’re marked in red'] : []),
					...(name.error ? [(name.error as any)?.data?.message || 'The name isn’t usable'] : []),
				];
			case 'config': {
				const n =
					Object.keys(validateMenu(page.menu || [], ROW_MENU_TYPES)).length +
					Object.keys(validateMenu(page.select?.menu || [], BULK_MENU_TYPES)).length;
				return n ? ['A menu item is incomplete — fix the items marked in red'] : [];
			}
			case 'view':
				return viewProblems(config.rest.view);
			case 'filters':
				return Object.keys(filterCheck.errors).length ? ['Some filters need attention'] : [];
			case 'sidebar':
				return sidebar.add && !sidebar.category ? ['Pick a sidebar category, or turn the sidebar off'] : [];
			default:
				return [];
		}
	};

	/** (Re)builds everything after the first step from the model. */
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
					title: 'Pages updated for the model’s changes',
					description: 'Fields you added were added to them; removed ones taken out. Your other edits are kept.',
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
		// Leaving the model step with changes rebuilds the later steps from it.
		if (step === 0 && target > 0 && modelChanged && !(await runPreview())) return;
		setStep(target);
		setReached(r => Math.max(r, target));
		window.scrollTo({ top: 0 });
	};

	const differs = (a: any, b: any) => JSON.stringify(a) !== JSON.stringify(b);

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
			return setProblems(['The model changed since its pages were built — go through the steps again with Next']);
		}
		const cfg = join(config);
		try {
			const res = await createModel({
				...definition,
				// Only what was changed from the generated copies is published;
				// the rest runs on what the model generates, and follows it.
				...(differs({ fields: settings }, generated?.settings) && { settings: { fields: settings } }),
				...(differs(cfg, generated?.config) && { config: cfg }),
				sidebar: { category: sidebar.add ? sidebar.category : '' },
			}).unwrap();
			store(null);
			setCreated(res);
			toaster.create({ title: `${res.doc.title} created`, description: `/${res.doc.route} is live`, type: 'success' });
		} catch (e: any) {
			const found: string[] = e?.data?.problems || [e?.data?.message || 'Could not create the model'];
			setProblems(found);
			const first = found[0] || '';
			if (/^Settings:/.test(first)) setStep(1);
			else if (/^Config:/.test(first)) setStep(2);
			else if (!/pages/i.test(e?.data?.message || '')) setStep(0);
		}
	};

	/** A draft from the AI builder: the model, and every later step built as it laid them out. */
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
		setReached(STEPS.length - 1);
		setProblems([]);
		setResumed(false);
		setAi({ summary: res.summary || '', warnings: res.warnings || [], model: res.model });
		toaster.create({
			title: `${d.title || 'The model'} drafted`,
			description: 'Every step is filled in. Look through them, then create it on the last step.',
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
	};

	const key = STEPS[step].key;
	const last = step === STEPS.length - 1;
	const busy = previewing || creating;

	if (created)
		return (
			<Layout
				title='Model created'
				path='model-builder'>
				<Flex
					direction='column'
					gap={5}
					pb={10}
					maxW='720px'>
					<PageHeader
						breadcrumbs={[
							{ href: HOME, title: 'Home' },
							{ href: '/model-builder', title: 'Models' },
							{ href: '/model-builder/new', title: 'New model' },
						]}
						title={`${created.doc.title} is live`}
						meta={`${created.doc.name} · /${created.doc.route}`}
					/>
					<Panel title='What was created'>
						<Row label='Model'>
							{created.doc.name}
							{created.availability?.changed ? ` (${created.availability.reasons.join('; ')})` : ''}
						</Row>
						<Row label='Page'>/{created.doc.route} — table, form, filters and detail page</Row>
						{created.doc.access?.enabled && <Row label='Access'>Restricted per record: owner, privacy and access list</Row>}
						<Row label='Permission'>
							view-, create-, edit-, delete-{created.doc.permission} — roles with * have it; grant others on the Roles page
						</Row>
						<Row label='Sidebar'>{created.doc.sidebarItem ? 'Added' : 'Not added'}</Row>
						{created.warnings?.length > 0 && <Row label='Note'>{created.warnings.join(' ')}</Row>}
					</Panel>
					<Flex
						gap={2}
						flexWrap='wrap'>
						<Button
							size='sm'
							asChild>
							<a
								href={`/${created.doc.route}`}
								target='_blank'
								rel='noopener noreferrer'>
								<ExternalLink size={14} />
								Open the page
							</a>
						</Button>
						<Button
							size='sm'
							variant='outline'
							onClick={() => router.push(`/model-builder/${created.doc._id}`)}>
							Edit the model
						</Button>
						<Button
							size='sm'
							variant='outline'
							onClick={() => router.push(`/builder/${created.doc.route}`)}>
							<Settings2 size={14} />
							Route builder
						</Button>
						<Button
							size='sm'
							variant='ghost'
							onClick={startOver}>
							Create another
						</Button>
					</Flex>
				</Flex>
			</Layout>
		);

	return (
		<Layout
			title='New model'
			path='model-builder'>
			<Flex
				direction='column'
				gap={5}
				pb={10}>
				<PageHeader
					breadcrumbs={[
						{ href: HOME, title: 'Home' },
						{ href: '/builder', title: 'Routes' },
						{ href: '/model-builder', title: 'Models' },
						{ href: '/model-builder/new', title: 'New model' },
					]}
					title={model.title.trim() || 'New model'}
					badge={
						<Badge
							variant='outline'
							size='sm'>
							Step {step + 1} of {STEPS.length}
						</Badge>
					}
					meta={
						preview
							? `Registers as ${preview.availability.name} at /${route} — nothing is created until the last step`
							: 'Nothing is created until the last step'
					}
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
						color='fg.muted'>
						Picked up where you left off in this browser.
					</Text>
				)}

				<Grid
					templateColumns={{ base: '1fr', lg: '230px minmax(0, 1fr)' }}
					gap={6}
					alignItems='start'>
					<StepList
						step={step}
						reached={reached}
						onGo={go}
						busy={busy}
					/>

					<Flex
						direction='column'
						gap={5}
						minW={0}>
						<Flex
							align='baseline'
							justify='space-between'
							gap={3}>
							<Box>
								<Text
									fontSize='lg'
									fontWeight='600'>
									{step + 1}. {STEPS[step].title}
								</Text>
								<Text
									fontSize='sm'
									color='fg.muted'>
									{STEPS[step].hint}
								</Text>
							</Box>
							<DocLink section={STEPS[step].doc} />
						</Flex>

						<Problems
							title='Before you go on'
							items={problems}
						/>

						{/* The platform's AI key; tenant projects bring their own AI over MCP (D10). */}
						{key === 'model' && !IS_TENANT_PANEL && (
							<AiBuilder
								current={definition}
								hasModel={model.fields.some(f => f.key) && !!model.title.trim()}
								disabled={busy}
								onBuilt={applyAi}
							/>
						)}

						{key === 'model' && ai && (
							<Panel
								title='Drafted by Claude'
								subtitle={ai.model ? `With ${ai.model}. Check the fields below and the later steps before creating it.` : undefined}
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
								<Button
									size='xs'
									variant='outline'
									mt={3}
									disabled={busy}
									onClick={() => go(1)}>
									Review the steps
									<ArrowRight size={14} />
								</Button>
							</Panel>
						)}

						{key === 'model' && (
							<ModelPanels
								working={model}
								onChange={setModel}
								mode='create'
								targets={options?.targets || []}
								name={name}
							/>
						)}

						{key === 'settings' && (
							<Panel
								title='Settings'
								subtitle='What the API validates, lets be edited, sorts, searches and returns — generated from the fields. Change it here, or leave it.'
								actions={
									differs({ fields: settings }, generated?.settings) && (
										<Button
											size='xs'
											variant='outline'
											onClick={() => setSettings(generated?.settings?.fields || [])}>
											<RotateCcw size={14} />
											Generated settings
										</Button>
									)
								}>
								<SettingsEditor
									fields={settings}
									codeFields={generated?.settings?.fields || []}
									modelFields={preview?.fields || []}
									onChange={setSettings}
								/>
							</Panel>
						)}

						{key === 'config' && (
							<>
								<PageOptionsPanel
									value={page}
									onChange={next => setRest({ route: next })}
									route={route}
									code={generated?.config?.route}
								/>
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
							</>
						)}

						{key === 'form' && (
							<Panel
								title='Form'
								subtitle='The create and edit form, in sections. A row holds one field, or several side by side.'>
								<SectionsEditor
									mode='form'
									sections={config.rest.form || []}
									fields={tableFields}
									onChange={form => setRest({ form })}
								/>
							</Panel>
						)}
						{key === 'form' && (
							<FormRulesPanel
								rules={config.rest.formRules || {}}
								inherited={Object.fromEntries(
									settings.filter((f: any) => f.schema?.renderIf?.field).map((f: any) => [f.key, f.schema.renderIf])
								)}
								fields={(() => {
									const inForm = new Set<string>(
										(config.rest.form || []).flatMap((sec: any) => (sec.fields || []).flat()).filter((k: any) => typeof k === 'string')
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
						)}

						{key === 'table' && (
							<Panel
								title='Table columns'
								subtitle='The columns the table has, in order. Drag to reorder; each admin can still hide columns in Preferences.'>
								<TableColumnsEditor
									columns={config.rest.table || []}
									fields={tableFields}
									onChange={table => setRest({ table })}
								/>
							</Panel>
						)}

						{key === 'view' && (
							<ViewLayoutPanel
								sections={config.rest.view || []}
								onChange={view => {
									if (view) setRest({ view });
									else
										setConfig(c => {
											const { view: _removed, ...rest } = c.rest;
											return { ...c, rest };
										});
								}}
								formSections={config.rest.form || []}
								allKeys={settings.filter((f: any) => !f.exclude).map((f: any) => f.key)}
								fields={tableFields}
								modelFields={preview?.fields || []}
								routes={routeOptions}
								model={preview?.availability?.name || ''}
							/>
						)}

						{key === 'filters' && (
							<FiltersPanel
								filters={config.filters}
								onChange={filters => setConfig(c => ({ ...c, filters }))}
								fields={preview?.fields || []}
								models={preview?.models || []}
								codeFilters={generated?.config?.filters || []}
								onImportCode={() => setConfig(c => ({ ...c, filters: fromServer(generated?.config?.filters || []) }))}
							/>
						)}

						{key === 'sidebar' && (
							<>
								<Panel
									title='Sidebar'
									subtitle='Put the new page in the admin sidebar, for roles that can view it.'>
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
													Under which category
												</Text>
												<Dropdown
													value={sidebar.category}
													placeholder='Pick a category'
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
									title='Ready to create'
									subtitle='This is what “Create model” sets up.'>
									<Row label='Model'>
										{preview?.availability?.name}
										{preview?.availability?.changed ? ` — ${preview.availability.reasons.join('; ')}` : ''}
									</Row>
									<Row label='Page'>/{route}</Row>
									<Row label='Access'>
										{model.access.enabled
											? 'Restricted per record — each record is set to Only me, Private or Public in its form'
											: 'Everyone who can open the page sees every record'}
									</Row>
									<Row label='Fields'>
										{model.fields.length}
										{model.code.enabled ? ` · codes like ${model.code.prefix ? `${model.code.prefix}-` : ''}${'1'.padStart(model.code.padding, '0')}` : ''}
									</Row>
									<Row label='Settings'>
										{differs({ fields: settings }, generated?.settings) ? 'Customized — published as version 1' : 'As generated'}
									</Row>
									<Row label='Page config'>
										{differs(join(config), generated?.config) ? 'Customized — published as version 1' : 'As generated'} ·{' '}
										{(config.rest.table || []).length} columns · {(config.rest.form || []).length} form sections ·{' '}
										{(config.rest.view || []).length} view sections · {config.filters.length} filters
									</Row>
									<Row label='Sidebar'>
										{sidebar.add
											? `Under ${(options?.categories || []).find((c: any) => c._id === sidebar.category)?.name || '—'}`
											: 'Not added'}
									</Row>
								</Panel>
							</>
						)}

						<Flex
							justify='space-between'
							gap={3}
							pt={2}>
							<Button
								size='sm'
								variant='outline'
								disabled={step === 0 || busy}
								onClick={() => go(step - 1)}>
								<ArrowLeft size={14} />
								Back
							</Button>
							{last ? (
								<Button
									size='sm'
									loading={creating}
									disabled={busy}
									onClick={create}>
									<Check size={14} />
									Create model
								</Button>
							) : (
								<Button
									size='sm'
									loading={previewing}
									disabled={busy}
									onClick={() => go(step + 1)}>
									Next: {STEPS[step + 1].title}
									<ArrowRight size={14} />
								</Button>
							)}
						</Flex>
					</Flex>
				</Grid>
			</Flex>
		</Layout>
	);
};

export default ModelWizard;
