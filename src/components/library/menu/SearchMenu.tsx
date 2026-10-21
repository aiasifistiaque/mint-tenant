import { useEffect, useState, useRef, Fragment, ReactNode } from 'react';
import { Dialog, useDisclosure, Flex, Input, Text, FlexProps, TextProps, Portal, Box, Kbd, Spinner } from '@chakra-ui/react';
import { CornerDownLeft, Search, SearchX } from 'lucide-react';

import { MenuIconContainer } from '.';
import { Icon, LucideIcon } from '../icon';
import { THEME, radius } from '../config';

import ModalContentContainer from '../modals/modal-components/ModalContentContainer';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SidebarItemType } from '../config/lib/sidebar/types';
import { IS_TENANT_PANEL, getProjectSlug, homeHref } from '../config/lib/constants/panel';
import { useGetNavSearchQuery } from '../store/services/navSearchApi';
import { viewHrefOf } from '../components/view/utils/record-link/linked';
import { useOpenAnyProject, useWorkspace } from '../tenant/useWorkspace';

/**
 * The navbar search (⌘K / Alt+K): the sidebar's pages by name, and — once two
 * letters are typed — records of the pages whose config turns search on
 * (Fields & rules → "Show in search", WO-54). The server asks each such page
 * through its own list rules, so only records this person can list come back.
 * A record reads as its name, with its record number and page under it.
 *
 * In the tenant panel it finds projects too — this organization's and the
 * others' this account works in (auth/self) — by name, address or
 * description. On the organization's pages they come first (all of them
 * before anything is typed); inside a project, the other projects show once
 * something is typed. Opening one in another organization switches to it.
 *
 * The window is pinned near the top of the screen and only its list scrolls,
 * so the search box stays put while results come and go.
 */

/** Records are searched a moment after typing stops. */
const useDebounced = (value: string, ms = 250) => {
	const [v, setV] = useState(value);
	useEffect(() => {
		const t = setTimeout(() => setV(value), ms);
		return () => clearTimeout(t);
	}, [value, ms]);
	return v;
};

const path = (href = '') => href.replace(/[?#].*$/, '').replace(/\/+$/, '');

const PROJECT_ICON: Record<string, string> = { app: 'layout-grid', website: 'globe', api: 'plug-zap' };
const PROJECT_KIND: Record<string, string> = { app: 'App', website: 'Website', api: 'API' };
/** Before anything is typed, the organization's page lists this many of its projects. */
const FIRST_PROJECTS = 8;

const SearchMenu = ({ sidebarData, iconSize, iconColor }: { sidebarData: SidebarItemType[]; iconSize?: number; iconColor?: string }) => {
	const { open: isOpen, onOpen, onClose: closeModal } = useDisclosure();
	const [search, setSearch] = useState('');

	const initialRef = useRef(null);
	const finalRef = useRef(null);
	const listRef = useRef<HTMLDivElement>(null);
	const [selectedIndex, setSelectedIndex] = useState(0);
	// The list as last drawn: the keys read it, so Enter opens what's on screen after the results change.
	const dataRef = useRef<{ href: string; go?: () => void }[]>([]);

	const onClose = () => {
		closeModal();
		setSearch('');
	};

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Command + K (Mac) or Alt + K
			if ((e.metaKey || e.altKey) && e.key === 'k') {
				e.preventDefault();
				if (isOpen) onClose();
				else onOpen();
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [onOpen, onClose, isOpen]);

	const router = useRouter();

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!isOpen) return;

			if (e.key === 'ArrowDown') {
				e.preventDefault();
				setSelectedIndex(prev => (prev < dataRef.current.length - 1 ? prev + 1 : prev));
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
			} else if (e.key === 'Enter') {
				e.preventDefault();
				const item = dataRef.current[selectedIndex];
				if (item) {
					onClose();
					if (item.go) item.go();
					else router.push(item.href);
				}
			} else if (e.key === 'Escape') {
				onClose();
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [selectedIndex, isOpen, onClose]);

	const restructureSidebar = (items: any): any[] => {
		let currentSection = '';

		return items.map((item: any, index: number) => {
			if (item.sectionTitle) {
				currentSection = item.sectionTitle;
			}

			return {
				...item,
				href: homeHref(item.href),
				sectionTitle: currentSection,
				index,
			};
		});
	};

	const restructData = restructureSidebar(sidebarData);
	const needle = search.trim().toLowerCase();

	const pages = restructData
		.filter(item => !needle || item.title?.toLowerCase().includes(needle) || item.sectionTitle?.toLowerCase().includes(needle))
		.sort((a, b) => {
			if (a.title < b.title) return -1;
			if (a.title > b.title) return 1;
			return 0;
		});

	// Records: the tenant panel searches inside a project only — outside one there are no pages of records.
	const query = useDebounced(search.trim());
	const recordsOn = isOpen && query.length >= 2 && (!IS_TENANT_PANEL || !!getProjectSlug());
	const { currentData: found, isFetching } = useGetNavSearchQuery(query, { skip: !recordsOn });
	const searching = (recordsOn && isFetching) || (search.trim().length >= 2 && search.trim() !== query);
	const { project, organization, organizations, projects: ownProjects } = useWorkspace({ skip: !isOpen });
	const { open: openAnyProject } = useOpenAnyProject();
	const groups = recordsOn ? found?.groups || [] : [];
	// Projects (tenant panel): this organization's, then the others' this account opens, by name, address or description.
	const inProject = !!getProjectSlug();
	const everyProject = !IS_TENANT_PANEL
		? []
		: [
				...ownProjects.map(p => ({ ...p, orgId: organization?._id || '', orgName: '' })),
				...organizations.filter(o => o._id !== organization?._id).flatMap(o => (o.projects || []).map(p => ({ ...p, orgId: o._id, orgName: o.name }))),
			].filter(p => p.publicSlug !== project?.publicSlug);
	const projectHits = (
		needle
			? everyProject.filter(p => [p.name, p.publicSlug, p.description].some(v => String(v || '').toLowerCase().includes(needle)))
			: inProject
				? []
				: everyProject.filter(p => !p.orgName).slice(0, FIRST_PROJECTS)
	).map(p => ({ ...p, href: `/${p.publicSlug}`, go: () => openAnyProject(p.orgId, p.publicSlug) }));
	// Outside a project the projects lead; inside one they follow the pages.
	const projectsFirst = IS_TENANT_PANEL && !inProject;
	// A record shows its page's sidebar icon, when the page is in the sidebar.
	const iconOf = (route: string) => restructData.find(i => path(i.href).endsWith(`/${route}`))?.icon || 'file-text';
	const records = groups.flatMap(g => g.hits.map(h => ({ ...h, group: g, href: viewHrefOf(g.route, h._id) })));
	// One list for the arrow keys, in the order shown: projects (on the organization's pages), pages, projects (inside one), records.
	const data: { href: string; go?: () => void }[] = projectsFirst ? [...projectHits, ...pages, ...records] : [...pages, ...projectHits, ...records];
	const projectStart = projectsFirst ? 0 : pages.length;
	const pageStart = projectsFirst ? projectHits.length : 0;
	const recordStart = pages.length + projectHits.length;
	dataRef.current = data;

	useEffect(() => {
		if (data.length <= selectedIndex) setSelectedIndex(0);
	});
	// A new search starts at the top of the list.
	useEffect(() => {
		setSelectedIndex(0);
		listRef.current?.scrollTo({ top: 0 });
	}, [search]);
	// The arrow keys keep the picked row in view.
	useEffect(() => {
		listRef.current?.querySelector(`[data-idx="${selectedIndex}"]`)?.scrollIntoView({ block: 'nearest' });
	}, [selectedIndex]);

	const row = (i: number, href: string, icon: string, title: ReactNode, under: ReactNode, onClick?: (e: any) => void) => (
		<Link
			key={`row-${i}`}
			href={href}
			onClick={onClick}>
			<Flex
				{...rowCss}
				data-idx={i}
				aria-selected={selectedIndex === i}
				bg={selectedIndex === i ? 'bg.muted' : 'transparent'}
				onMouseMove={() => selectedIndex !== i && setSelectedIndex(i)}>
				<Flex {...tileCss}>
					<LucideIcon
						name={icon}
						size={16}
					/>
				</Flex>
				<Box
					flex={1}
					minW={0}>
					{title}
					{under}
				</Box>
				<Box
					display={{ base: 'none', md: 'block' }}
					visibility={selectedIndex === i ? 'visible' : 'hidden'}
					color='fg.muted'>
					<CornerDownLeft size={14} />
				</Box>
			</Flex>
		</Link>
	);

	const projectList = () =>
		projectHits.length > 0 && (
			<>
				<Text
					{...sectionCss}
					mt={projectStart ? 3 : 0}>
					{needle ? 'Projects' : `Projects${organization?.name ? ` in ${organization.name}` : ''}`}
				</Text>
				{projectHits.map((p, j) =>
					row(
						projectStart + j,
						p.href,
						PROJECT_ICON[p.type] || 'boxes',
						<Text
							{...nameCss}
							lineClamp={1}>
							{p.name}
						</Text>,
						<Text
							{...underCss}
							lineClamp={1}>
							{[PROJECT_KIND[p.type] || 'Project', p.orgName].filter(Boolean).join(' · ')}
							{p.description ? ` — ${p.description}` : ''}
						</Text>,
						(e: any) => {
							// A full load into the project (and its organization, when it's another).
							e.preventDefault();
							onClose();
							p.go();
						}
					)
				)}
			</>
		);

	return (
		<>
			<Dialog.Root
				lazyMount
				unmountOnExit
				trapFocus
				preventScroll
				placement='top'
				initialFocusEl={() => initialRef.current}
				finalFocusEl={() => finalRef.current}
				size='lg'
				open={isOpen}
				onOpenChange={({ open }) => (open ? {} : onClose())}>
				<Dialog.Trigger asChild>
					<Flex
						onClick={onOpen}
						aria-label={IS_TENANT_PANEL ? 'Search pages, records and projects' : 'Search pages and records'}
						title='Search (⌘K)'
						cursor='pointer'>
						<MenuIconContainer>
							<Icon
								name='search'
								size={iconSize || 16}
								color={iconColor || (THEME == 'basic' ? 'inherit' : 'white')}
							/>
						</MenuIconContainer>
					</Flex>
				</Dialog.Trigger>
				<Portal>
					<Dialog.Backdrop />
					{/* Pinned: the same distance from the top whatever the list holds. */}
					<Dialog.Positioner
						alignItems='flex-start'
						pt={{ base: 3, md: '12vh' }}
						px={{ base: 3, md: 4 }}>
						<ModalContentContainer
							borderRadius={radius.MODAL}
							px={0}
							gap={0}
							my={0}
							maxH='none'
							w='full'>
							<Flex
								align='center'
								gap={2.5}
								px={4}
								h='56px'
								borderBottomWidth='1px'
								borderColor='border'>
								<Box
									color='fg.muted'
									flexShrink={0}>
									<Search size={18} />
								</Box>
								<Input
									ref={initialRef}
									variant='flushed'
									border='none'
									px={0}
									h='full'
									fontSize='16px'
									value={search}
									onChange={(e: any) => setSearch(e.target.value)}
									placeholder={placeholder()}
									_placeholder={{ color: 'fg.muted' }}
									css={{ '--focus-color': 'transparent' }}
								/>
								{searching && (
									<Spinner
										size='xs'
										color='fg.muted'
										flexShrink={0}
									/>
								)}
								<Kbd
									size='sm'
									cursor='pointer'
									flexShrink={0}
									onClick={onClose}>
									Esc
								</Kbd>
							</Flex>

							<Box
								ref={listRef}
								overflowY='auto'
								overscrollBehavior='contain'
								maxH={{ base: 'calc(100dvh - 96px)', md: 'min(60vh, 520px)' }}
								px={2}
								py={2}>
								{projectsFirst && projectList()}
								{pages.length > 0 && (
									<Text
										{...sectionCss}
										mt={pageStart ? 3 : 0}>
										Pages
									</Text>
								)}
								{pages.map((item: any, i: number) =>
									row(
										pageStart + i,
										item.href,
										item.icon,
										<Text
											{...nameCss}
											lineClamp={1}>
											{item.title}
										</Text>,
										item.sectionTitle && (
											<Text
												{...underCss}
												lineClamp={1}>
												{item.sectionTitle}
											</Text>
										),
										onClose
									)
								)}

								{!projectsFirst && projectList()}
								{records.length > 0 && (
									<Text
										{...sectionCss}
										mt={recordStart ? 3 : 0}>
										Records{project?.name ? ` in ${project.name}` : ''}
									</Text>
								)}
								{records.map((item, j) => {
									const i = recordStart + j;
									const lastOfGroup = j === records.length - 1 || records[j + 1].group !== item.group;
									const code = item.code && item.code !== item.name ? item.code : '';
									return (
										<Fragment key={`${item.group.route}:${item._id}`}>
											{row(
												i,
												item.href,
												iconOf(item.group.route),
												<Text
													{...nameCss}
													lineClamp={1}>
													{item.name}
												</Text>,
												<>
													<Flex
														fontSize='12px'
														color='fg.muted'
														align='center'
														gap={1.5}
														minW={0}>
														{code && (
															<Text
																as='span'
																fontFamily='mono'
																fontSize='11.5px'
																color='fg'
																flexShrink={0}>
																{code}
															</Text>
														)}
														{code && (
															<Text
																as='span'
																color='inherit'>
																·
															</Text>
														)}
														<Text
															as='span'
															color='inherit'
															lineClamp={1}>
															{item.group.title}
														</Text>
													</Flex>
													{item.match && (
														<Text
															{...underCss}
															lineClamp={1}>
															{item.match.label}: <Text as='span' color='fg'>{item.match.value}</Text>
														</Text>
													)}
												</>,
												onClose
											)}
											{item.group.more && lastOfGroup && (
												<Text
													{...underCss}
													px={3}
													pb={1}>
													More in {item.group.title} — keep typing to narrow it down.
												</Text>
											)}
										</Fragment>
									);
								})}

								{search.trim() && !data.length && !searching && (
									<Flex
										direction='column'
										align='center'
										gap={2}
										py={10}
										color='fg.muted'
										textAlign='center'>
										<SearchX size={22} />
										<Text fontSize='14px'>Nothing matches “{search.trim()}”</Text>
									</Flex>
								)}
								{search.trim() && !data.length && searching && (
									<Text
										{...underCss}
										px={3}
										py={4}>
										Searching…
									</Text>
								)}
							</Box>

							<Flex
								display={{ base: 'none', md: 'flex' }}
								align='center'
								gap={4}
								px={4}
								h='40px'
								borderTopWidth='1px'
								borderColor='border'
								fontSize='12px'
								color='fg.muted'>
								<Hint keys={['↑', '↓']}>to move</Hint>
								<Hint keys={['↵']}>to open</Hint>
								<Hint keys={['Esc']}>to close</Hint>
							</Flex>
						</ModalContentContainer>
					</Dialog.Positioner>
				</Portal>
			</Dialog.Root>
		</>
	);
};

/** Records are searched inside a project in the tenant panel, always in the super admin's; projects in the tenant panel. */
const placeholder = () => (!IS_TENANT_PANEL ? 'Search pages and records…' : getProjectSlug() ? 'Search pages, records and projects…' : 'Search projects and pages…');

const Hint = ({ keys, children }: { keys: string[]; children: ReactNode }) => (
	<Flex
		align='center'
		gap={1}>
		{keys.map(k => (
			<Kbd
				key={k}
				size='sm'>
				{k}
			</Kbd>
		))}
		<Text
			as='span'
			color='fg.muted'>
			{children}
		</Text>
	</Flex>
);

const rowCss: FlexProps = {
	align: 'center',
	gap: 3,
	px: 3,
	py: 2,
	borderRadius: 'md',
	cursor: 'pointer',
	minH: '48px',
};

const tileCss: FlexProps = {
	align: 'center',
	justify: 'center',
	boxSize: '32px',
	flexShrink: 0,
	borderRadius: 'md',
	borderWidth: '1px',
	borderColor: 'border',
	bg: 'bg.panel',
	color: 'fg.muted',
};

const sectionCss: TextProps = {
	fontSize: '11px',
	fontWeight: '600',
	letterSpacing: '0.06em',
	textTransform: 'uppercase',
	color: 'fg.muted',
	px: 3,
	pt: 1,
	pb: 1.5,
};

const nameCss: TextProps = {
	fontSize: '14px',
	fontWeight: '600',
	color: 'fg',
};

const underCss: TextProps = {
	fontSize: '12px',
	color: 'fg.muted',
};

export default SearchMenu;
