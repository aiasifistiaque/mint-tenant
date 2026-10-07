'use client';

import { FC, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Box, Button, CloseButton, Flex, Grid, SegmentGroup, Text } from '@chakra-ui/react';
import { ArrowRight, Boxes, ClipboardList, Columns3, Eye, History, ListChecks, RotateCcw, Rocket, Save, Sparkles, Undo2 } from 'lucide-react';
import {
	Layout,
	useDiscardBuilderDraftMutation,
	useGetBuilderRouteQuery,
	useGetBuilderVersionsQuery,
	usePublishBuilderRouteMutation,
	useResetBuilderRouteMutation,
	useRestoreBuilderVersionMutation,
	useSaveBuilderDraftMutation,
	useCompareBuilderRouteQuery,
	useSetBuilderSourceMutation,
	useGetBuilderRoutesQuery,
	useGetAllQuery,
} from '@/components/library';
import {
	ConfirmAction,
	DetailSkeleton,
	ErrorState,
	ConsoleTabs,
	PageHeader,
	Panel,
	StatusDot,
	when,
} from '@/components/library/cl';
import { toaster } from '@/components/ui/toaster';
import TableColumnsEditor, { TableField } from './TableColumnsEditor';
import { EditableFilter, ModelField, fromServer, humanize, toServer, validate } from './filterTypes';
import { BulkActionsPanel, PageOptionsPanel, RowMenuPanel } from './PagePanels';
import FiltersPanel, { VISIBLE_BEFORE_MORE } from './FiltersPanel';
import ViewLayoutPanel from './ViewLayoutPanel';
import ViewTabsEditor, { tabProblems } from './ViewTabsEditor';
import FormRulesPanel, { RuleField, formRuleProblems } from './FormRulesPanel';
import { viewProblems } from './ui';
import SettingsEditor, { SettingsField } from './SettingsEditor';
import SectionsEditor from './SectionsEditor';
import PublishDialog from './PublishDialog';
import PagePreview, { PreviewField, PreviewTab } from './PagePreview';
import { AREAS, AreaCard, AreaIcon, AreaIntro, AreaKey, AreaTabLabel, ToneTitle } from './areas';
import { BULK_MENU_TYPES, DEFAULT_ROW_MENU, ROW_MENU_TYPES, validateMenu } from './menuTypes';
import { HOME, IS_TENANT_PANEL, projectHref } from '@/components/library/config/lib/constants/panel';

const DEFAULT_ADD_BUTTON = { title: 'Add Item', isModal: true };

const TABS: { value: AreaKey; label?: string }[] = [
	{ value: 'overview' },
	{ value: 'table' },
	{ value: 'form' },
	{ value: 'view' },
	{ value: 'filters' },
	{ value: 'settings' },
	{ value: 'source', label: IS_TENANT_PANEL ? undefined : 'Source & versions' },
];

/** Which preview a tab's Preview button opens. */
const PREVIEW_FOR: Partial<Record<AreaKey, PreviewTab>> = { table: 'table', filters: 'table', form: 'form', settings: 'form', view: 'view' };

/** The one-time "how changes go live" note, hidden for good once closed (this browser only). */
const INTRO_KEY = 'route-editor-intro-hidden';

/**
 * The config the editor works on, minus filters (held separately as cards so
 * each keeps a stable key while dragged). Everything else in the config file
 * — form, fields, row and bulk menus — rides along untouched until the
 * builder grows sections for it.
 */
type Working = { rest: any; filters: EditableFilter[] };

const split = (config: any): Working => {
	const { filters, ...rest } = config || {};
	return { rest, filters: fromServer(filters || []) };
};

const join = ({ rest, filters }: Working) => ({ ...rest, filters: toServer(filters) });

const toastError = (title: string, e: any) =>
	toaster.create({
		title,
		description: [e?.data?.message, ...(e?.data?.problems || [])].filter(Boolean).join(' — ') || 'Something went wrong',
		type: 'error',
		duration: 12000,
	});

/**
 * One admin route in the builder.
 *
 * Edits go into a draft; the route keeps running on its published copy (or
 * its code files) until Publish. Where the editor starts: the saved draft if
 * there is one, else the published copy, else the code.
 */
export const RouteEditorView: FC<{ route: string; data: any }> = ({ route, data }) => {
	const router = useRouter();

	const [saveDraft, { isLoading: saving }] = useSaveBuilderDraftMutation();
	const [discardDraft, { isLoading: discarding }] = useDiscardBuilderDraftMutation();
	const [publish, { isLoading: publishing }] = usePublishBuilderRouteMutation();
	/** Where a publish from the dialog is: saving the unsaved edits first, then publishing. */
	const [publishStep, setPublishStep] = useState<'saving' | 'publishing' | null>(null);
	const [reset, { isLoading: resetting }] = useResetBuilderRouteMutation();
	const [restore] = useRestoreBuilderVersionMutation();

	const [working, setWorking] = useState<Working>({ rest: {}, filters: [] });
	const [baseline, setBaseline] = useState('');
	const [editingUid, setEditingUid] = useState<string | null>(null);
	const [confirm, setConfirm] = useState<null | 'publish' | 'reset-config' | 'reset-settings' | 'discard' | 'import'>(null);
	const [showVersions, setShowVersions] = useState(false);
	const [versionKind, setVersionKind] = useState<'config' | 'settings'>('config');
	const [settingsWorking, setSettingsWorking] = useState<SettingsField[]>([]);
	const [settingsBaseline, setSettingsBaseline] = useState('');
	// The open section lives in `?tab=`, so a section can be linked to and a
	// reload lands on it. Switching tabs keeps every unsaved edit.
	const [tab, setTab] = useState('overview');
	useEffect(() => {
		const t = new URLSearchParams(window.location.search).get('tab');
		if (t && TABS.some(x => x.value === t)) setTab(t);
	}, []);
	const goTo = (t: string) => {
		setTab(t);
		const url = new URL(window.location.href);
		url.searchParams.set('tab', t);
		window.history.replaceState(null, '', url.toString());
	};
	const { data: allRoutes } = useGetBuilderRoutesQuery();

	// Preview: a modal drawing the table, the form and a record page from the working copy.
	const [preview, setPreview] = useState<PreviewTab | null>(null);
	const [previewTab, setPreviewTab] = useState<PreviewTab>('table');
	const openPreview = (t: PreviewTab = 'table') => {
		setPreviewTab(t);
		setPreview(t);
	};
	// The route's latest records fill the preview in — only asked for once it's opened.
	const { data: sample, isFetching: sampleLoading } = useGetAllQuery(
		{ path: route, limit: 5, sort: '-createdAt' },
		{ skip: !preview || data?.kind === 'custom' }
	);
	const [intro, setIntro] = useState(false);
	useEffect(() => {
		try {
			setIntro(localStorage.getItem(INTRO_KEY) !== '1');
		} catch {
			setIntro(true);
		}
	}, []);
	const hideIntro = () => {
		setIntro(false);
		try {
			localStorage.setItem(INTRO_KEY, '1');
		} catch {}
	};

	const { data: versions } = useGetBuilderVersionsQuery(
		{ route, kind: versionKind },
		{ skip: !showVersions }
	);
	const { data: compare } = useCompareBuilderRouteQuery(route);
	const [setSource, { isLoading: switching }] = useSetBuilderSourceMutation();

	const config = data?.config;
	const codeConfig = data?.code?.config || {};
	const base = config?.draft ?? config?.data ?? codeConfig;
	const settingsDoc = data?.settings;
	const codeSettingsFields: SettingsField[] = data?.code?.settings?.fields || [];
	const settingsBase: SettingsField[] = (settingsDoc?.draft ?? settingsDoc?.data)?.fields || codeSettingsFields;
	// Only routes built by defineRoutes have a settings file, and access-control
	// routes keep theirs exactly as in code.
	const hasSettings = data?.kind !== 'custom';
	const settingsReadOnly = !hasSettings || !!data?.protected;

	useEffect(() => {
		if (!data) return;
		const next = split(base);
		setWorking(next);
		setBaseline(JSON.stringify(join(next)));
		setSettingsWorking(settingsBase);
		setSettingsBaseline(JSON.stringify(settingsBase));
		setEditingUid(null);
		// `base` is derived from `data`; re-seed only when the server copy changes.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [data]);

	const current = useMemo(() => JSON.stringify(join(working)), [working]);
	const configDirty = !!baseline && current !== baseline;
	const settingsDirty = useMemo(
		() => !!settingsBaseline && JSON.stringify(settingsWorking) !== settingsBaseline,
		[settingsWorking, settingsBaseline]
	);
	const isDirty = configDirty || settingsDirty;

	useEffect(() => {
		if (!isDirty) return;
		const warn = (e: BeforeUnloadEvent) => e.preventDefault();
		window.addEventListener('beforeunload', warn);
		return () => window.removeEventListener('beforeunload', warn);
	}, [isDirty]);

	const { errors, warnings } = useMemo(() => validate(working.filters), [working.filters]);
	// Named problems, so the toast can say which item and what it needs. Bulk
	// actions only count while row selection is on: with it off the editor
	// isn't shown and the menu isn't used, so an item there can't block a save.
	const menuProblems = useMemo(() => {
		const describe = (label: string, items: any[], errs: Record<number, string>) =>
			Object.entries(errs).map(([i, msg]) => `${label} “${items[+i]?.title || `item ${+i + 1}`}”: ${msg.toLowerCase()}`);
		const row = working.rest.route?.menu || [];
		const bulk = working.rest.route?.select?.show ? working.rest.route?.select?.menu || [] : [];
		return [
			...describe('Row menu', row, validateMenu(row, ROW_MENU_TYPES)),
			...describe('Bulk action', bulk, validateMenu(bulk, BULK_MENU_TYPES)),
		];
	}, [working.rest.route]);
	const menuErrors = menuProblems.length;
	// Bumped by a save blocked on a menu item: once the Table tab has rendered,
	// scroll to the first item marked in red — it can be far down the page.
	const [revealMenuError, setRevealMenuError] = useState(0);
	useEffect(() => {
		if (revealMenuError) document.querySelector('[data-menu-invalid]')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
	}, [revealMenuError]);
	const errorCount = Object.keys(errors).length;

	// Columns can only be settings fields — getConfig renders cells from them.
	// The settings being edited, not the published ones — a field added in the
	// Settings panel can be a column straight away.
	const settingsFields: any[] = settingsWorking;
	const ruleFields: RuleField[] = (() => {
		const inForm = new Set<string>(
			(working.rest.form || []).flatMap((sec: any) => (sec.fields || []).flat()).filter((k: any) => typeof k === 'string')
		);
		return settingsWorking
			.filter(f => !inForm.size || inForm.has(f.key))
			.map(f => ({
				key: f.key,
				label: f.schema?.label || f.title,
				input: f.schema?.type,
				type: f.type,
				options: Array.isArray(f.schema?.options) ? f.schema.options : undefined,
				required: !!f.required,
			}));
	})();
	const tableFields: TableField[] = settingsFields.map((f: any) => ({
		key: f.key,
		label: f.schema?.label || f.title || f.key,
		// The stored data type — 'number' fields are the ones a total can add up.
		type: f.type,
		input: f.schema?.type,
		options: f.schema?.options || f.options,
		default: !!f.schema?.default,
	}));
	const modelFields: ModelField[] = data?.fields || [];
	const codeFilters: any[] = codeConfig.filters || [];

	const setRest = (patch: any) => setWorking(w => ({ ...w, rest: { ...w.rest, ...patch } }));
	const setRouteConfig = (patch: any) =>
		setWorking(w => ({ ...w, rest: { ...w.rest, route: { ...w.rest.route, ...patch } } }));
	const setFilters = (fn: (f: EditableFilter[]) => EditableFilter[]) =>
		setWorking(w => ({ ...w, filters: fn(w.filters) }));

	const pageConfig = working.rest.route;
	const hasAddButton = !!pageConfig?.button || !!pageConfig?.isModal;
	const columnsAreCode = JSON.stringify(working.rest.table || []) === JSON.stringify(codeConfig.table || []);

	/**
	 * A table config for a route that has none, built from its settings: the
	 * columns its settings show by default, every field in the quick view, the
	 * editable ones in the form, and the usual row menu. A starting point to
	 * edit, not a finished page — it isn't live until published.
	 */
	const createTableConfig = () => {
		const keys = settingsFields.map((f: any) => f.key);
		const defaults = settingsFields.filter((f: any) => f.schema?.default).map((f: any) => f.key);
		const editable = settingsFields.filter((f: any) => f.edit).map((f: any) => f.key);
		setRest({
			route: {
				title: humanize(route.split('/').pop()),
				subTitle: '',
				path: route,
				button: DEFAULT_ADD_BUTTON,
				export: true,
				menu: DEFAULT_ROW_MENU,
			},
			table: working.rest.table?.length ? working.rest.table : defaults.length ? defaults : keys.slice(0, 6),
			fields: working.rest.fields?.length ? working.rest.fields : keys,
			form: working.rest.form?.length ? working.rest.form : [{ sectionTitle: 'Details', fields: editable }],
		});
	};

	/** Saves the working copy as the draft. Returns false if it didn't save. */
	const save = async () => {
		if (errorCount) {
			setEditingUid(Object.keys(errors)[0]);
			return false;
		}
		const fp = formRuleProblems(working.rest.formRules, ruleFields);
		if (fp.length) {
			goTo('form');
			toaster.create({ title: 'A conditional field is incomplete', description: fp.join(' · '), type: 'error' });
			return false;
		}
		const vp = [...viewProblems(working.rest.view), ...tabProblems(working.rest.viewTabs)];
		if (vp.length) {
			goTo('view');
			toaster.create({ title: 'The view is incomplete', description: vp.join(' · '), type: 'error' });
			return false;
		}
		if (menuErrors) {
			// The menus are edited on the Table tab — go there, to the item marked in red.
			goTo('table');
			setRevealMenuError(n => n + 1);
			toaster.create({
				title: menuErrors === 1 ? 'A menu item is incomplete' : `${menuErrors} menu items are incomplete`,
				description: `${menuProblems.join(' · ')}. It’s marked in red on the Table tab.`,
				type: 'error',
			});
			return false;
		}
		try {
			if (settingsDirty && !settingsReadOnly)
				await saveDraft({ route, kind: 'settings', draft: { fields: settingsWorking } }).unwrap();
			if (configDirty) await saveDraft({ route, kind: 'config', draft: join(working) }).unwrap();
			return true;
		} catch (e: any) {
			toastError('Could not save the draft', e);
			return false;
		}
	};

	const onSaveDraft = async () => {
		if (await save()) toaster.create({ title: 'Draft saved', description: 'Not live until published', type: 'success' });
	};

	const onPublish = async (note?: string) => {
		// Shown on the dialog's button only — the page's own buttons stay still.
		setPublishStep(isDirty ? 'saving' : 'publishing');
		if (isDirty && !(await save())) {
			setPublishStep(null);
			return setConfirm(null);
		}
		setPublishStep('publishing');
		try {
			const res = await publish({ route, note }).unwrap();
			setPublishStep(null);
			setConfirm(null);
			toaster.create({
				title: 'Published',
				description: res.published.map((p: any) => `${p.kind} v${p.version}`).join(', ') + ` — /${route} is live`,
				type: 'success',
			});
		} catch (e: any) {
			setPublishStep(null);
			toastError('Could not publish', e);
		}
	};

	const onDiscard = async () => {
		setConfirm(null);
		try {
			if (config?.draft) await discardDraft({ route, kind: 'config' }).unwrap();
			if (settingsDoc?.draft) await discardDraft({ route, kind: 'settings' }).unwrap();
			toaster.create({ title: 'Draft discarded', type: 'success' });
		} catch (e: any) {
			toastError('Could not discard', e);
		}
	};

	const onReset = async (kind: 'config' | 'settings') => {
		setConfirm(null);
		try {
			await reset({ route, kind }).unwrap();
			toaster.create({ title: 'Reset to code', description: 'The published copy is kept in versions', type: 'success' });
		} catch (e: any) {
			toastError('Could not reset', e);
		}
	};

	const onSource = async (kind: 'config' | 'settings', source: 'inherit' | 'db' | 'code') => {
		try {
			await setSource({ route, kind, source }).unwrap();
			toaster.create({ title: `${kind === 'config' ? 'Config' : 'Settings'} source: ${source === 'inherit' ? 'follows the global switch' : source === 'db' ? 'DB copy' : 'code file'}`, description: 'Live now', type: 'success' });
		} catch (e: any) {
			toastError('Could not switch the source', e);
		}
	};

	const onRestore = async (v: any) => {
		try {
			await restore({ route, kind: versionKind, versionId: v._id }).unwrap();
			toaster.create({ title: `Version ${v.version} loaded as the draft`, description: 'Publish to make it live', type: 'success' });
		} catch (e: any) {
			toastError('Could not load that version', e);
		}
	};

	const title = pageConfig?.title || route;
	const live = config?.serving === 'db' ? `config v${config.version}` : 'config from code';
	const settingsLive = settingsDoc?.serving === 'db' ? `settings v${settingsDoc.version}` : 'settings from code';
	const hasDraft = !!config?.draft || !!data.settings?.draft;
	const busy = saving || publishing || discarding || resetting;
	const isGeneric = !!pageConfig;

	const formSections: any[] = working.rest.form || [];
	const viewSections: any[] = working.rest.view || [];
	const viewTabs: any[] = working.rest.viewTabs || [];
	const countFields = (sections: any[]) =>
		sections.reduce((n, s) => n + (s.fields || []).flat().filter((x: any) => typeof x === 'string').length, 0);
	const settingsDiff = compare?.settings?.published;
	const relatedCount = viewSections.reduce(
		(n, s) => n + (s.fields || []).filter((x: any) => typeof x === 'object' && 'related' in x).length,
		0
	);
	const routeOptions = (allRoutes?.doc || [])
		.filter((r: any) => r.kind !== 'custom' && r.model)
		.map((r: any) => ({ route: r.route, model: r.model, title: r.title }));

	const needsTableConfig = (
		<Panel title='No table config'>
			<Flex
				direction='column'
				gap={3}
				align='flex-start'>
				<Text
					fontSize='sm'
					color='fg.muted'>
					This route&apos;s page is hand-written, so its form is too. Create a table config first (Table tab) —
					it includes a form built from the settings.
				</Text>
				<Button
					size='xs'
					variant='outline'
					onClick={() => goTo('table')}>
					Go to Table
				</Button>
			</Flex>
		</Panel>
	);

	const overview = (
		<Grid
			templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }}
			gap={3}>
			<AreaCard
				area='table'
				tone={isGeneric ? undefined : 'warn'}
				onPreview={isGeneric ? () => openPreview('table') : undefined}
				lines={
					isGeneric
						? [
								`${(working.rest.table || []).length} columns · ${(pageConfig.menu || []).length} items in the ⋯ menu`,
								[
									hasAddButton && 'add button',
									pageConfig.export && 'export',
									pageConfig.bulkUpload && 'bulk upload',
									pageConfig.select?.show && 'bulk actions',
									pageConfig.clickable && 'clickable rows',
								]
									.filter(Boolean)
									.join(' · ') || 'No header buttons',
						  ]
						: ['No table setup yet — the page is hand-written', 'Create one from its fields']
				}
				onOpen={() => goTo('table')}
			/>
			<AreaCard
				area='form'
				onPreview={formSections.length ? () => openPreview('form') : undefined}
				lines={
					formSections.length
						? [
								`${formSections.length} ${formSections.length === 1 ? 'section' : 'sections'} · ${countFields(formSections)} fields${
									Object.keys(working.rest.formRules || {}).length ? ` · ${Object.keys(working.rest.formRules).length} shown only when needed` : ''
								}`,
								formSections.map(s => s.sectionTitle || 'Untitled').join(', '),
						  ]
						: [isGeneric ? 'No form sections' : 'Part of the table config']
				}
				onOpen={() => goTo('form')}
			/>
			<AreaCard
				area='view'
				onPreview={hasSettings ? () => openPreview('view') : undefined}
				lines={[
					...(viewSections.length
						? [
								`${viewSections.length} ${viewSections.length === 1 ? 'section' : 'sections'} · ${countFields(viewSections)} fields${relatedCount ? ` · ${relatedCount} related lists` : ''}`,
								viewSections.map(s => s.title || 'Untitled').join(', '),
						  ]
						: ['No layout of its own yet — it follows the form’s sections']),
					...(viewTabs.length ? [`Tabs: Overview, ${viewTabs.map(t => t.title || t.related).join(', ')}`] : []),
				]}
				onOpen={() => goTo('view')}
			/>
			<AreaCard
				area='filters'
				lines={[
					`${working.filters.length} ${working.filters.length === 1 ? 'filter' : 'filters'}`,
					working.filters
						.slice(0, VISIBLE_BEFORE_MORE)
						.map(f => f.label || f.name)
						.join(', ') || 'None',
				]}
				onOpen={() => goTo('filters')}
			/>
			{hasSettings && (
				<AreaCard
					area='settings'
					lines={[
						`${settingsWorking.length} fields · ${settingsWorking.filter(f => f.edit).length} editable · ${settingsWorking.filter(f => f.required).length} required`,
						IS_TENANT_PANEL
							? ''
							: settingsDiff
							? settingsDiff.identical
								? 'Published copy matches the settings file'
								: `Published copy differs from the file (${[settingsDiff.added?.length && `${settingsDiff.added.length} added`, settingsDiff.removed?.length && `${settingsDiff.removed.length} removed`, settingsDiff.changed?.length && `${settingsDiff.changed.length} changed`].filter(Boolean).join(', ') || 'reordered'})`
							: 'Runs on the settings file',
						data.protected ? 'Locked — controls access' : settingsDirty ? 'Unsaved changes' : '',
					].filter(Boolean)}
					onOpen={() => goTo('settings')}
				/>
			)}
			<AreaCard
				area='source'
				title={IS_TENANT_PANEL ? undefined : 'Source & versions'}
				lines={[
					hasDraft ? 'A draft is waiting to be published' : 'Nothing waiting to be published',
					IS_TENANT_PANEL
						? config?.version
							? `Live: version ${config.version}`
							: 'Not published yet — runs on its starting setup'
						: `Settings: ${hasSettings ? (settingsDoc?.serving === 'db' ? `DB v${settingsDoc.version}` : 'code file') : 'n/a'} · Config: ${config?.serving === 'db' ? `DB v${config.version}` : 'code file'}`,
				]}
				onOpen={() => goTo('source')}
			/>
		</Grid>
	);

	// Conditional fields: the ones in the form (every settings field when the form is hand-written).
	const inheritedRules: Record<string, any> = Object.fromEntries(
		settingsWorking.filter(f => f.schema?.renderIf?.field).map(f => [f.key, f.schema.renderIf])
	);
	const rulesPanel = hasSettings ? (
		<FormRulesPanel
			rules={working.rest.formRules || {}}
			inherited={inheritedRules}
			fields={ruleFields}
			onChange={formRules => {
				if (formRules) setRest({ formRules });
				else {
					const { formRules: _removed, ...rest } = working.rest;
					setWorking(w => ({ ...w, rest }));
				}
			}}
		/>
	) : null;

	const formPanel = !isGeneric ? (
		needsTableConfig
	) : (
		<Panel
			title={
				<ToneTitle
					icon={ClipboardList}
					palette='orange'>
					Sections of the form
				</ToneTitle>
			}
			subtitle='The add and edit form, in sections. A row holds one field, or several side by side.'
			actions={
				JSON.stringify(formSections) !== JSON.stringify(codeConfig.form || []) &&
				codeConfig.form && (
					<Button
						size='xs'
						variant='outline'
						onClick={() => setRest({ form: codeConfig.form })}>
						<RotateCcw size={14} />
						{IS_TENANT_PANEL ? 'Starting form' : 'Code form'}
					</Button>
				)
			}>
			<SectionsEditor
				mode='form'
				sections={formSections}
				fields={tableFields}
				onChange={form => setRest({ form })}
			/>
		</Panel>
	);

	const viewPanel = !hasSettings ? (
		<Panel title='View'>
			<Text
				fontSize='sm'
				color='fg.muted'>
				This is a hand-written route; its detail page isn&apos;t built from config.
			</Text>
		</Panel>
	) : (
		<Flex
			direction='column'
			gap={5}>
			<ViewLayoutPanel
				sections={viewSections}
				onChange={view => {
					if (view) setRest({ view });
					else {
						const { view: _removed, ...rest } = working.rest;
						setWorking(w => ({ ...w, rest }));
					}
				}}
				formSections={formSections}
				allKeys={settingsWorking.filter(f => !f.exclude).map(f => f.key)}
				fields={tableFields}
				modelFields={modelFields}
				routes={routeOptions}
				model={data.model}
			/>
			<ViewTabsEditor
				tabs={viewTabs}
				onChange={tabs => {
					if (tabs.length) setRest({ viewTabs: tabs });
					else {
						const { viewTabs: _removed, ...rest } = working.rest;
						setWorking(w => ({ ...w, rest }));
					}
				}}
				model={data.model}
				modelFields={modelFields}
				routes={routeOptions}
			/>
		</Flex>
	);

	const undo = () => {
		setWorking(split(base));
		setSettingsWorking(settingsBase);
		setEditingUid(null);
	};
	// A project's model names carry the project's id (T<id>_Invoice); people know it as Invoice.
	const modelName = data.builtModel?.name || String(data.model || '').replace(/^T[0-9a-f]{24}_/, '');
	const previewFields: PreviewField[] = tableFields.map(f => ({
		...f,
		required: !!settingsWorking.find(x => x.key === f.key)?.required,
	}));

	return (
		<>
			<Flex
				direction='column'
				gap={5}
				pb={isDirty ? 4 : 10}>
				<PageHeader
					breadcrumbs={[
						{ href: HOME, title: 'Home' },
						{ href: projectHref('/builder'), title: IS_TENANT_PANEL ? 'Pages' : 'Routes' },
						{ href: '#', title: title },
					]}
					title={title}
					badge={
						<Flex
							gap={3}
							align='center'>
							{hasDraft ? (
								<StatusDot
									tone='pending'
									label='Draft not published yet'
									title='People still see the published version'
								/>
							) : (
								<StatusDot
									tone='running'
									label='Live'
									title='What you see here is what people see'
								/>
							)}
							{isDirty && (
								<Badge
									colorPalette='blue'
									variant='subtle'>
									Unsaved changes
								</Badge>
							)}
						</Flex>
					}
					meta={[
						modelName && `${modelName} records`,
						`/${route}`,
						IS_TENANT_PANEL
							? config?.version
								? `published version ${config.version}`
								: 'using its starting setup'
							: `live: ${data.kind === 'custom' ? live : `${settingsLive}, ${live}`}`,
						config?.draftUpdatedAt && `draft saved ${when(config.draftUpdatedAt)}`,
					]
						.filter(Boolean)
						.join(' · ')}
					actions={
						<>
							{isGeneric && (
								<Button
									size='sm'
									variant='outline'
									onClick={() => openPreview(PREVIEW_FOR[tab as AreaKey] || 'table')}>
									<Eye size={14} />
									Preview
								</Button>
							)}
							{(config?.draft || settingsDoc?.draft) && !isDirty && (
								<Button
									size='sm'
									variant='ghost'
									disabled={busy}
									onClick={() => setConfirm('discard')}>
									Discard draft
								</Button>
							)}
							<Button
								size='sm'
								variant='outline'
								disabled={!isDirty || busy}
								loading={saving && !publishStep}
								title='Keep your changes without making them live'
								onClick={onSaveDraft}>
								<Save size={14} />
								Save draft
							</Button>
							<Button
								size='sm'
								disabled={(!isDirty && !hasDraft) || busy}
								title='Make your changes live for everyone'
								onClick={() => setConfirm('publish')}>
								<Rocket size={14} />
								Publish
							</Button>
						</>
					}
				/>

				{intro && (
					<Flex
						gap={4}
						align={{ base: 'flex-start', md: 'center' }}
						direction={{ base: 'column', md: 'row' }}
						p={4}
						borderWidth='1px'
						borderColor='border'
						borderRadius='lg'
						bg='bg.subtle'>
						<Box flex='1'>
							<Text
								fontSize='sm'
								fontWeight='600'
								mb={2}>
								How changes go live
							</Text>
							<Flex
								gap={{ base: 2, md: 5 }}
								direction={{ base: 'column', md: 'row' }}>
								{[
									{ n: 1, palette: 'blue', title: 'Change', text: 'Pick a part below and edit it. Preview shows the result.' },
									{ n: 2, palette: 'orange', title: 'Save draft', text: 'Keeps your work. People still see the live version.' },
									{ n: 3, palette: 'teal', title: 'Publish', text: 'Makes it live for everyone. Old versions are kept.' },
								].map(step => (
									<Flex
										key={step.n}
										gap={2.5}
										align='flex-start'
										flex='1'>
										<Flex
											align='center'
											justify='center'
											flexShrink={0}
											w='22px'
											h='22px'
											borderRadius='full'
											bg={`${step.palette}.solid`}
											color={`${step.palette}.contrast`}
											fontSize='11px'
											fontWeight='700'>
											{step.n}
										</Flex>
										<Box>
											<Text
												fontSize='13px'
												fontWeight='600'>
												{step.title}
											</Text>
											<Text
												fontSize='xs'
												color='fg.muted'>
												{step.text}
											</Text>
										</Box>
									</Flex>
								))}
							</Flex>
						</Box>
						<CloseButton
							size='xs'
							aria-label='Hide this note'
							onClick={hideIntro}
						/>
					</Flex>
				)}

				{data.builtModel && (
					<Flex
						align='center'
						justify='space-between'
						gap={3}
						flexWrap='wrap'
						px={4}
						py={3}
						borderWidth='1px'
						borderColor='border'
						borderRadius='lg'
						bg='bg.panel'>
						<Flex
							align='center'
							gap={3}>
							<Flex
								align='center'
								justify='center'
								w='32px'
								h='32px'
								borderRadius='lg'
								bg='blue.subtle'
								color='blue.fg'>
								<Boxes
									size={16}
									strokeWidth={1.75}
								/>
							</Flex>
							<Text
								fontSize='sm'
								color='fg.muted'>
								The fields come from the <strong>{data.builtModel.name}</strong> model. Add, remove or change fields
								there; here you arrange how its pages look.
							</Text>
						</Flex>
						<Button
							size='xs'
							variant='outline'
							onClick={() => router.push(projectHref(`/model-builder/${data.builtModel._id}`))}>
							Edit fields in the model
						</Button>
					</Flex>
				)}

				<ConsoleTabs
					tabs={TABS.filter(t => t.value !== 'settings' || hasSettings).map(t => ({
						value: t.value,
						label: <AreaTabLabel area={t.value} label={t.label} />,
					}))}
					value={tab}
					onChange={goTo}>
					{tab === 'overview' && overview}
					{tab === 'settings' && (
					<Flex
						direction='column'
						gap={5}>
						<AreaIntro area='settings' onPreview={isGeneric ? () => openPreview('form') : undefined} />
				{data.protected && (
					<Text
						fontSize='xs'
						color='fg.muted'>
						This route controls access, so its settings stay exactly as in code. Its table, filters and
						buttons can still be configured.
					</Text>
				)}

				{hasSettings && (
					<Panel
						title={
							<ToneTitle
								icon={ListChecks}
								palette='blue'>
								Fields and their rules
							</ToneTitle>
						}
						subtitle={
							settingsReadOnly
								? 'Read only: this page controls who can sign in, so its fields and rules stay as they are.'
								: 'Every field a record has, in order, and the rules the server checks — what must be filled in, what can be changed later, what the search box finds. Takes effect once published.'
						}
						actions={
							!settingsReadOnly &&
							JSON.stringify(settingsWorking) !== JSON.stringify(codeSettingsFields) && (
								<Button
									size='xs'
									variant='outline'
									onClick={() => setSettingsWorking(codeSettingsFields)}>
									<RotateCcw size={14} />
									{IS_TENANT_PANEL ? 'Starting setup' : 'Settings file'}
								</Button>
							)
						}>
						<SettingsEditor
							fields={settingsWorking}
							model={data.model}
							codeFields={codeSettingsFields}
							modelFields={modelFields}
							readOnly={settingsReadOnly}
							onChange={setSettingsWorking}
						/>
					</Panel>
				)}

					</Flex>
					)}
					{tab === 'table' && (
					<Flex
						direction='column'
						gap={5}>
						<AreaIntro area='table' onPreview={isGeneric ? () => openPreview('table') : undefined} />
				{!isGeneric && data.kind !== 'custom' && (
					<Panel
						title='Table page'
						subtitle='This route has no table config, so the builder has nothing to lay its admin page out with.'>
						<Flex
							direction='column'
							gap={3}
							align='flex-start'>
							<Text
								fontSize='sm'
								color='fg.muted'>
								Its admin page is hand-written, or missing. Create a table config from its settings — columns,
								row menu, add and export buttons — and edit it here. Once published, the route&apos;s page is
								built from it instead.
							</Text>
							<Button
								size='sm'
								variant='outline'
								disabled={!settingsFields.length}
								onClick={createTableConfig}>
								<Sparkles size={14} />
								Create table config from settings
							</Button>
						</Flex>
					</Panel>
				)}

				{isGeneric && (
					<PageOptionsPanel
						value={pageConfig}
						onChange={next => setRest({ route: next })}
						route={route}
						code={codeConfig.route}
					/>
				)}

				{isGeneric && (
					<Panel
						title={
							<ToneTitle
								icon={Columns3}
								palette='teal'>
								Columns
							</ToneTitle>
						}
						subtitle='The columns the table shows, left to right. Drag to reorder; each person can still hide columns for themselves.'
						actions={
							!columnsAreCode && (
								<Button
									size='xs'
									variant='outline'
									onClick={() => setRest({ table: codeConfig.table || [] })}>
									<RotateCcw size={14} />
									{IS_TENANT_PANEL ? 'Starting columns' : 'Code columns'}
								</Button>
							)
						}>
						<TableColumnsEditor
							columns={working.rest.table || []}
							fields={tableFields}
							onChange={table => setRest({ table })}
						/>
					</Panel>
				)}

				{isGeneric && (
					<RowMenuPanel
						value={pageConfig}
						onChange={next => setRest({ route: next })}
						route={route}
						code={codeConfig.route}
						fields={tableFields}
					/>
				)}

				{isGeneric && (
					<BulkActionsPanel
						value={pageConfig}
						onChange={next => setRest({ route: next })}
						route={route}
						code={codeConfig.route}
						fields={tableFields}
					/>
				)}

					</Flex>
					)}
					{tab === 'filters' && (
					<Flex
						direction='column'
						gap={5}>
						<AreaIntro area='filters' onPreview={isGeneric ? () => openPreview('table') : undefined} />
				<FiltersPanel
					filters={working.filters}
					onChange={filters => setFilters(() => filters)}
					fields={modelFields}
					models={data.models || []}
					codeFilters={codeFilters}
					onImportCode={() => (working.filters.length ? setConfirm('import') : setFilters(() => fromServer(codeFilters)))}
					editingUid={editingUid}
					onEditingChange={setEditingUid}
				/>

					</Flex>
					)}
					{tab === 'form' && (
						<Flex
							direction='column'
							gap={5}>
						<AreaIntro area='form' onPreview={isGeneric ? () => openPreview('form') : undefined} />
							{formPanel}
							{rulesPanel}
						</Flex>
					)}
					{tab === 'view' && (
						<Flex
							direction='column'
							gap={5}>
							<AreaIntro
								area='view'
								onPreview={hasSettings ? () => openPreview('view') : undefined}
							/>
							{viewPanel}
						</Flex>
					)}
					{tab === 'source' && (
					<Flex
						direction='column'
						gap={5}>
						<AreaIntro area='source' />
				{/* Projects have no code files to switch to (multi-tenancy). */}
				{!IS_TENANT_PANEL && (
					<Panel
						title='Source'
						subtitle='What the API serves for this route. Switching is live immediately and changes nothing else — drafts and versions stay.'>
						<Flex
							direction='column'
							gap={4}>
							{(['settings', 'config'] as const)
								.filter(k => k === 'config' || hasSettings)
								.map(k => {
									const doc = k === 'settings' ? settingsDoc : config;
									const diff = compare?.[k]?.published;
									const global = data.global?.[k] || 'db';
									const summary = !doc?.version
										? 'No published copy — runs on the code file.'
										: diff?.identical
											? 'The published copy is identical to the code file.'
											: diff
												? k === 'settings'
													? [
															diff.added?.length && `${diff.added.length} added`,
															diff.removed?.length && `${diff.removed.length} removed`,
															diff.changed?.length &&
																`${diff.changed.length} changed (${diff.changed
																	.slice(0, 4)
																	.map((c: any) => c.key)
																	.join(', ')}${diff.changed.length > 4 ? '…' : ''})`,
															diff.reordered && 'reordered',
													  ]
															.filter(Boolean)
															.join(', ') + ' vs the settings file.'
													: `Differs from the config file in: ${[...diff.changed, ...diff.route.map((r: string) => `route.${r}`)].join(', ')}.`
												: '';
									return (
										<Flex
											key={k}
											align='center'
											justify='space-between'
											gap={4}
											flexWrap='wrap'>
											<Box minW={0}>
												<Flex
													gap={2}
													align='center'>
													<Text
														fontSize='sm'
														fontWeight='500'>
														{k === 'settings' ? 'Settings' : 'Config'}
													</Text>
													<Badge
														size='sm'
														variant='subtle'
														colorPalette={doc?.serving === 'db' ? 'green' : 'gray'}>
														{doc?.serving === 'db' ? `Serving DB v${doc.version}` : 'Serving code file'}
													</Badge>
												</Flex>
												<Text
													fontSize='xs'
													color='fg.muted'>
													{summary}
												</Text>
											</Box>
											<Flex
												gap={2}
												align='center'>
												<SegmentGroup.Root
													size='xs'
													disabled={!doc?.version || switching}
													value={doc?.source || 'inherit'}
													onValueChange={e => e.value && onSource(k, e.value as any)}>
													<SegmentGroup.Indicator />
													<SegmentGroup.Items
														items={[
															{ value: 'inherit', label: `Global (${global === 'db' ? 'DB' : 'code'})` },
															{ value: 'db', label: 'DB' },
															{ value: 'code', label: 'Code file' },
														]}
													/>
												</SegmentGroup.Root>
												{doc?.data && (
													<Button
														size='xs'
														variant='ghost'
														color='red.fg'
														disabled={busy}
														title='Delete the DB copy entirely; it is saved as a version first'
														onClick={() => setConfirm(k === 'settings' ? 'reset-settings' : 'reset-config')}>
														Delete copy
													</Button>
												)}
											</Flex>
										</Flex>
									);
								})}
						</Flex>
					</Panel>
				)}

				<Panel
					title={
						<ToneTitle
							icon={History}
							palette='cyan'>
							Published versions
						</ToneTitle>
					}
					subtitle='Every publish is kept. Loading one makes it the draft; it goes live when you publish.'
					actions={
						<>
							{hasSettings && (
								<SegmentGroup.Root
									size='xs'
									value={versionKind}
									onValueChange={e => setVersionKind((e.value as any) || 'config')}>
									<SegmentGroup.Indicator />
									<SegmentGroup.Items
										items={[
											{ value: 'config', label: 'Config' },
											{ value: 'settings', label: 'Settings' },
										]}
									/>
								</SegmentGroup.Root>
							)}
							<Button
								size='xs'
								variant='outline'
								onClick={() => setShowVersions(v => !v)}>
								<History size={14} />
								{showVersions ? 'Hide' : 'Show'} versions
							</Button>
						</>
					}>
					{!showVersions ? (
						<Text
							fontSize='xs'
							color='fg.muted'>
							{[
								config?.version ? `Config: version ${config.version}.` : 'Config: no published copy.',
								hasSettings && (settingsDoc?.version ? `Settings: version ${settingsDoc.version}.` : 'Settings: no published copy.'),
							]
								.filter(Boolean)
								.join(' ')}
						</Text>
					) : !versions?.doc?.length ? (
						<Text
							fontSize='xs'
							color='fg.muted'>
							No published versions yet.
						</Text>
					) : (
						<Flex
							direction='column'
							gap={2}>
							{versions.doc.map((v: any) => (
								<Flex
									key={v._id}
									align='center'
									justify='space-between'
									gap={3}
									py={1.5}
									borderBottomWidth='1px'
									borderColor='border.muted'>
									<Flex
										gap={3}
										align='baseline'
										minW={0}>
										<Text
											fontSize='sm'
											fontFamily='mono'
											fontWeight='600'>
											v{v.version}
										</Text>
										<Text
											fontSize='xs'
											color='fg.muted'
											truncate
											title={v.note || undefined}>
											{[when(v.createdAt), v.publishedBy?.name, v.note].filter(Boolean).join(' · ')}
										</Text>
									</Flex>
									<Button
										size='xs'
										variant='ghost'
										onClick={() => onRestore(v)}>
										Load as draft
									</Button>
								</Flex>
							))}
						</Flex>
					)}
				</Panel>
					</Flex>
					)}
				</ConsoleTabs>

				{isDirty && (
					<Flex
						position='sticky'
						bottom={4}
						zIndex={5}
						align='center'
						justify='space-between'
						gap={3}
						flexWrap='wrap'
						px={4}
						py={2.5}
						borderWidth='1px'
						borderColor='border'
						borderRadius='lg'
						bg='bg.panel'
						boxShadow='lg'>
						<Flex
							align='center'
							gap={2}>
							<Box
								w='8px'
								h='8px'
								borderRadius='full'
								bg='blue.solid'
							/>
							<Text fontSize='sm'>You have unsaved changes</Text>
						</Flex>
						<Flex
							gap={2}
							flexWrap='wrap'>
							<Button
								size='sm'
								variant='ghost'
								disabled={busy}
								onClick={undo}>
								<Undo2 size={14} />
								Undo all
							</Button>
							{isGeneric && (
								<Button
									size='sm'
									variant='ghost'
									onClick={() => openPreview(PREVIEW_FOR[tab as AreaKey] || 'table')}>
									<Eye size={14} />
									Preview
								</Button>
							)}
							<Button
								size='sm'
								variant='outline'
								disabled={busy}
								loading={saving && !publishStep}
								onClick={onSaveDraft}>
								<Save size={14} />
								Save draft
							</Button>
							<Button
								size='sm'
								disabled={busy}
								onClick={() => setConfirm('publish')}>
								<Rocket size={14} />
								Publish
							</Button>
						</Flex>
					</Flex>
				)}
			</Flex>

			<PagePreview
				isOpen={!!preview}
				onClose={() => setPreview(null)}
				tab={previewTab}
				onTabChange={setPreviewTab}
				page={pageConfig}
				columns={working.rest.table || []}
				fields={previewFields}
				filters={working.filters}
				form={formSections}
				formRules={working.rest.formRules}
				view={viewSections}
				viewTabs={viewTabs}
				records={sample?.doc || []}
				loading={sampleLoading}
			/>

			<PublishDialog
				isOpen={confirm === 'publish'}
				onClose={() => setConfirm(null)}
				onConfirm={onPublish}
				route={route}
				isDirty={isDirty}
				step={publishStep}
			/>

			<ConfirmAction
				isOpen={confirm === 'discard'}
				onClose={() => setConfirm(null)}
				onConfirm={onDiscard}
				title='Discard the draft?'
				consequence='The saved draft is deleted. What is live does not change.'
				confirmLabel='Discard'
				destructive
			/>

			<ConfirmAction
				isOpen={confirm === 'reset-config' || confirm === 'reset-settings'}
				onClose={() => setConfirm(null)}
				onConfirm={() => onReset(confirm === 'reset-settings' ? 'settings' : 'config')}
				title={`Delete the ${confirm === 'reset-settings' ? 'settings' : 'config'} copy?`}
				consequence={
					confirm === 'reset-settings'
						? `/${route} goes back to its settings file straight away — validation, editable fields and all. The published copy is saved as a version first, and the draft is dropped.`
						: `/${route} goes back to its config file and settings filters straight away. The published copy is saved as a version first, and the draft is dropped.`
				}
				confirmLabel='Delete copy'
				destructive
			/>

			<ConfirmAction
				isOpen={confirm === 'import'}
				onClose={() => setConfirm(null)}
				onConfirm={() => {
					setFilters(() => fromServer(codeFilters));
					setEditingUid(null);
					setConfirm(null);
				}}
				title='Replace with the code filters?'
				consequence={`The ${working.filters.length} filters here are replaced by the ${codeFilters.length} the settings file declares. Nothing is saved until you save or publish.`}
				confirmLabel='Replace'
				destructive
			/>
		</>
	);
};

/** The page: loads the route and hands it to the editor. */
const RouteEditor: FC<{ route: string }> = ({ route }) => {
	const { data, isLoading, isError, error, refetch } = useGetBuilderRouteQuery(route);
	if (isLoading)
		return (
			<Layout
				title='Loading…'
				path='builder'>
				<DetailSkeleton />
			</Layout>
		);
	if (isError || !data)
		return (
			<Layout
				title='Routes'
				path='builder'>
				<ErrorState
					error={error}
					onRetry={refetch}
				/>
			</Layout>
		);
	const config = data.config?.draft ?? data.config?.data ?? data.code?.config;
	return (
		<Layout
			title={config?.route?.title || route}
			path='builder'>
			<RouteEditorView
				route={route}
				data={data}
			/>
		</Layout>
	);
};

export default RouteEditor;
