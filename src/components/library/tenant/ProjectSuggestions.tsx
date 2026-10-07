'use client';

import { FC, ReactNode, useEffect, useState } from 'react';
import NextLink from 'next/link';
import { Badge, Box, Button, Center, Flex, Grid, Link, Text } from '@chakra-ui/react';
import {
	ArrowRight,
	BookOpen,
	Bot,
	Boxes,
	Check,
	ExternalLink,
	LayoutDashboard,
	LayoutTemplate,
	Lightbulb,
	PanelLeft,
	PlugZap,
	Settings2,
	Table2,
	UserPlus,
	Webhook,
	X,
} from 'lucide-react';
import { DOCS_URL, createPath, pagePath, projectHref } from '../config/lib/constants/panel';
import { useGetBuiltModelsQuery } from '../store/services/builderApi';
import { useGetDashboardQuery } from '../store/services/dashboardApi';
import { useGetInvitationsQuery, useGetMembersQuery } from '../store/services/tenantApi';
import type { ProjectType } from '../store/services/tenantApi';
import { useWorkspace } from './useWorkspace';

/**
 * What to do next in this project, as cards on its dashboard — the first stop
 * after a project is created (get-started hands over to the dashboard). Each
 * card is one thing to build or set up: its colour and picture, what it gives
 * you in a sentence, the button that opens it, and its guide.
 *
 * Cards tick themselves when MINT can tell (a model exists, a record was added,
 * the dashboard was saved, someone was invited); the rest are ticked by hand.
 * Done cards move to the end; once every card is done, or the cards are hidden,
 * only a "Show suggestions" link stays. Ticks are kept per project in this
 * browser.
 *
 * The organization's own "Getting started" checklist (FirstSteps) stays on the
 * home page with the projects; these cards are the project's version of it.
 */

type CardKey =
	| 'model'
	| 'records'
	| 'sidebar'
	| 'dashboard'
	| 'team'
	| 'ai'
	| 'api'
	| 'webhooks'
	| 'site-setup'
	| 'site-pages'
	| 'guides';

type Card = {
	key: CardKey;
	title: string;
	text: string;
	icon: ReactNode;
	tone: string;
	/** The button: a page in this project, or the organization's own (absolute). */
	action: { label: string; href: string };
	guide?: { label: string; path: string };
	/** Guides never get "done" — they're always there to read. */
	noTick?: boolean;
};

const ICON = { size: 18, strokeWidth: 1.75 };

const guideHref = (path: string) => `${DOCS_URL}${path}`;

/** Which cards a kind of project gets, in the order they're best done. */
const CARDS_FOR: Record<ProjectType, CardKey[]> = {
	app: ['model', 'records', 'sidebar', 'dashboard', 'team', 'ai', 'api', 'guides'],
	api: ['model', 'records', 'api', 'webhooks', 'team', 'ai', 'guides'],
	website: ['site-setup', 'site-pages', 'dashboard', 'team', 'ai', 'guides'],
};

const useTicks = (projectId?: string) => {
	const key = `mint-project-steps:${projectId || ''}`;
	const [state, setState] = useState<{ ticked: CardKey[]; hidden: boolean }>({ ticked: [], hidden: false });
	useEffect(() => {
		if (!projectId) return;
		try {
			const saved = JSON.parse(localStorage.getItem(key) || 'null');
			setState(saved ? { ticked: saved.ticked || [], hidden: !!saved.hidden } : { ticked: [], hidden: false });
		} catch {
			/* storage blocked: the cards still work, they just won't remember */
		}
	}, [key, projectId]);
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
		toggle: (k: CardKey) => save({ ...state, ticked: state.ticked.includes(k) ? state.ticked.filter(t => t !== k) : [...state.ticked, k] }),
		setHidden: (hidden: boolean) => save({ ...state, hidden }),
	};
};

const SuggestionCard: FC<{
	card: Card;
	done: boolean;
	auto: boolean;
	next: boolean;
	onToggle: () => void;
}> = ({ card, done, auto, next, onToggle }) => {
	const external = /^https?:/.test(card.action.href);
	return (
		<Flex
			direction='column'
			gap={3}
			p={4}
			borderWidth='1px'
			borderTopWidth='3px'
			borderColor={next ? `${card.tone}.muted` : 'border'}
			borderTopColor={done ? 'border' : `${card.tone}.solid`}
			borderRadius='lg'
			bg={next ? `${card.tone}.subtle` : 'bg.panel'}
			opacity={done ? 0.75 : 1}
			transition='box-shadow .12s ease'
			_hover={{ boxShadow: 'sm' }}>
			<Flex
				align='flex-start'
				gap={3}>
				<Center
					boxSize='38px'
					flexShrink={0}
					borderRadius='lg'
					bg={done ? 'bg.muted' : next ? 'bg.panel' : `${card.tone}.subtle`}
					color={done ? 'fg.muted' : `${card.tone}.fg`}>
					{done ? <Check size={18} /> : card.icon}
				</Center>
				<Box
					flex={1}
					minW={0}>
					<Flex
						align='center'
						gap={2}
						wrap='wrap'>
						<Text
							fontSize='14px'
							fontWeight='600'
							color={done ? 'fg.muted' : 'fg'}>
							{card.title}
						</Text>
						{next && (
							<Badge
								size='sm'
								colorPalette={card.tone}
								variant='solid'>
								Start here
							</Badge>
						)}
						{done && (
							<Badge
								size='sm'
								colorPalette='green'
								variant='subtle'>
								Done
							</Badge>
						)}
					</Flex>
					<Text
						fontSize='13px'
						color='fg.muted'
						lineHeight='1.55'
						mt={1}>
						{card.text}
					</Text>
				</Box>
			</Flex>

			<Flex
				mt='auto'
				align='center'
				justify='space-between'
				gap={2}
				wrap='wrap'>
				<Flex
					align='center'
					gap={3}
					wrap='wrap'>
					<Button
						asChild
						size='xs'
						variant={next ? 'solid' : 'outline'}
						colorPalette={next ? card.tone : undefined}
						bg={next ? undefined : 'bg.panel'}>
						{external ? (
							<a
								href={card.action.href}
								target='_blank'
								rel='noreferrer'>
								{card.action.label}
								<ExternalLink size={12} />
							</a>
						) : (
							<NextLink href={card.action.href}>
								{card.action.label}
								<ArrowRight size={12} />
							</NextLink>
						)}
					</Button>
					{card.guide && (
						<Link
							href={guideHref(card.guide.path)}
							target='_blank'
							rel='noreferrer'
							display='inline-flex'
							alignItems='center'
							gap={1}
							fontSize='12px'
							color='fg.muted'
							_hover={{ color: 'fg' }}>
							<BookOpen size={12} />
							{card.guide.label}
						</Link>
					)}
				</Flex>
				{!card.noTick &&
					(auto ? null : (
						<Button
							size='2xs'
							variant='ghost'
							color='fg.muted'
							onClick={onToggle}>
							<Check size={12} />
							{done ? 'Not done' : 'Mark done'}
						</Button>
					))}
			</Flex>
		</Flex>
	);
};

const ProjectSuggestions: FC = () => {
	const { project, can } = useWorkspace();
	const type: ProjectType = project?.type || 'app';
	const ticks = useTicks(project?._id);
	const { data: models } = useGetBuiltModelsQuery(undefined, { skip: !project || type === 'website' });
	const { data: dashboard } = useGetDashboardQuery(undefined, { skip: !project });
	const { data: members } = useGetMembersQuery(undefined, { skip: !project || !can('view-members') });
	const { data: invitations } = useGetInvitationsQuery(undefined, { skip: !project || !can('invite-members') });

	if (!project || !can('create-projects')) return null;

	const list: any[] = models?.doc || [];
	const firstWithRoute = list.find((m: any) => m.route);
	const hasRecords = list.some((m: any) => (m.records || 0) > 0);
	const kindGuide = type === 'website' ? '/websites' : type === 'api' ? '/public-api' : '/getting-started';

	const CARDS: Record<CardKey, Card> = {
		model: {
			key: 'model',
			title: list.length ? 'Add another model' : 'Build your first model',
			text: 'A model is a kind of record you keep — customers, orders, bookings. Name it and list its fields; MINT makes the table, form and pages.',
			icon: <Boxes {...ICON} />,
			tone: 'blue',
			action: { label: list.length ? 'New model' : 'Build a model', href: projectHref('/model-builder/new') },
			guide: { label: 'Models guide', path: '/models#models-wizard' },
		},
		records: {
			key: 'records',
			title: 'Add your first records',
			text: firstWithRoute
				? `Type a few ${String(firstWithRoute.title || 'records').toLowerCase()} in, or import a spreadsheet, to see your pages come alive.`
				: 'Once you have a model, type records in or import a spreadsheet. Search, filters and history come with it.',
			icon: <Table2 {...ICON} />,
			tone: 'purple',
			action: firstWithRoute
				? { label: `Add ${String(firstWithRoute.title || 'a record').toLowerCase()}`, href: createPath(firstWithRoute.route) }
				: { label: 'Open Models', href: projectHref('/model-builder') },
			guide: { label: 'Records guide', path: '/records' },
		},
		sidebar: {
			key: 'sidebar',
			title: 'Arrange the sidebar',
			text: 'Group your pages into sections, put them in order and give each an icon, so your team finds everything at a glance.',
			icon: <PanelLeft {...ICON} />,
			tone: 'orange',
			action: { label: 'Open Sidebar', href: projectHref('/sidebar-builder') },
			guide: { label: 'Sidebar guide', path: '/sidebar' },
		},
		dashboard: {
			key: 'dashboard',
			title: 'Build the dashboard',
			text: 'Choose what this page shows: counts, totals, charts and the latest records from your models.',
			icon: <LayoutDashboard {...ICON} />,
			tone: 'teal',
			action: { label: 'Open Dashboard builder', href: projectHref('/dashboard-builder') },
			guide: { label: 'Dashboard guide', path: '/dashboard' },
		},
		team: {
			key: 'team',
			title: 'Invite your team',
			text: 'Add the people you work with by email, and choose a role for each — what they can see and change, and in which projects.',
			icon: <UserPlus {...ICON} />,
			tone: 'pink',
			action: { label: 'Invite members', href: '/org/members' },
			guide: { label: 'Organization guide', path: '/organization#invitations' },
		},
		ai: {
			key: 'ai',
			title: 'Connect your own AI',
			text: 'Let Claude, ChatGPT or another assistant build models and pages in this project from a conversation.',
			icon: <Bot {...ICON} />,
			tone: 'cyan',
			action: { label: 'Connect AI', href: projectHref('/model-builder/connect') },
			guide: { label: 'Connect AI guide', path: '/connect-ai' },
		},
		api: {
			key: 'api',
			title: type === 'api' ? 'Open your endpoints' : 'Open it to your site or app',
			text: 'Choose which models your website or app can read and write through the public API, and whether your customers sign in.',
			icon: <PlugZap {...ICON} />,
			tone: 'green',
			action: { label: 'Open Public API', href: projectHref('/public-api') },
			guide: { label: 'Public API guide', path: '/public-api' },
		},
		webhooks: {
			key: 'webhooks',
			title: 'Get told when data changes',
			text: 'Webhooks call your own server when a record is added, changed or removed.',
			icon: <Webhook {...ICON} />,
			tone: 'orange',
			action: { label: 'Open Webhooks', href: projectHref('/webhooks') },
			guide: { label: 'Public API guide', path: '/public-api' },
		},
		'site-setup': {
			key: 'site-setup',
			title: 'Set up your site',
			text: 'Its name, logo, colours and domain — the basics every page uses.',
			icon: <Settings2 {...ICON} />,
			tone: 'blue',
			action: { label: 'Open Site setup', href: projectHref('/site-setup') },
			guide: { label: 'Websites guide', path: '/websites' },
		},
		'site-pages': {
			key: 'site-pages',
			title: 'Build your pages',
			text: 'Lay out the home page and the rest from ready blocks, and write their words.',
			icon: <LayoutTemplate {...ICON} />,
			tone: 'purple',
			action: { label: 'Open Site builder', href: projectHref('/site-builder') },
			guide: { label: 'Site builder guide', path: '/site-builder' },
		},
		guides: {
			key: 'guides',
			title: 'Read the guides',
			text: 'Short, step-by-step guides for everything here — from your first model to going live.',
			icon: <BookOpen {...ICON} />,
			tone: 'gray',
			action: { label: 'Getting started', href: guideHref(kindGuide) },
			guide: { label: 'All guides', path: '' },
			noTick: true,
		},
	};

	const auto: Partial<Record<CardKey, boolean>> = {
		model: list.length > 0,
		records: hasRecords,
		dashboard: !!dashboard?.saved && (dashboard?.widgets || []).length > 0,
		team: (members?.total || members?.doc?.length || 0) > 1 || (invitations?.doc?.length || 0) > 0,
	};
	const cards = CARDS_FOR[type].map(k => CARDS[k]).filter(c => c.key !== 'team' || can('invite-members'));
	const isDone = (c: Card) => !c.noTick && (!!auto[c.key] || ticks.ticked.includes(c.key));
	const tickable = cards.filter(c => !c.noTick);
	const doneCount = tickable.filter(isDone).length;
	const next = cards.find(c => !c.noTick && !isDone(c))?.key;
	// Still to do first, in order; done ones after; the guides card last.
	const ordered = [...cards.filter(c => !c.noTick && !isDone(c)), ...cards.filter(c => !c.noTick && isDone(c)), ...cards.filter(c => c.noTick)];
	const fresh = type !== 'website' && !list.length;

	if (ticks.hidden || doneCount === tickable.length)
		return (
			<Flex
				justify='flex-end'
				mb={2}>
				<Button
					size='xs'
					variant='ghost'
					color='fg.muted'
					onClick={() => ticks.setHidden(false)}>
					<Lightbulb size={13} />
					Show suggestions
				</Button>
			</Flex>
		);

	return (
		<Flex
			direction='column'
			gap={3}
			mb={5}>
			<Flex
				align={{ base: 'flex-start', md: 'center' }}
				justify='space-between'
				gap={3}
				direction={{ base: 'column', md: 'row' }}>
				<Box>
					<Text
						fontSize='16px'
						fontWeight='600'>
						{fresh ? `${project.name} is ready — here’s what to do next` : 'Suggested next steps'}
					</Text>
					<Text
						fontSize='13px'
						color='fg.muted'>
						{doneCount} of {tickable.length} done · start with the highlighted card; each one has a short guide.
					</Text>
				</Box>
				<Flex
					align='center'
					gap={3}
					flexShrink={0}>
					<Box
						w='120px'
						h='6px'
						borderRadius='full'
						bg='bg.muted'
						overflow='hidden'>
						<Box
							h='full'
							w={`${(doneCount / Math.max(tickable.length, 1)) * 100}%`}
							bg='green.solid'
							transition='width .3s ease'
						/>
					</Box>
					<Button
						size='xs'
						variant='ghost'
						color='fg.muted'
						onClick={() => ticks.setHidden(true)}>
						<X size={13} />
						Hide
					</Button>
				</Flex>
			</Flex>

			<Grid
				templateColumns={{ base: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' }}
				gap={3}>
				{ordered.map(c => (
					<SuggestionCard
						key={c.key}
						card={c}
						done={isDone(c)}
						auto={!!auto[c.key]}
						next={c.key === next}
						onToggle={() => ticks.toggle(c.key)}
					/>
				))}
			</Grid>
		</Flex>
	);
};

export default ProjectSuggestions;
