'use client';

import { Rows3 } from 'lucide-react';
import { ToneTitle } from './areas';
import { FC, ReactNode } from 'react';
import { Badge, Box, Button, Flex, IconButton, Input, Switch, Text } from '@chakra-ui/react';
import { ArrowDown, ArrowUp, LayoutGrid, Link2, Plus, Table2, Trash2, X } from 'lucide-react';
import {
	radius,
	useGetBuilderBacklinksQuery,
	useGetBuilderModelFieldsQuery,
	useLazyGetBuilderBacklinksQuery,
	useLazyGetBuilderModelFieldsQuery,
} from '@/components/library';
import { Dropdown, Panel } from '@/components/library/cl';
import { defaultAddLabel } from '@/components/library/components/view/view-page/addLabel';
import { ModelField } from './filterTypes';
import { DocLink } from './ui';
import ConditionsEditor, { Match, TabCondition, conditionText, missingValue } from './ConditionsEditor';

/**
 * The detail page's tabs — the config's `viewTabs`. The page opens on
 * Overview (the view sections); each tab after it lists records of any other
 * route linked to this one, either way round:
 *
 * - their field points at this record (Blog.author → an author's blogs), or
 * - this record's field holds them (Author.books → the books it lists).
 *
 * - or through a route in between (`via`): a client's documents, through its
 *   projects (Document.project → Project.client → this client). The link
 *   fields then join the tab's records to that route, and the add button is
 *   muted — a new document would need a project picked, not this client.
 *
 * Each tab has a name, a description, the columns to show, table or card
 * display, and a page size. The page adds search and paging.
 */

export type ViewTab = {
	related: string;
	foreignField?: string;
	localField?: string;
	title?: string;
	description?: string;
	display?: 'table' | 'cards';
	columns: string[];
	pageSize?: number;
	/** The tab's add button — on unless false. Only tabs whose records point here have one. */
	allowAdd?: boolean;
	addLabel?: string;
	/** The route in between, and how it links to this record (its field, or this record's). */
	via?: { route: string; foreignField?: string; localField?: string };
	/** Conditions every listed record must meet — a "Due bills" tab beside "All bills". */
	where?: TabCondition[];
	/** How `where` combines: all (default) or any. */
	match?: Match;
};

type Backlink = { route: string; model: string; fields: string[] };

type RouteOption = { route: string; model: string | null; title?: string | null };

type Props = {
	tabs: ViewTab[];
	onChange: (tabs: ViewTab[]) => void;
	/** This route's model name, and its fields — the two ends a link can start from. */
	model: string;
	modelFields: ModelField[];
	routes: RouteOption[];
};

/** One way to reach a tab's records through a route in between. */
type NestedLink = { value: string; label: string; chain: string };

const ICON = { size: 14, strokeWidth: 1.75 };
const IMAGE_NAME = /(^|[._-])(image|img|photo|avatar|logo|thumbnail|thumb|picture|banner|cover|icon)s?$/i;
const PREFERRED = ['code', 'name', 'title', 'status', 'price', 'total', 'createdAt'];
const usable = (f: ModelField) => !['_id', '__v'].includes(f.key) && !f.key.includes('.');

/** A new tab's columns: an image if there is one, then the usual naming/summary fields. */
const defaultColumns = (fields: ModelField[], skip?: string) => {
	const keys = fields.filter(usable).map(f => f.key).filter(k => k !== skip);
	const image = keys.find(k => IMAGE_NAME.test(k));
	const picked = PREFERRED.filter(k => keys.includes(k)).slice(0, 4);
	const cols = picked.length ? picked : keys.filter(k => k !== image).slice(0, 3);
	return image ? [image, ...cols] : cols;
};

/** The ways two routes can be linked: their fields referencing this model, this model's referencing theirs. */
const linksBetween = (model: string, modelFields: ModelField[], relatedModel: string | undefined, relatedFields: ModelField[]) => ({
	theirs: relatedFields.filter(f => f.ref === model).map(f => f.key),
	ours: relatedModel ? modelFields.filter(f => f.ref === relatedModel).map(f => f.key) : [],
});

/** `f:<field>` / `l:<field>` — which side of a link holds the field. */
const side = (l?: { foreignField?: string; localField?: string }) =>
	l?.foreignField ? `f:${l.foreignField}` : l?.localField ? `l:${l.localField}` : '';
const fromSide = (v: string) =>
	v.startsWith('f:') ? { foreignField: v.slice(2) } : v.startsWith('l:') ? { localField: v.slice(2) } : {};

/** Direct links read `f:…` / `l:…`; links through a route `v:<route>|<its link here>|<the tab's link to it>`. */
const linkValue = (t: ViewTab) => (t.via?.route ? `v:${t.via.route}|${side(t.via)}|${side(t)}` : side(t));
const withLink = (t: ViewTab, v: string): ViewTab => {
	const { foreignField: _f, localField: _l, via: _v, ...rest } = t;
	if (v.startsWith('v:')) {
		const [route, hop1, hop2] = v.slice(2).split('|');
		return { ...rest, ...fromSide(hop2), via: { route, ...fromSide(hop1) } };
	}
	return { ...rest, ...fromSide(v) };
};

/**
 * The links through a route in between: a route linked to this record (it
 * points here, or this record lists it), whose records the tab's records are
 * linked to (they point at it, or it lists them). Client → Projects →
 * Documents: "Documents of this record's Projects".
 */
const nestedLinks = ({
	model,
	modelFields,
	routes,
	here,
	related,
	relatedModel,
	relatedFields,
	there,
	name,
	titleOf,
}: {
	model: string;
	modelFields: ModelField[];
	routes: RouteOption[];
	/** Routes whose fields point at this model. */
	here: Backlink[];
	related: string;
	relatedModel?: string;
	relatedFields: ModelField[];
	/** Routes whose fields point at the tab's model. */
	there: Backlink[];
	name: string;
	titleOf: (route: string) => string;
}): NestedLink[] => {
	if (!relatedModel) return [];
	const mids: { route: string; model: string; hop: string; how: string }[] = [
		...here.flatMap(l => l.fields.map(f => ({ route: l.route, model: l.model, hop: `f:${f}`, how: `by their ${f}` }))),
		...modelFields
			.filter(f => f.ref)
			.flatMap(f =>
				routes
					.filter(r => r.model === f.ref)
					.map(r => ({ route: r.route, model: r.model as string, hop: `l:${f.key}`, how: `in this record’s ${f.key}` }))
			),
	].filter(m => m.route !== related && m.model !== model && m.model !== relatedModel);

	return mids.flatMap(m => {
		const mid = titleOf(m.route);
		const theirs = relatedFields.filter(f => f.ref === m.model).map(f => ({ hop: `f:${f.key}`, how: `by their ${f.key}` }));
		const held = there
			.filter(l => l.route === m.route)
			.flatMap(l => l.fields.map(f => ({ hop: `l:${f}`, how: `in each one’s ${f}` })));
		// "This record → Projects (by their client) → Documents (by their project)"
		return [...theirs, ...held].map(h => ({
			value: `v:${m.route}|${m.hop}|${h.hop}`,
			label: `${name} of this record’s ${mid} (${h.hop.slice(2)} · ${m.hop.slice(2)})`,
			chain: `This record → ${mid} (${m.how}) → ${name} (${h.how})`,
		}));
	});
};

export const tabProblems = (tabs: ViewTab[] = []) => {
	const out: string[] = [];
	tabs.forEach((t, i) => {
		const where = t.title || `tab ${i + 2}`;
		if (!t.related) out.push(`${where}: pick the records to show`);
		else if (!t.foreignField && !t.localField) out.push(`${where}: pick how ${t.related} links to this record`);
		if (t.related && !t.columns?.length) out.push(`${where}: pick at least one column`);
		(t.where || []).forEach(c => {
			if (!c.field) out.push(`${where}: pick a field for each condition`);
			else if (missingValue(c))
				out.push(`${where}: give “${conditionText(c)}” a value`);
		});
	});
	return out;
};

const Row: FC<{ label: string; children: ReactNode }> = ({ label, children }) => (
	<Flex
		align='center'
		gap={2}
		flexWrap='wrap'>
		<Text
			fontSize='xs'
			color='fg.muted'
			w='92px'
			flexShrink={0}>
			{label}
		</Text>
		{children}
	</Flex>
);

const TabCard: FC<{
	tab: ViewTab;
	index: number;
	count: number;
	model: string;
	modelFields: ModelField[];
	routes: RouteOption[];
	titleOf: (route: string) => string;
	/** Routes pointing at this model — the first step of a link through another route. */
	backlinks: Backlink[];
	onChange: (t: ViewTab) => void;
	onPickRoute: (route: string) => void;
	onMove: (to: number) => void;
	onRemove: () => void;
}> = ({ tab, index, count, model, modelFields, routes, titleOf, backlinks, onChange, onPickRoute, onMove, onRemove }) => {
	const relatedModel = routes.find(r => r.route === tab.related)?.model || undefined;
	const { data } = useGetBuilderModelFieldsQuery(relatedModel as string, { skip: !relatedModel });
	const { data: there } = useGetBuilderBacklinksQuery(relatedModel as string, { skip: !relatedModel });
	const relatedFields: ModelField[] = (data?.fields || []).filter(usable);
	const { theirs, ours } = linksBetween(model, modelFields, relatedModel, relatedFields);
	// (A tab through another route keeps its link column: it says which project.)
	const columnChoices = relatedFields.filter(f => tab.via || f.key !== tab.foreignField);
	const problems = tabProblems([tab]).map(p => p.replace(/^[^:]*: /, ''));
	const display = tab.display || 'table';
	const name = tab.related ? titleOf(tab.related) : 'records';
	const nested = nestedLinks({
		model,
		modelFields,
		routes,
		here: backlinks,
		related: tab.related,
		relatedModel,
		relatedFields,
		there: there?.doc || [],
		name,
		titleOf,
	});
	const picked = nested.find(n => n.value === linkValue(tab));

	return (
		<Box
			borderWidth='1px'
			borderColor={problems.length ? 'red.muted' : 'border'}
			borderRadius='md'
			p={3}>
			<Flex
				direction='column'
				gap={2.5}>
				<Flex
					align='center'
					gap={2}>
					<Badge
						variant='outline'
						fontSize='10px'>
						Tab {index + 2}
					</Badge>
					<Input
						size='xs'
						flex='1'
						maxW='260px'
						placeholder={tab.related ? titleOf(tab.related) : 'Tab name'}
						value={tab.title || ''}
						onChange={e => onChange({ ...tab, title: e.target.value || undefined })}
					/>
					<Flex
						ml='auto'
						gap={1}>
						<IconButton
							size='2xs'
							variant='ghost'
							aria-label='Move earlier'
							title='Earlier'
							disabled={index === 0}
							onClick={() => onMove(index - 1)}>
							<ArrowUp {...ICON} />
						</IconButton>
						<IconButton
							size='2xs'
							variant='ghost'
							aria-label='Move later'
							title='Later'
							disabled={index === count - 1}
							onClick={() => onMove(index + 1)}>
							<ArrowDown {...ICON} />
						</IconButton>
						<IconButton
							size='2xs'
							variant='ghost'
							color='red.fg'
							aria-label='Remove tab'
							title='Remove'
							onClick={onRemove}>
							<Trash2 {...ICON} />
						</IconButton>
					</Flex>
				</Flex>

				<Row label='Description'>
					<Input
						size='xs'
						flex='1'
						placeholder='Shown under the tab’s heading (optional)'
						value={tab.description || ''}
						maxLength={300}
						onChange={e => onChange({ ...tab, description: e.target.value || undefined })}
					/>
				</Row>

				<Row label='Records from'>
					<Dropdown
						size='xs'
						w='220px'
						value={tab.related}
						placeholder='Pick a route'
						onChange={(v: string) => onPickRoute(v)}>
						{routes.map(r => (
							<option
								key={r.route}
								value={r.route}>
								{`${r.title || r.route} (${r.route})`}
							</option>
						))}
					</Dropdown>
				</Row>

				{tab.related && (
					<Row label='Linked by'>
						{theirs.length || ours.length || nested.length ? (
							<Flex
								direction='column'
								gap={1}
								flex='1'
								minW={0}>
								<Dropdown
									size='xs'
									w='full'
									maxW='440px'
									value={linkValue(tab)}
									placeholder='Pick the link'
									onChange={(v: string) => onChange(withLink(tab, v))}>
									{theirs.length > 0 && (
										<optgroup label={`${name} pointing at this record`}>
											{theirs.map(k => (
												<option
													key={`f:${k}`}
													value={`f:${k}`}>
													{`${name} whose ${k} is this record`}
												</option>
											))}
										</optgroup>
									)}
									{ours.length > 0 && (
										<optgroup label={`This record's fields`}>
											{ours.map(k => (
												<option
													key={`l:${k}`}
													value={`l:${k}`}>
													{`${name} listed in this record’s ${k}`}
												</option>
											))}
										</optgroup>
									)}
									{nested.length > 0 && (
										<optgroup label='Through another route'>
											{nested.map(n => (
												<option
													key={n.value}
													value={n.value}>
													{n.label}
												</option>
											))}
										</optgroup>
									)}
								</Dropdown>
								{picked && (
									<Text
										fontSize='11px'
										color='fg.muted'>
										{picked.chain}
									</Text>
								)}
							</Flex>
						) : (
							<Text
								fontSize='xs'
								color='red.fg'>
								{relatedModel
									? `No field links ${name} and ${model}, directly or through another route. Add a reference field between them first.`
									: 'Loading…'}
							</Text>
						)}
					</Row>
				)}

				{tab.related && (
					<>
						<Row label='Show only'>
							<ConditionsEditor
								fields={relatedFields}
								where={tab.where || []}
								onChange={w => onChange({ ...tab, where: w.length ? w : undefined, ...(w.length < 2 && { match: undefined }) })}
								match={tab.match}
								onMatch={m => onChange({ ...tab, match: m === 'any' ? 'any' : undefined })}
								hint='Only records meeting every condition are listed. “is” conditions are also filled in when adding from this tab.'
								emptyHint='Every linked record is listed. Add a condition for a tab like “Due bills” (status is due).'
							/>
						</Row>

						<Row label='Show as'>
							<Flex gap={1}>
								<Button
									size='2xs'
									variant={display === 'table' ? 'solid' : 'outline'}
									onClick={() => onChange({ ...tab, display: 'table' })}>
									<Table2 {...ICON} />
									Table
								</Button>
								<Button
									size='2xs'
									variant={display === 'cards' ? 'solid' : 'outline'}
									onClick={() => onChange({ ...tab, display: 'cards' })}>
									<LayoutGrid {...ICON} />
									Cards
								</Button>
							</Flex>
							<Text
								fontSize='11px'
								color='fg.muted'>
								{display === 'cards'
									? 'The first image column is the picture, the next column the heading, the rest details.'
									: 'Image columns show the image.'}
							</Text>
						</Row>

						<Row label={display === 'cards' ? 'Card fields' : 'Columns'}>
							<Flex
								gap={1}
								flexWrap='wrap'
								flex='1'>
								{columnChoices.map(f => {
									const at = tab.columns.indexOf(f.key);
									return (
										<Button
											key={f.key}
											size='2xs'
											variant={at >= 0 ? 'solid' : 'outline'}
											title={at >= 0 ? 'Click to remove' : 'Click to add at the end'}
											onClick={() =>
												onChange({
													...tab,
													columns: at >= 0 ? tab.columns.filter(k => k !== f.key) : [...tab.columns, f.key],
												})
											}>
											{at >= 0 && <Text as='span' opacity={0.7}>{at + 1}</Text>}
											{f.key}
										</Button>
									);
								})}
							</Flex>
						</Row>

						<Row label='Per page'>
							<Input
								size='xs'
								w='64px'
								type='number'
								min={5}
								max={100}
								value={tab.pageSize ?? 20}
								onChange={e => onChange({ ...tab, pageSize: Math.min(100, Math.max(5, Number(e.target.value) || 20)) })}
							/>
							<Text
								fontSize='11px'
								color='fg.muted'>
								The tab has a search box and pages through the rest.
							</Text>
						</Row>

						<Row label='Add button'>
							{tab.via ? (
								<Text
									fontSize='11px'
									color='fg.muted'>
									Shown muted: these {name.toLowerCase()} belong to this record’s {titleOf(tab.via.route).toLowerCase()}, so a
									new one needs one of those picked. Add them from a {titleOf(tab.via.route).toLowerCase()} page instead.
								</Text>
							) : tab.localField ? (
								<Text
									fontSize='11px'
									color='fg.muted'>
									Not available here: these records are listed in this record’s {tab.localField}, so adding one
									would also have to edit this record.
								</Text>
							) : (
								<>
									<Switch.Root
										size='sm'
										checked={tab.allowAdd !== false}
										onCheckedChange={d => onChange({ ...tab, allowAdd: d.checked ? undefined : false })}>
										<Switch.HiddenInput />
										<Switch.Control />
									</Switch.Root>
									{tab.allowAdd !== false && (
										<Input
											size='xs'
											w='180px'
											maxLength={60}
											placeholder={defaultAddLabel(tab.title || name)}
											value={tab.addLabel || ''}
											onChange={e => onChange({ ...tab, addLabel: e.target.value || undefined })}
										/>
									)}
									<Text
										fontSize='11px'
										color='fg.muted'>
										{tab.allowAdd !== false
											? `Creates ${name.toLowerCase()} already linked to this record. Disabled for anyone without create permission on ${name.toLowerCase()}.`
											: 'No add button on this tab.'}
									</Text>
								</>
							)}
						</Row>
					</>
				)}

				{problems.length > 0 && (
					<Text
						fontSize='11px'
						color='red.fg'>
						{problems.join(' · ')}
					</Text>
				)}
			</Flex>
		</Box>
	);
};

const ViewTabsEditor: FC<Props> = ({ tabs, onChange, model, modelFields, routes }) => {
	const { data: backlinks } = useGetBuilderBacklinksQuery(model, { skip: !model });
	const [loadFields] = useLazyGetBuilderModelFieldsQuery();
	const [loadBacklinks] = useLazyGetBuilderBacklinksQuery();

	const titleOf = (route: string) => routes.find(r => r.route === route)?.title || route;
	const modelOf = (route: string) => routes.find(r => r.route === route)?.model || backlinks?.doc.find(l => l.route === route)?.model;
	const has = (route: string, field: string) => tabs.some(t => !t.via && t.related === route && t.foreignField === field);
	// Quick picks: routes that already point at this model.
	const suggestions = (backlinks?.doc || [])
		.flatMap(l => l.fields.map(f => ({ route: l.route, field: f, many: l.fields.length > 1 })))
		.filter(s => !has(s.route, s.field));

	const setTab = (i: number, t: ViewTab) => onChange(tabs.map((x, j) => (j === i ? t : x)));

	/** A tab for `route`: the link filled in when there's only one way, and default columns. */
	const build = async (route: string, base: Partial<ViewTab> = {}): Promise<ViewTab> => {
		const relatedModel = modelOf(route);
		const res: any = relatedModel ? await loadFields(relatedModel, true).unwrap().catch(() => null) : null;
		const fields: ModelField[] = res?.fields || [];
		const { theirs, ours } = linksBetween(model, modelFields, relatedModel, fields);
		let link: Partial<ViewTab> =
			base.foreignField || base.localField
				? {}
				: theirs.length + ours.length === 1
				? theirs.length
					? { foreignField: theirs[0] }
					: { localField: ours[0] }
				: {};
		// No direct link: the one way through another route, when there's just one.
		if (!base.foreignField && !base.localField && !theirs.length && !ours.length && relatedModel) {
			const there: any = await loadBacklinks(relatedModel, true).unwrap().catch(() => null);
			const nested = nestedLinks({
				model,
				modelFields,
				routes,
				here: backlinks?.doc || [],
				related: route,
				relatedModel,
				relatedFields: fields.filter(usable),
				there: there?.doc || [],
				name: titleOf(route),
				titleOf,
			});
			if (nested.length === 1) link = withLink({ related: route, columns: [] }, nested[0].value);
		}
		const t: ViewTab = { related: route, display: 'table', pageSize: 20, ...base, ...link, columns: [] };
		t.columns = defaultColumns(fields, t.via ? undefined : t.foreignField);
		return t;
	};

	const pickRoute = async (i: number, route: string) => {
		const { title, description, display, pageSize } = tabs[i];
		setTab(i, await build(route, { title, description, display, pageSize }));
	};

	const move = (from: number, to: number) => {
		const next = [...tabs];
		const [t] = next.splice(from, 1);
		next.splice(to, 0, t);
		onChange(next);
	};

	return (
		<Panel
			title={
				<ToneTitle
					icon={Rows3}
					palette='pink'>
					Tabs on the record page
				</ToneTitle>
			}
			subtitle='The detail page opens on Overview — the sections above. Each tab after it lists records of another route linked to this one, as a searchable table or cards.'
			actions={<DocLink section='view' />}>
			<Flex
				direction='column'
				gap={3}>
				{/* The order the page shows them in. */}
				<Flex
					gap={1}
					flexWrap='wrap'>
					{['Overview', ...tabs.map(t => t.title || (t.related ? titleOf(t.related) : 'New tab'))].map((label, i) => (
						<Box
							key={i}
							px={3}
							py={1}
							fontSize='12px'
							borderRadius={radius.PILL}
							bg={i === 0 ? 'bg.inverted' : 'bg.muted'}
							color={i === 0 ? 'fg.inverted' : 'fg'}>
							{label}
						</Box>
					))}
				</Flex>

				{tabs.map((tab, i) => (
					<TabCard
						key={i}
						tab={tab}
						index={i}
						count={tabs.length}
						model={model}
						modelFields={modelFields}
						routes={routes}
						titleOf={titleOf}
						backlinks={backlinks?.doc || []}
						onChange={t => setTab(i, t)}
						onPickRoute={route => pickRoute(i, route)}
						onMove={to => move(i, to)}
						onRemove={() => onChange(tabs.filter((_, j) => j !== i))}
					/>
				))}

				<Flex
					align='center'
					gap={1.5}
					flexWrap='wrap'>
					<Button
						size='xs'
						variant='outline'
						onClick={() => onChange([...tabs, { related: '', display: 'table', pageSize: 20, columns: [] }])}>
						<Plus {...ICON} />
						Add a tab
					</Button>
					{suggestions.length > 0 && (
						<>
							<Flex
								align='center'
								gap={1}
								ml={2}
								color='fg.muted'>
								<Link2 size={12} />
								<Text fontSize='xs'>Linking here:</Text>
							</Flex>
							{suggestions.map(s => (
								<Button
									key={`${s.route}-${s.field}`}
									size='xs'
									variant='ghost'
									onClick={async () =>
										onChange([
											...tabs,
											await build(s.route, {
												foreignField: s.field,
												...(s.many && { title: `${titleOf(s.route)} (${s.field})` }),
											}),
										])
									}>
									<Plus {...ICON} />
									{titleOf(s.route)}
									<Text
										as='span'
										color='fg.muted'>
										via {s.field}
									</Text>
								</Button>
							))}
						</>
					)}
				</Flex>
			</Flex>
		</Panel>
	);
};

export default ViewTabsEditor;
