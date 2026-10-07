'use client';

import { FC, ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Box, Button, Checkbox, CloseButton, Flex, Grid, Tabs, Text } from '@chakra-ui/react';
import { ArrowRight, ExternalLink, Info, LayoutTemplate, Link2, Save, Undo2 } from 'lucide-react';
import {
	Layout,
	useDeleteBuiltModelMutation,
	useGetBuiltModelQuery,
	useGetModelBuilderOptionsQuery,
	useUpdateBuiltModelMutation,
} from '@/components/library';
import {
	ConfirmAction,
	ConsoleTabs,
	DetailRow,
	DetailSkeleton,
	ErrorState,
	PageHeader,
	Panel,
	StatusDot,
	when,
} from '@/components/library/cl';
import { toaster } from '@/components/ui/toaster';
import ModelPanels, { ModelWorking, codePreview, modelBody, modelFromDoc, useFieldErrors } from './ModelPanels';
import FormPreview from './FormPreview';
import KindIcon from './KindIcon';
import { LinkTarget } from './FieldsEditor';
import { REFERENCE_KINDS, SELF, singular } from './modelKinds';
import { HOME, IS_TENANT_PANEL, projectHref } from '@/components/library/config/lib/constants/panel';

/**
 * Edit a model built in the model builder. Laid out for people who aren't
 * developers: what they change most — the fields — is the first tab, with a
 * live picture of the form beside it; naming, numbering and privacy are under
 * Settings; links to other models under Connections; the fixed technical names
 * and turning off / deleting under Advanced. Saving recompiles the model and
 * its route at once; a bar at the bottom offers Save whenever something
 * changed. New models are made in the wizard (/model-builder/new).
 *
 * The name, route and collection are fixed once created (other models link
 * to it by name, and the collection holds its records); the title isn't.
 */

const signature = (w: ModelWorking | null) => (w ? JSON.stringify(modelBody(w)) : '');

const TABS = ['fields', 'settings', 'connections', 'advanced'] as const;
type Tab = (typeof TABS)[number];

/** The page's one-time explanation, hidden for good once closed (this browser only). */
const INTRO_KEY = 'model-editor-intro-hidden';

const TabLabel: FC<{ children: ReactNode; count?: number; alert?: number }> = ({ children, count, alert }) => (
	<Flex
		align='center'
		gap={1.5}>
		{children}
		{alert ? (
			<Badge
				size='xs'
				colorPalette='red'
				variant='solid'
				borderRadius='full'
				title={`${alert} need${alert === 1 ? 's' : ''} attention`}>
				{alert}
			</Badge>
		) : count !== undefined ? (
			<Text
				as='span'
				fontSize='11px'
				color='inherit'
				opacity={0.6}>
				{count}
			</Text>
		) : null}
	</Flex>
);

export type ModelEditorViewProps = {
	id: string;
	doc: any;
	targets: LinkTarget[];
	categories: { _id: string; name: string }[];
	updating?: boolean;
	removing?: boolean;
	/** Saves the body; resolves with the server's answer, rejects with `{ data: { message, problems } }`. */
	onUpdate: (body: any) => Promise<any>;
	onRemove: (dropData: boolean) => Promise<any>;
};

export const ModelEditorView: FC<ModelEditorViewProps> = ({
	id,
	doc,
	targets,
	categories,
	updating,
	removing,
	onUpdate,
	onRemove,
}) => {
	const router = useRouter();
	const [working, setWorking] = useState<ModelWorking | null>(null);
	const [base, setBase] = useState<ModelWorking | null>(null);
	const [confirm, setConfirm] = useState<null | 'delete' | 'disable'>(null);
	const [dropData, setDropData] = useState(false);
	const [problems, setProblems] = useState<string[]>([]);
	const [intro, setIntro] = useState(false);

	// The open tab lives in `?tab=`, so a reload or a shared link lands on it. Switching keeps unsaved edits.
	const [tab, setTab] = useState<Tab>('fields');
	useEffect(() => {
		const t = new URLSearchParams(window.location.search).get('tab') as Tab | null;
		if (t && TABS.includes(t)) setTab(t);
		try {
			setIntro(localStorage.getItem(INTRO_KEY) !== '1');
		} catch {
			setIntro(true);
		}
	}, []);
	const goTo = (t: string) => {
		setTab(t as Tab);
		const url = new URL(window.location.href);
		url.searchParams.set('tab', t);
		window.history.replaceState(null, '', url.toString());
	};
	const hideIntro = () => {
		setIntro(false);
		try {
			localStorage.setItem(INTRO_KEY, '1');
		} catch {}
	};

	useEffect(() => {
		if (!doc) return;
		const w = modelFromDoc(doc);
		setWorking(w);
		setBase(w);
	}, [doc]);

	const errors = useFieldErrors(working?.fields || [], !!working?.access?.enabled);
	const errorCount = Object.keys(errors).length;
	const isDirty = signature(working) !== signature(base);
	const busy = !!updating || !!removing;

	// Leaving with unsaved changes asks first.
	useEffect(() => {
		if (!isDirty) return;
		const warn = (e: BeforeUnloadEvent) => e.preventDefault();
		window.addEventListener('beforeunload', warn);
		return () => window.removeEventListener('beforeunload', warn);
	}, [isDirty]);

	const apply = (res: any) => {
		const w = modelFromDoc({ ...res.doc, sidebarCategory: working?.sidebarCategory });
		setWorking(w);
		setBase(w);
	};

	const save = async () => {
		if (!working || !isDirty || busy) return;
		setProblems([]);
		if (!working.title.trim()) {
			goTo('settings');
			return toaster.create({ title: 'Give the model a title', description: 'It’s under Settings → Basics.', type: 'error' });
		}
		if (errorCount) {
			goTo('fields');
			return toaster.create({
				title: `${errorCount} field${errorCount === 1 ? ' needs' : 's need'} attention`,
				description: 'They’re marked in red on the Fields tab.',
				type: 'error',
			});
		}
		try {
			const res = await onUpdate(modelBody(working));
			apply(res);
			toaster.create({
				title: 'Changes saved',
				description: [
					'The page, its form and table follow at once.',
					res.codesAssigned ? `${res.codesAssigned} existing records got a number.` : '',
					...(res.warnings || []),
				]
					.filter(Boolean)
					.join(' '),
				type: res.warnings?.length ? 'warning' : 'success',
			});
		} catch (e: any) {
			setProblems(e?.data?.problems || []);
			toaster.create({ title: e?.data?.message || 'Could not save the model', type: 'error' });
		}
	};

	// ⌘S / Ctrl+S saves.
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
				e.preventDefault();
				save();
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	if (!working) return null;

	const remove = async () => {
		try {
			const res = await onRemove(dropData);
			toaster.create({ title: res.message, type: 'success' });
			router.replace(projectHref('/model-builder'));
		} catch (e: any) {
			setProblems(e?.data?.problems || []);
			toaster.create({ title: e?.data?.message || 'Could not delete the model', type: 'error' });
		}
		setConfirm(null);
	};

	const live = doc.active && !doc.error;
	const records: number | null = doc.records ?? null;
	const recordWord = singular(doc.title || doc.name || 'record').toLowerCase();
	// The records' table: /<project>/<route> in the tenant panel.
	const recordsHref = IS_TENANT_PANEL ? projectHref(`/t/${doc.route}`) : `/${doc.route}`;
	const layoutHref = projectHref(`/builder/${doc.route}`);
	const linksOut = working.fields.filter(f => REFERENCE_KINDS.includes(f.kind) && f.ref);
	const linksIn: any[] = doc.referencedBy || [];
	const isSelf = (ref?: string) => !ref || ref === SELF || ref === doc.name;
	const targetTitle = (ref?: string) => (isSelf(ref) ? doc.title : targets.find(t => t.name === ref)?.title || ref || '');

	return (
		<Flex
			direction='column'
			gap={5}
			pb={isDirty ? 4 : 10}>
			<PageHeader
				breadcrumbs={[
					{ href: HOME, title: 'Home' },
					{ href: projectHref('/model-builder'), title: 'Models' },
					{ href: projectHref(`/model-builder/${id}`), title: doc.title },
				]}
				title={doc.title}
				badge={
					<Flex
						gap={3}
						align='center'>
						{doc.error ? (
							<StatusDot
								tone='failed'
								label='Has a problem'
							/>
						) : doc.active ? (
							<StatusDot
								tone='running'
								label='Live'
								title='Its page, form and API are working'
							/>
						) : (
							<StatusDot
								tone='idle'
								label='Turned off'
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
					records === null ? '' : `${records} ${records === 1 ? 'record' : 'records'}`,
					`${working.fields.length} ${working.fields.length === 1 ? 'field' : 'fields'}`,
					`last saved ${when(doc.updatedAt)}`,
				]
					.filter(Boolean)
					.join(' · ')}
				actions={
					<>
						{live && (
							<Button
								size='sm'
								variant='outline'
								asChild>
								<a
									href={recordsHref}
									target='_blank'
									rel='noopener noreferrer'>
									<ExternalLink size={14} />
									View records
								</a>
							</Button>
						)}
						<Button
							size='sm'
							loading={updating}
							disabled={busy || !isDirty}
							title={isDirty ? 'Save (⌘S)' : 'Nothing to save yet'}
							onClick={save}>
							<Save size={14} />
							Save changes
						</Button>
					</>
				}
			/>

			{intro && (
				<Flex
					gap={3}
					align='flex-start'
					p={4}
					borderWidth='1px'
					borderColor='border'
					bg='bg.subtle'
					borderRadius='lg'>
					<Box
						color='blue.fg'
						pt={0.5}>
						<Info size={16} />
					</Box>
					<Box
						flex='1'
						fontSize='sm'>
						<Text
							fontSize='sm'
							fontWeight='600'
							mb={1}>
							This is the blueprint for your {doc.title.toLowerCase()}.
						</Text>
						<Text
							fontSize='sm'
							color='fg.muted'>
							<b>Fields</b> are what every {recordWord} holds — each one becomes an input on the form and a column in
							the table. <b>Settings</b> name and number the records and decide who sees them. Nothing changes until
							you click <b>Save changes</b>.
						</Text>
					</Box>
					<CloseButton
						size='xs'
						aria-label='Hide this note'
						onClick={hideIntro}
					/>
				</Flex>
			)}

			{doc.error && (
				<Panel title='This model isn’t working'>
					<Text
						fontSize='sm'
						color='red.fg'>
						{doc.error}
					</Text>
				</Panel>
			)}

			{problems.length > 0 && (
				<Panel title='The server refused the changes'>
					<Box
						as='ul'
						pl={5}
						fontSize='sm'
						listStyleType='disc'>
						{problems.map(p => (
							<li key={p}>{p}</li>
						))}
					</Box>
				</Panel>
			)}

			<ConsoleTabs
				value={tab}
				onChange={goTo}
				tabs={[
					{
						value: 'fields',
						label: (
							<TabLabel
								count={working.fields.length}
								alert={errorCount}>
								Fields
							</TabLabel>
						),
					},
					{ value: 'settings', label: <TabLabel alert={working.title.trim() ? 0 : 1}>Settings</TabLabel> },
					{ value: 'connections', label: <TabLabel count={linksOut.length + linksIn.length}>Connections</TabLabel> },
					{ value: 'advanced', label: 'Advanced' },
				]}>
				<Tabs.Content
					value='fields'
					p={0}>
					<Grid
						templateColumns={{ base: 'minmax(0, 1fr)', xl: 'minmax(0, 1fr) 320px' }}
						gap={5}
						alignItems='start'>
						<ModelPanels
							only={['fields']}
							working={working}
							onChange={setWorking}
							mode='edit'
							doc={doc}
							base={base}
							targets={targets}
						/>
						<Flex
							direction='column'
							gap={4}
							position={{ xl: 'sticky' }}
							top={{ xl: 4 }}>
							<Box>
								<Flex
									align='baseline'
									justify='space-between'
									mb={2}>
									<Text
										fontSize='sm'
										fontWeight='600'>
										Form preview
									</Text>
									<Text
										fontSize='xs'
										color='fg.muted'>
										Updates as you edit
									</Text>
								</Flex>
								<FormPreview
									fields={working.fields}
									recordName={singular(working.title || doc.title)}
									code={{ enabled: working.code.enabled, preview: codePreview(working.code) }}
									access={working.access.enabled}
									targets={targets}
								/>
							</Box>
							{live && (
								<Panel
									title='Page layout'
									subtitle='Arrange the table’s columns, the form’s sections and the record page.'>
									<Button
										size='xs'
										variant='outline'
										onClick={() => router.push(layoutHref)}>
										<LayoutTemplate size={13} />
										Customize table, form & record page
									</Button>
								</Panel>
							)}
						</Flex>
					</Grid>
				</Tabs.Content>

				<Tabs.Content
					value='settings'
					p={0}>
					<Flex
						direction='column'
						gap={5}>
						<ModelPanels
							only={['basics', 'numbers', 'privacy']}
							hideIdentity
							working={working}
							onChange={setWorking}
							mode='edit'
							doc={doc}
							base={base}
							targets={targets}
							categories={categories}
							showSidebar
						/>
					</Flex>
				</Tabs.Content>

				<Tabs.Content
					value='connections'
					p={0}>
					<Flex
						direction='column'
						gap={5}>
						<Panel
							title={`What ${doc.title.toLowerCase()} link to`}
							subtitle={`Fields of the type “Link to a record”: each ${recordWord} points at a record of another model.`}>
							{linksOut.length ? (
								<Flex
									direction='column'
									gap={2}>
									{linksOut.map(f => (
										<Flex
											key={f.uid}
											align='center'
											gap={3}
											fontSize='sm'>
											<KindIcon
												kind={f.kind}
												size={24}
											/>
											<Text
												fontSize='sm'
												fontWeight='600'>
												{f.label || f.key}
											</Text>
											<ArrowRight
												size={14}
												strokeWidth={1.75}
											/>
											<Text fontSize='sm'>
												{f.kind === 'references'
													? `several ${targetTitle(f.ref).toLowerCase()}`
													: `one ${singular(targetTitle(f.ref)).toLowerCase()}`}
												{isSelf(f.ref) && ' (another of these)'}
											</Text>
										</Flex>
									))}
								</Flex>
							) : (
								<EmptyLine>
									None yet. To link, add a field of the type <b>Link to a record</b> on the{' '}
									<LinkButton onClick={() => goTo('fields')}>Fields tab</LinkButton>.
								</EmptyLine>
							)}
						</Panel>

						<Panel
							title={`What links to ${doc.title.toLowerCase()}`}
							subtitle='Other models with a field pointing here. While they do, this model can’t be deleted.'>
							{linksIn.length ? (
								<Flex
									gap={2}
									flexWrap='wrap'>
									{linksIn.map((r: any) => (
										<Button
											key={r._id}
											size='xs'
											variant='outline'
											onClick={() => router.push(projectHref(`/model-builder/${r._id}`))}>
											<Link2 size={12} />
											{r.title}
										</Button>
									))}
								</Flex>
							) : (
								<EmptyLine>
									Nothing links here yet.
									{!IS_TENANT_PANEL && (
										<>
											{' '}
											Code models can too, with <code>ref: &apos;{doc.name}&apos;</code>.
										</>
									)}
								</EmptyLine>
							)}
						</Panel>
					</Flex>
				</Tabs.Content>

				<Tabs.Content
					value='advanced'
					p={0}>
					<Flex
						direction='column'
						gap={5}>
						<Panel
							title='Technical details'
							subtitle='Fixed when the model was made — other models, your API and imports use them.'>
							<Flex
								direction='column'
								gap={2.5}>
								<DetailRow
									label='Model name'
									value={<Mono>{doc.name}</Mono>}
								/>
								<DetailRow
									label='Address'
									value={<Mono>/{doc.route}</Mono>}
								/>
								<DetailRow
									label='Collection'
									value={<Mono>{doc.collectionName}</Mono>}
								/>
								{doc.requestedName && doc.requestedName !== doc.name && (
									<DetailRow
										label='Asked for'
										value={<Mono>{doc.requestedName}</Mono>}
									/>
								)}
								<DetailRow
									label='Version'
									value={`v${doc.version} · saved ${when(doc.updatedAt)}`}
								/>
							</Flex>
						</Panel>

						<Panel
							title='Turn off or delete'
							borderColor='red.muted'>
							<Flex
								direction='column'
								gap={4}>
								<DangerRow
									title={doc.active ? 'Turn off this model' : 'Turn this model back on'}
									text={
										doc.active
											? 'Its page and API stop; the records, and links to them, stay. You can turn it back on any time.'
											: 'Its page and API come back, as they were.'
									}>
									<Button
										size='sm'
										variant='outline'
										disabled={busy || isDirty}
										title={isDirty ? 'Save or undo your changes first' : undefined}
										onClick={() => setConfirm('disable')}>
										{doc.active ? 'Turn off' : 'Turn on'}
									</Button>
								</DangerRow>
								<DangerRow
									title='Delete this model'
									text='Removes the model, its page and its sidebar entry. You choose whether its records go too.'>
									<Button
										size='sm'
										variant='outline'
										colorPalette='red'
										disabled={busy}
										onClick={() => {
											setDropData(false);
											setConfirm('delete');
										}}>
										Delete
									</Button>
								</DangerRow>
							</Flex>
						</Panel>
					</Flex>
				</Tabs.Content>
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
						<Text fontSize='sm'>
							{errorCount
								? `Unsaved changes — ${errorCount} field${errorCount === 1 ? ' needs' : 's need'} attention`
								: 'You have unsaved changes'}
						</Text>
					</Flex>
					<Flex gap={2}>
						<Button
							size='sm'
							variant='ghost'
							disabled={busy}
							onClick={() => setWorking(base)}>
							<Undo2 size={14} />
							Undo all
						</Button>
						<Button
							size='sm'
							loading={updating}
							disabled={busy}
							onClick={save}>
							<Save size={14} />
							Save changes
						</Button>
					</Flex>
				</Flex>
			)}

			<ConfirmAction
				isOpen={confirm === 'disable'}
				onClose={() => setConfirm(null)}
				isLoading={updating}
				title={doc.active ? `Turn off ${doc.title}?` : `Turn on ${doc.title}?`}
				consequence={
					doc.active
						? `Its page and /${doc.route} stop answering. The ${records ?? ''} records stay, and records of other models that link to them still show them.`
						: `Its page and /${doc.route} come back, as they were.`
				}
				confirmLabel={doc.active ? 'Turn off' : 'Turn on'}
				onConfirm={async () => {
					try {
						apply(await onUpdate({ ...modelBody(working), active: !doc.active }));
					} catch (e: any) {
						toaster.create({ title: e?.data?.message || 'Could not change it', type: 'error' });
					}
					setConfirm(null);
				}}
			/>
			<ConfirmAction
				isOpen={confirm === 'delete'}
				onClose={() => setConfirm(null)}
				isLoading={removing}
				destructive
				title={`Delete ${doc.title}?`}
				consequence={`The model, its page, its page layout, its permission and its sidebar entry are removed.${
					dropData
						? ' Its records are deleted too, permanently.'
						: ' Its records stay in the database, so the name stays taken until they’re removed.'
				}`}
				confirmLabel={dropData ? 'Delete model and records' : 'Delete model'}
				typeToConfirm={dropData ? doc.name : undefined}
				onConfirm={remove}>
				<Checkbox.Root
					mt={3}
					checked={dropData}
					onCheckedChange={e => setDropData(!!e.checked)}>
					<Checkbox.HiddenInput />
					<Checkbox.Control />
					<Checkbox.Label>Also delete its {records ?? ''} records</Checkbox.Label>
				</Checkbox.Root>
			</ConfirmAction>
		</Flex>
	);
};

const Mono: FC<{ children: ReactNode }> = ({ children }) => (
	<Text
		fontSize='13px'
		fontFamily='mono'>
		{children}
	</Text>
);

const EmptyLine: FC<{ children: ReactNode }> = ({ children }) => (
	<Text
		fontSize='sm'
		color='fg.muted'>
		{children}
	</Text>
);

const LinkButton: FC<{ children: ReactNode; onClick: () => void }> = ({ children, onClick }) => (
	<Box
		as='button'
		textDecoration='underline'
		color='fg'
		onClick={onClick}>
		{children}
	</Box>
);

const DangerRow: FC<{ title: string; text: string; children: ReactNode }> = ({ title, text, children }) => (
	<Flex
		align='center'
		justify='space-between'
		gap={4}
		flexWrap='wrap'>
		<Box
			minW={0}
			flex='1'>
			<Text
				fontSize='sm'
				fontWeight='600'>
				{title}
			</Text>
			<Text
				fontSize='xs'
				color='fg.muted'>
				{text}
			</Text>
		</Box>
		{children}
	</Flex>
);

/** The page: loads the model and its options, and hands saving and deleting to the view. */
const ModelEditor: FC<{ id: string }> = ({ id }) => {
	const { data, isLoading, isError, error, refetch } = useGetBuiltModelQuery(id);
	const { data: options } = useGetModelBuilderOptionsQuery();
	const [update, { isLoading: updating }] = useUpdateBuiltModelMutation();
	const [remove, { isLoading: removing }] = useDeleteBuiltModelMutation();
	const doc = data?.doc;

	if (isLoading)
		return (
			<Layout
				title='Loading…'
				path='model-builder'>
				<DetailSkeleton />
			</Layout>
		);
	if (isError || !doc)
		return (
			<Layout
				title='Models'
				path='model-builder'>
				<ErrorState
					error={error}
					onRetry={refetch}
				/>
			</Layout>
		);

	return (
		<Layout
			title={doc.title}
			path='model-builder'>
			<ModelEditorView
				id={id}
				doc={doc}
				targets={options?.targets || []}
				categories={options?.categories || []}
				updating={updating}
				removing={removing}
				onUpdate={body => update({ id, body }).unwrap()}
				onRemove={dropData => remove({ id, dropData }).unwrap()}
			/>
		</Layout>
	);
};

export default ModelEditor;
