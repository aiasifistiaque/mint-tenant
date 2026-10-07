'use client';

import { FC, ReactNode, useEffect, useState } from 'react';
import NextLink from 'next/link';
import { Box, Button, Center, Flex, Grid, Link, Text } from '@chakra-ui/react';
import {
	ArrowRight,
	BookOpen,
	Boxes,
	Check,
	ExternalLink,
	FolderPlus,
	Globe,
	LayoutGrid,
	Mail,
	PanelLeft,
	PlugZap,
	Rocket,
	Table2,
	UserPlus,
	X,
} from 'lucide-react';
import { DOCS_URL } from '../config/lib/constants/panel';
import { useGetInvitationsQuery, useGetMembersQuery, useGetProjectsQuery } from '../store/services/tenantApi';
import type { ProjectType, TenantProject } from '../store/services/tenantApi';
import { Panel } from '../cl';
import { openProject, useWorkspace } from './useWorkspace';

/**
 * A new organization's first steps, on the tenant panel's home (ProjectsBoard
 * `welcome`). With no project yet it's the whole page: what MINT is, the three
 * kinds of project to start with, and every step to a working project, each
 * explained, with its guide on the docs site. Once there's a project it folds
 * into a checklist above the projects until every step is done or it's
 * hidden — there and on a project's dashboard, where the steps' buttons open
 * that project. The first two steps and inviting the team tick themselves; the
 * others are ticked by hand (kept in this browser, per organization).
 *
 * The welcome email at sign-up lists the same steps (backend
 * library/functions/welcomeMail.function.ts) — keep the two in step.
 */

type StepKey = 'project' | 'models' | 'records' | 'panel' | 'team' | 'live';

type Step = {
	key: StepKey;
	title: string;
	text: string;
	/** What it gives you, in a few words each. */
	points: string[];
	guide: string;
	guideLabel: string;
	icon: ReactNode;
	tone: string;
	/** Where to do it: a page inside the first project, or (team) the organization's own. */
	open?: { label: string; page?: string; href?: string };
};

const STEPS: Step[] = [
	{
		key: 'project',
		title: 'Create a project',
		text: 'A project is one thing you build, with its own data, pages, sidebar and dashboard. Pick the kind that fits, and start from a ready-made template or from scratch.',
		points: ['An app, a website or an API', 'Templates come with models and sample data', 'Rename or archive it any time'],
		guide: '/projects#create',
		guideLabel: 'Projects guide',
		icon: <FolderPlus size={18} />,
		tone: 'teal',
	},
	{
		key: 'models',
		title: 'Describe your data',
		text: 'Add a model for each thing you keep track of: customers, orders, bookings. Name its fields, and MINT builds the screens for it straight away. No code needed, and your own AI can do it for you.',
		points: ['A table, a form, filters and a detail page', 'Fields for text, numbers, dates, files, links…', 'Link models together: an order has a customer'],
		guide: '/models#models-wizard',
		guideLabel: 'Models guide',
		icon: <Boxes size={18} />,
		tone: 'blue',
		open: { label: 'Open Models', page: '/model-builder' },
	},
	{
		key: 'records',
		title: 'Add your first records',
		text: 'This is the everyday work. Type records in, or import a spreadsheet. Then search and filter them, edit many rows at once, and undo any change from its history.',
		points: ['Import from CSV or Excel', 'Search, filters and saved columns', 'History and undo on every record'],
		guide: '/records',
		guideLabel: 'Records guide',
		icon: <Table2 size={18} />,
		tone: 'purple',
		open: { label: 'Open the project' },
	},
	{
		key: 'panel',
		title: 'Shape your panel',
		text: 'Make the project feel like your own tool: arrange the sidebar into sections, pick an icon for each page, and choose the numbers, charts and lists on the dashboard.',
		points: ['Sections and icons in the sidebar', 'Counts, sums and charts on the dashboard', 'Who sees which page'],
		guide: '/sidebar',
		guideLabel: 'Sidebar guide',
		icon: <PanelLeft size={18} />,
		tone: 'orange',
		open: { label: 'Open Sidebar', page: '/sidebar-builder' },
	},
	{
		key: 'team',
		title: 'Invite your team',
		text: 'Add the people you work with by email. Choose a role for each one, which decides what they may do, and which projects they open.',
		points: ['Invitations by email', 'Roles: owner, admin, editor, viewer or your own', 'Access per project'],
		guide: '/organization#invitations',
		guideLabel: 'Organization guide',
		icon: <UserPlus size={18} />,
		tone: 'pink',
		open: { label: 'Open Members', href: '/org/members' },
	},
	{
		key: 'live',
		title: 'Go live',
		text: 'When it’s ready, open your models to your own website or app through the public API, let your customers sign in, and see who visits.',
		points: ['A public API with filters and search', 'Customer sign-in, with a ready widget', 'Analytics without cookies'],
		guide: '/public-api',
		guideLabel: 'Public API guide',
		icon: <Rocket size={18} />,
		tone: 'cyan',
		open: { label: 'Open Public API', page: '/public-api' },
	},
];

/** The kinds of project, described for someone who's never seen MINT. */
const KINDS: { type: ProjectType; title: string; icon: ReactNode; tone: string; text: string; examples: string; gets: string[] }[] = [
	{
		type: 'app',
		title: 'An app',
		icon: <LayoutGrid size={20} />,
		tone: 'teal',
		text: 'A tool for running your business: you describe your data, and MINT gives you the admin to work with it.',
		examples: 'A CRM, orders and stock, bookings, a help desk',
		gets: ['Your own models and pages', 'A sidebar and a dashboard', 'Your team, with roles'],
	},
	{
		type: 'website',
		title: 'A website',
		icon: <Globe size={20} />,
		tone: 'blue',
		text: 'The content behind a website: pages, SEO and content blocks you edit here, served to your site in two calls.',
		examples: 'A company site, a landing page, a blog, a shop',
		gets: ['Pages, SEO and content blocks', 'Site settings and domains', 'Visitor analytics'],
	},
	{
		type: 'api',
		title: 'An API',
		icon: <PlugZap size={20} />,
		tone: 'purple',
		text: 'A backend for an app or site you build yourself: your models behind ready endpoints, with sign-in for your users.',
		examples: 'A mobile app’s backend, a SaaS, an integration',
		gets: ['Endpoints with filters and paging', 'Customer sign-in', 'Webhooks when data changes'],
	},
];

const guideHref = (path: string) => `${DOCS_URL}${path}`;

/** The steps ticked by hand, and whether the guide was hidden — per organization, in this browser. */
const useProgress = (orgId?: string) => {
	const key = `mint-first-steps:${orgId || ''}`;
	const [state, setState] = useState<{ ticked: StepKey[]; hidden: boolean }>({ ticked: [], hidden: false });
	useEffect(() => {
		if (!orgId) return;
		try {
			const saved = JSON.parse(localStorage.getItem(key) || 'null');
			if (saved) setState({ ticked: saved.ticked || [], hidden: !!saved.hidden });
		} catch {
			/* storage blocked */
		}
	}, [key, orgId]);
	const save = (next: typeof state) => {
		setState(next);
		try {
			localStorage.setItem(key, JSON.stringify(next));
		} catch {
			/* storage blocked */
		}
	};
	return {
		...state,
		toggle: (k: StepKey) => save({ ...state, ticked: state.ticked.includes(k) ? state.ticked.filter(t => t !== k) : [...state.ticked, k] }),
		hide: () => save({ ...state, hidden: true }),
	};
};

/** "Read the guide ↗" — a section of the docs site, in a new tab. */
const GuideLinkOut: FC<{ path: string; label?: string }> = ({ path, label = 'Read the guide' }) => (
	<Link
		href={guideHref(path)}
		target='_blank'
		rel='noreferrer'
		display='inline-flex'
		alignItems='center'
		gap={1}
		fontSize='13px'
		color='fg.muted'
		_hover={{ color: 'fg' }}>
		<BookOpen size={13} />
		{label}
		<ExternalLink size={11} />
	</Link>
);

/** A step's number, or its tick once done. */
const StepMark: FC<{ n: number; tone: string; done: boolean }> = ({ n, tone, done }) => (
	<Center
		boxSize='32px'
		flexShrink={0}
		borderRadius='full'
		borderWidth='1px'
		borderColor={done ? `${tone}.solid` : `${tone}.muted`}
		bg={done ? `${tone}.solid` : `${tone}.subtle`}
		color={done ? `${tone}.contrast` : `${tone}.fg`}
		fontSize='12px'
		fontFamily='mono'>
		{done ? <Check size={15} /> : `0${n}`}
	</Center>
);

/** Where a step is done: inside the first project, or on the organization's own page. */
const stepAction = (step: Step, first?: TenantProject) => {
	if (!step.open) return null;
	if (step.open.href)
		return (
			<Button
				asChild
				size='xs'
				variant='outline'>
				<NextLink href={step.open.href}>
					{step.open.label}
					<ArrowRight size={13} />
				</NextLink>
			</Button>
		);
	if (!first) return null;
	return (
		<Button
			size='xs'
			variant='outline'
			onClick={() => openProject(first.publicSlug, step.open?.page || '')}>
			{step.open.label}
			<ArrowRight size={13} />
		</Button>
	);
};

/* ------------------------------------------------------------ first run */

/** No project yet: the whole welcome — what MINT is, where to start, and every step after. */
const FirstRun: FC<{ name?: string; organization?: string; onCreate: (type: ProjectType) => void; teamDone: boolean }> = ({
	name,
	organization,
	onCreate,
	teamDone,
}) => {
	const first = String(name || '').trim().split(/\s+/)[0];
	return (
		<Flex
			direction='column'
			gap={6}>
			{/* What MINT is, and where the steps are. */}
			<Grid
				templateColumns={{ base: '1fr', lg: 'minmax(0, 1.6fr) minmax(0, 1fr)' }}
				gap={4}>
				<Panel>
					<Flex
						direction='column'
						gap={3}
						py={1}>
						<Text
							fontSize='11px'
							fontFamily='mono'
							letterSpacing='0.14em'
							textTransform='uppercase'
							color='teal.fg'>
							Welcome to MINT
						</Text>
						<Text
							as='h1'
							fontSize={{ base: '22px', md: '26px' }}
							fontWeight='display'
							fontFamily='display'
							lineHeight='1.2'>
							{first ? `Let’s build your first project, ${first}` : 'Let’s build your first project'}
						</Text>
						<Text
							fontSize='14.5px'
							color='fg.muted'
							lineHeight='1.7'>
							{organization ? <b>{organization}</b> : 'Your organization'} is ready. MINT is a backend with the admin panel built in: you describe
							the things your business keeps track of (customers, orders, bookings) and you get a ready admin for them, with tables, forms,
							filters and a dashboard. Later you can open them to your own website or app.
						</Text>
						<Text
							fontSize='14.5px'
							color='fg.muted'
							lineHeight='1.7'>
							It takes a few minutes. Start by choosing what to build below; the steps after it are listed underneath, each with a short
							guide.
						</Text>
					</Flex>
				</Panel>
				<Panel>
					<Flex
						direction='column'
						gap={4}
						h='full'
						py={1}>
						<Flex
							gap={3}
							align='flex-start'>
							<Center
								boxSize='36px'
								flexShrink={0}
								borderRadius='md'
								bg='bg.muted'
								color='fg.muted'>
								<Mail size={17} />
							</Center>
							<Box>
								<Text
									fontSize='14px'
									fontWeight='600'>
									Check your inbox
								</Text>
								<Text
									fontSize='13px'
									color='fg.muted'
									lineHeight='1.6'>
									We emailed you these steps with a link to each guide, so you have them to hand.
								</Text>
							</Box>
						</Flex>
						<Flex
							gap={3}
							align='flex-start'>
							<Center
								boxSize='36px'
								flexShrink={0}
								borderRadius='md'
								bg='bg.muted'
								color='fg.muted'>
								<BookOpen size={17} />
							</Center>
							<Box>
								<Text
									fontSize='14px'
									fontWeight='600'>
									The guides
								</Text>
								<Text
									fontSize='13px'
									color='fg.muted'
									lineHeight='1.6'>
									Everything MINT does, explained step by step, from your first model to a live site.
								</Text>
								<Flex
									gap={3}
									mt={2}
									wrap='wrap'>
									<GuideLinkOut
										path='/getting-started'
										label='Getting started'
									/>
									<GuideLinkOut
										path=''
										label='All guides'
									/>
								</Flex>
							</Box>
						</Flex>
					</Flex>
				</Panel>
			</Grid>

			{/* Step 1: what to build. */}
			<Panel
				title='Step 1 · Choose what to build'
				subtitle='Every project is one of three kinds. Not sure? Pick an app: it fits most businesses, and you can add more projects later.'>
				<Grid
					templateColumns={{ base: '1fr', md: 'repeat(3, minmax(0, 1fr))' }}
					gap={3}>
					{KINDS.map(k => (
						<Flex
							key={k.type}
							direction='column'
							gap={3}
							p={4}
							borderWidth='1px'
							borderColor='border'
							borderRadius='lg'
							bg='bg.panel'
							transition='border-color .12s ease'
							_hover={{ borderColor: 'border.emphasized' }}>
							<Center
								boxSize='40px'
								borderRadius='md'
								bg={`${k.tone}.subtle`}
								color={`${k.tone}.fg`}>
								{k.icon}
							</Center>
							<Box>
								<Text
									fontSize='15px'
									fontWeight='600'>
									{k.title}
								</Text>
								<Text
									fontSize='13px'
									color='fg.muted'
									lineHeight='1.6'
									mt={1}>
									{k.text}
								</Text>
							</Box>
							<Text
								fontSize='12.5px'
								color='fg.muted'
								lineHeight='1.5'>
								<Text
									as='span'
									color='fg'
									fontSize='12.5px'>
									For example:
								</Text>{' '}
								{k.examples}
							</Text>
							<Flex
								as='ul'
								direction='column'
								gap={1.5}
								listStyleType='none'
								flex={1}>
								{k.gets.map(g => (
									<Flex
										as='li'
										key={g}
										gap={2}
										align='center'
										fontSize='12.5px'>
										<Box
											as='span'
											color={`${k.tone}.fg`}
											display='inline-flex'>
											<Check size={13} />
										</Box>
										<Text
											as='span'
											fontSize='12.5px'>
											{g}
										</Text>
									</Flex>
								))}
							</Flex>
							<Button
								size='sm'
								mt={1}
								onClick={() => onCreate(k.type)}>
								Start {k.title.toLowerCase()}
								<ArrowRight size={14} />
							</Button>
						</Flex>
					))}
				</Grid>
				<Text
					fontSize='12.5px'
					color='fg.muted'
					mt={3}>
					Next, you name the project and choose to start from a template (with its models and sample data) or from scratch.{' '}
					<GuideLinkOut
						path='/templates'
						label='About templates'
					/>
				</Text>
			</Panel>

			{/* The steps after it. */}
			<Panel
				title='Then, step by step'
				subtitle='What comes after your first project. Each step opens once the project exists; the guide explains it in full.'>
				<Flex
					direction='column'
					gap={0}>
					{STEPS.slice(1).map((s, i, all) => (
						<Flex
							key={s.key}
							gap={4}
							position='relative'
							pb={i === all.length - 1 ? 0 : 6}>
							{/* The line joining the steps. */}
							{i < all.length - 1 && (
								<Box
									position='absolute'
									left='15px'
									top='36px'
									bottom='4px'
									w='1px'
									bg='border'
								/>
							)}
							<StepMark
								n={i + 2}
								tone={s.tone}
								done={s.key === 'team' && teamDone}
							/>
							<Box
								flex={1}
								minW={0}
								pt={1}>
								<Flex
									align='center'
									gap={2}
									wrap='wrap'>
									<Text
										fontSize='14.5px'
										fontWeight='600'>
										{s.title}
									</Text>
									{s.key === 'team' ? (
										<Text
											fontSize='11.5px'
											color='teal.fg'>
											{teamDone ? 'Done' : 'You can do this now'}
										</Text>
									) : (
										<Text
											fontSize='11.5px'
											color='fg.muted'>
											After your first project
										</Text>
									)}
								</Flex>
								<Text
									fontSize='13.5px'
									color='fg.muted'
									lineHeight='1.65'
									mt={1}
									maxW='720px'>
									{s.text}
								</Text>
								<Flex
									gap={2}
									mt={2.5}
									wrap='wrap'>
									{s.points.map(p => (
										<Text
											key={p}
											as='span'
											px={2}
											py={0.5}
											borderRadius='full'
											borderWidth='1px'
											borderColor='border'
											fontSize='12px'
											color='fg.muted'>
											{p}
										</Text>
									))}
								</Flex>
								<Flex
									gap={3}
									mt={3}
									align='center'
									wrap='wrap'>
									{s.key === 'team' && stepAction(s)}
									<GuideLinkOut
										path={s.guide}
										label={s.guideLabel}
									/>
								</Flex>
							</Box>
						</Flex>
					))}
				</Flex>
			</Panel>
		</Flex>
	);
};

/* ------------------------------------------------------------ checklist */

/** With a project: the same steps as a checklist above the projects, until done or hidden. */
const Checklist: FC<{
	projects: TenantProject[];
	current?: TenantProject | null;
	done: Record<StepKey, boolean>;
	auto: Record<StepKey, boolean>;
	onToggle: (k: StepKey) => void;
	onHide: () => void;
}> = ({
	projects,
	current,
	done,
	auto,
	onToggle,
	onHide,
}) => {
	const count = STEPS.filter(s => done[s.key]).length;
	// Where the steps' buttons go: the project that's open, or the first one.
	const first = current || projects.find(p => p.isActive) || projects[0];
	// The first step not yet done opens; the rest stay one line each.
	const next = STEPS.find(s => !done[s.key])?.key;
	const [open, setOpen] = useState<StepKey | undefined>(next);
	useEffect(() => setOpen(next), [next]);

	return (
		<Panel
			title='Getting started'
			subtitle={`${count} of ${STEPS.length} done · the steps to a working project, each with its guide`}
			actions={
				<Button
					size='xs'
					variant='ghost'
					color='fg.muted'
					onClick={onHide}>
					<X size={13} />
					Hide
				</Button>
			}>
			<Box
				h='4px'
				borderRadius='full'
				bg='bg.muted'
				mb={4}
				overflow='hidden'>
				<Box
					h='full'
					w={`${(count / STEPS.length) * 100}%`}
					bg='teal.solid'
					borderRadius='full'
					transition='width .3s ease'
				/>
			</Box>
			<Flex direction='column'>
				{STEPS.map((s, i) => {
					const isDone = done[s.key];
					const isOpen = open === s.key;
					return (
						<Box
							key={s.key}
							borderTopWidth={i ? '1px' : 0}
							borderColor='border.muted'
							py={3}>
							<Flex
								as='button'
								// @ts-ignore — Flex as button
								type='button'
								onClick={() => setOpen(isOpen ? undefined : s.key)}
								aria-expanded={isOpen}
								w='full'
								align='center'
								gap={3}
								textAlign='left'
								cursor='pointer'>
								<StepMark
									n={i + 1}
									tone={s.tone}
									done={isDone}
								/>
								<Box
									flex={1}
									minW={0}>
									<Text
										fontSize='14px'
										fontWeight='600'
										color={isDone ? 'fg.muted' : 'fg'}
										textDecoration={isDone ? 'line-through' : undefined}>
										{s.title}
									</Text>
									{!isOpen && (
										<Text
											fontSize='12.5px'
											color='fg.muted'
											truncate>
											{s.text}
										</Text>
									)}
								</Box>
							</Flex>
							{isOpen && (
								<Box
									pl='44px'
									pt={2}>
									<Text
										fontSize='13.5px'
										color='fg.muted'
										lineHeight='1.65'
										maxW='720px'>
										{s.text}
									</Text>
									<Flex
										gap={2}
										mt={2.5}
										wrap='wrap'>
										{s.points.map(p => (
											<Text
												key={p}
												as='span'
												px={2}
												py={0.5}
												borderRadius='full'
												borderWidth='1px'
												borderColor='border'
												fontSize='12px'
												color='fg.muted'>
												{p}
											</Text>
										))}
									</Flex>
									<Flex
										gap={3}
										mt={3}
										align='center'
										wrap='wrap'>
										{stepAction(s, first)}
										<GuideLinkOut
											path={s.guide}
											label={s.guideLabel}
										/>
										{auto[s.key] ? (
											<Text
												fontSize='12px'
												color='teal.fg'>
												Done — MINT ticked this for you
											</Text>
										) : (
											<Button
												size='xs'
												variant='ghost'
												color='fg.muted'
												onClick={() => onToggle(s.key)}>
												<Check size={13} />
												{isDone ? 'Not done yet' : 'Mark as done'}
											</Button>
										)}
									</Flex>
								</Box>
							)}
						</Box>
					);
				})}
			</Flex>
		</Panel>
	);
};

/* ------------------------------------------------------------ the guide */

/**
 * The home page's first steps. Renders nothing for someone who can't create
 * projects, once hidden, or once every step is done.
 */
const FirstSteps: FC<{ projects?: TenantProject[]; onCreate?: (type: ProjectType) => void }> = ({ projects: given, onCreate }) => {
	const { self, organization, project, can } = useWorkspace();
	// On a project's dashboard nobody hands the projects in: fetch them (with their model counts).
	const { data: fetched } = useGetProjectsQuery({ archived: false }, { skip: !!given });
	const projects = given || fetched?.doc || [];
	const progress = useProgress(organization?._id);
	const { data: members } = useGetMembersQuery(undefined, { skip: !can('view-members') });
	const { data: invitations } = useGetInvitationsQuery(undefined, { skip: !can('invite-members') });

	const auto: Record<StepKey, boolean> = {
		project: projects.length > 0,
		models: projects.some(p => (p.models || 0) > 0),
		team: (members?.total || members?.doc?.length || 0) > 1 || (invitations?.doc?.length || 0) > 0,
		records: false,
		panel: false,
		live: false,
	};
	const done = Object.fromEntries(STEPS.map(s => [s.key, auto[s.key] || progress.ticked.includes(s.key)])) as Record<StepKey, boolean>;

	if (!can('create-projects')) return null;
	if (!projects.length) {
		if (!given || !onCreate) return null;
		return (
			<FirstRun
				name={self?.name}
				organization={organization?.name}
				onCreate={onCreate}
				teamDone={auto.team}
			/>
		);
	}
	if (progress.hidden || STEPS.every(s => done[s.key])) return null;
	return (
		<Checklist
			projects={projects}
			current={project}
			done={done}
			auto={auto}
			onToggle={progress.toggle}
			onHide={progress.hide}
		/>
	);
};

export default FirstSteps;
