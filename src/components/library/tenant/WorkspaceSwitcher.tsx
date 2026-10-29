'use client';

import { FC, ReactNode, useEffect, useState } from 'react';
import { Box, Center, Drawer, Flex, IconButton, Input, Menu, Portal, Text } from '@chakra-ui/react';
import Link from 'next/link';
import { Check, ChevronsUpDown, FolderKanban, Globe, LayoutGrid, Pin, Plus, Building2, Search, X } from 'lucide-react';
import CustomMenuItem, { MenuItemStyle } from '../menu/CustomMenuItem';
import { MenuContainer } from '../menu';
import { DrawerContentContainer } from '../components/table/table-components/pop-modals';
import { useAppDispatch } from '../hooks';
import { refreshAuth, useSwitchOrganizationMutation } from '../store';
import { useGetProjectsQuery } from '../store/services/tenantApi';
import { HOME, rememberProject } from '../config/lib/constants/panel';
import { useOpenAnyProject, useWorkspace } from './useWorkspace';
import type { ProjectRef } from '../store/services/tenantApi';

/**
 * The tenant panel's "where am I": the open project (or the organization when
 * none is open) in the navbar, and a menu to open another project — every
 * organization's, each under its organization's name (WO-47) — see them all,
 * or switch organization. Switching organization trades the token for one in
 * that organization (POST /org/switch/:id) and starts the panel over.
 */
const WorkspaceSwitcher: FC = () => {
	const { organization, organizations, project, projects } = useWorkspace();
	const dispatch = useAppDispatch();
	const [switchOrg] = useSwitchOrganizationMutation();
	const { open } = useOpenAnyProject();
	const [sheet, setSheet] = useState(false);
	const [find, setFind] = useState('');
	useEffect(() => {
		if (!sheet) setFind('');
	}, [sheet]);
	// Pins are this account's, on the open organization's projects (the projects list carries them).
	const { data: listed } = useGetProjectsQuery(undefined, { skip: !sheet });

	if (!organization) return null;

	const toOrg = async (id: string) => {
		if (id === organization._id) return;
		const res = await switchOrg(id);
		if ('data' in res && res.data?.token) {
			rememberProject(null);
			dispatch(refreshAuth(res.data.token));
			window.location.href = HOME;
		}
	};

	const others = organizations.filter(o => o._id !== organization._id);
	// The open organization first, then every other one with projects this account opens there.
	const groups: { _id: string; name: string; guest?: boolean; projects: ProjectRef[] }[] = [
		{ _id: organization._id, name: organization.name, guest: organizations.find(o => o._id === organization._id)?.guest, projects },
		...others.filter(o => o.projects?.length).map(o => ({ _id: o._id, name: o.name, guest: o.guest, projects: o.projects || [] })),
	];

	const needle = find.trim().toLowerCase();
	const pinAt = new Map((listed?.doc || []).filter(p => p.pinnedAt).map(p => [p._id, p.pinnedAt as string]));
	const byName = (p: ProjectRef) => !needle || p.name.toLowerCase().includes(needle);
	const pinnedHere = (groups[0]?.projects || []).filter(p => pinAt.has(p._id) && byName(p)).sort((a, b) => String(pinAt.get(b._id)).localeCompare(String(pinAt.get(a._id))));
	const pinnedIds = new Set(pinnedHere.map(p => p._id));
	// Everything else, by the search; an organization with nothing left is dropped while searching.
	const shown = groups.map(g => ({ ...g, list: g.projects.filter(p => !pinnedIds.has(p._id) && byName(p)) })).filter(g => !needle || g.list.length);

	const row = (key: string, icon: ReactNode, label: ReactNode, onPick?: () => void, href?: string, on?: boolean) => {
		const inner = (
			<Flex align='center' gap={3} px={3} h='46px' borderRadius='md' _active={{ bg: 'bg.muted' }}>
				<Box color='fg.muted' flexShrink={0}>{icon}</Box>
				<Text flex={1} minW={0} fontSize='15px' truncate>{label}</Text>
				{on && <Check size={16} />}
			</Flex>
		);
		return href ? (
			<Link key={key} href={href} onClick={() => setSheet(false)}>{inner}</Link>
		) : (
			<Box key={key} as='button' w='full' textAlign='left' onClick={() => { setSheet(false); onPick?.(); }}>{inner}</Box>
		);
	};

	return (
		<>
		<Flex
			as='button'
			display={{ base: 'flex', md: 'none' }}
			aria-label='Switch project or organization'
			align='center'
			justify='center'
			boxSize='32px'
			borderRadius='full'
			borderWidth='1px'
			borderColor='border'
			bg='bg.panel'
			onClick={() => setSheet(true)}>
			{project ? project.type === 'website' ? <Globe size={13} /> : <LayoutGrid size={13} /> : <Building2 size={13} />}
		</Flex>
		<Drawer.Root lazyMount unmountOnExit open={sheet} onOpenChange={d => { setSheet(d.open); if (!d.open) setFind(''); }} placement='bottom'>
			<Portal>
				<Drawer.Backdrop />
				<Drawer.Positioner>
					<DrawerContentContainer>
						<Drawer.Header px={4} pt={4} pb={3} gap={1} flexDir='column' alignItems='flex-start' borderBottomWidth='1px' borderColor='border.muted'>
							<Drawer.Title fontWeight='600' fontSize='16px' letterSpacing='-0.01em' lineHeight='1.4' pr={8}>{project ? project.name : organization.name}</Drawer.Title>
						</Drawer.Header>
						<Drawer.Body px={2} pb='max(20px, env(safe-area-inset-bottom))' overflowY='auto'>
							<Flex align='center' gap={2} mx={2} mt={1} mb={2} px={3} h='40px' borderWidth='1px' borderColor='border' borderRadius='md' color='fg.muted'>
								<Search size={15} />
								<Input
									size='sm'
									variant='flushed'
									border='none'
									h='full'
									px={0}
									color='fg'
									css={{ '--focus-color': 'transparent' }}
									aria-label='Search projects'
									placeholder='Search projects'
									value={find}
									onChange={e => setFind(e.target.value)}
								/>
								{find && (
									<IconButton aria-label='Clear' size='xs' variant='ghost' onClick={() => setFind('')}>
										<X size={14} />
									</IconButton>
								)}
							</Flex>
							{!!pinnedHere.length && (
								<Box>
									<Text {...groupCss}>Pinned</Text>
									{pinnedHere.map(p => row(`pin-${p._id}`, <Pin size={18} />, p.name, () => p._id !== project?._id && open(organization._id, p.publicSlug), undefined, p._id === project?._id))}
								</Box>
							)}
							{shown.map(g => (
								<Box key={g._id}>
									<Text {...groupCss}>{g.name}{g.guest ? ' · Invited' : ''}</Text>
									{g.list.length ? (
										g.list.map(p =>
											row(p._id, p.type === 'website' ? <Globe size={18} /> : <LayoutGrid size={18} />, p.name, () => p._id !== project?._id && open(g._id, p.publicSlug), undefined, p._id === project?._id),
										)
									) : (
										<Text px={3} py={2} fontSize='13px' color='fg.muted'>{find ? 'No match' : 'No projects yet'}</Text>
									)}
								</Box>
							))}
							{!find && <Box borderTopWidth='1px' borderColor='border.muted' my={2} />}
							{row('all', <FolderKanban size={18} />, 'All projects', undefined, '/projects')}
							{!find && (
								<>
									<Box borderTopWidth='1px' borderColor='border.muted' my={2} />
									<Text {...groupCss}>Organization</Text>
									{row(`org-${organization._id}`, <Building2 size={18} />, organization.name, undefined, undefined, true)}
									{others.map(o => row(`org-${o._id}`, <Building2 size={18} />, o.name, () => toOrg(o._id)))}
									{row('new-org', <Plus size={18} />, 'New organization', undefined, '/org/new')}
								</>
							)}
						</Drawer.Body>
					</DrawerContentContainer>
				</Drawer.Positioner>
			</Portal>
		</Drawer.Root>
		<Menu.Root positioning={{ placement: 'bottom-end', gutter: 8 }}>
			<Menu.Trigger asChild>
				<Flex
					as='button'
					display={{ base: 'none', md: 'flex' }}
					aria-label='Switch project or organization'
					title={project ? project.name : organization.name}
					align='center'
					justify='center'
					gap={2}
					h='32px'
					// On a phone just the icon; the menu says which project is open.
					w={{ base: '32px', md: 'auto' }}
					maxW={{ base: '32px', md: '260px' }}
					px={{ base: 0, md: 2 }}
					borderRadius={{ base: 'full', md: 'md' }}
					borderWidth='1px'
					borderColor='border'
					bg='bg.panel'
					cursor='pointer'
					_hover={{ bg: 'bg.muted' }}>
					<Center
						boxSize='20px'
						flexShrink={0}
						borderRadius='sm'
						bg={{ base: 'transparent', md: 'bg.muted' }}
						color={{ base: 'inherit', md: 'fg.muted' }}>
						{project ? project.type === 'website' ? <Globe size={13} /> : <LayoutGrid size={13} /> : <Building2 size={13} />}
					</Center>
					<Box
						display={{ base: 'none', md: 'block' }}
						minW={0}
						textAlign='left'>
						<Text
							fontSize='12.5px'
							fontWeight='600'
							lineHeight='1.2'
							truncate>
							{project ? project.name : organization.name}
						</Text>
						{project && (
							<Text
								fontSize='11px'
								lineHeight='1.2'
								color='fg.muted'
								truncate>
								{organization.name}
							</Text>
						)}
					</Box>
					<Box
						display={{ base: 'none', md: 'block' }}
						color='fg.muted'
						flexShrink={0}>
						<ChevronsUpDown size={14} />
					</Box>
				</Flex>
			</Menu.Trigger>

			<MenuContainer
				p='6px'
				gap={0}
				w='264px'
				maxH='min(560px, 75vh)'
				overflowY='auto'
				boxShadow={undefined}>
				<MenuItemStyle compact>
					{groups.map((g, i) => (
						<Box key={g._id}>
							{i > 0 && <Menu.Separator {...separatorCss} />}
							<Flex
								align='baseline'
								justify='space-between'
								gap={2}
								pe={2}>
								<Text
									{...groupCss}
									truncate>
									{g.name}
								</Text>
								{g.guest && (
									<Text
										{...groupCss}
										flexShrink={0}
										textTransform='none'
										letterSpacing='0'
										fontWeight='400'>
										Invited
									</Text>
								)}
							</Flex>
							{g.projects.length ? (
								g.projects.map(p => (
									<CustomMenuItem
										key={p._id}
										value={`project-${p._id}`}
										icon={p.type === 'website' ? <Globe size={15} /> : <LayoutGrid size={15} />}
										onClick={() => p._id !== project?._id && open(g._id, p.publicSlug)}>
										<Flex
											flex={1}
											align='center'
											justify='space-between'
											gap={2}
											minW={0}>
											<Text truncate>{p.name}</Text>
											{p._id === project?._id && <Check size={14} />}
										</Flex>
									</CustomMenuItem>
								))
							) : (
								<Text
									px={2}
									py={1.5}
									fontSize='12.5px'
									color='fg.muted'>
									No projects yet
								</Text>
							)}
						</Box>
					))}
					<Menu.Separator {...separatorCss} />
					<CustomMenuItem
						value='all-projects'
						icon={<FolderKanban size={15} />}
						href='/projects'>
						All projects
					</CustomMenuItem>

					<Menu.Separator {...separatorCss} />

					<Text {...groupCss}>Organization</Text>
					<CustomMenuItem
						value={`org-${organization._id}`}
						icon={<Building2 size={15} />}
						closeOnSelect={false}>
						<Flex
							flex={1}
							align='center'
							justify='space-between'
							gap={2}
							minW={0}>
							<Text truncate>{organization.name}</Text>
							<Check size={14} />
						</Flex>
					</CustomMenuItem>
					{others.map(o => (
						<CustomMenuItem
							key={o._id}
							value={`org-${o._id}`}
							icon={<Building2 size={15} />}
							onClick={() => toOrg(o._id)}>
							<Text truncate>{o.name}</Text>
						</CustomMenuItem>
					))}
					<CustomMenuItem
						value='new-org'
						icon={<Plus size={15} />}
						href='/org/new'>
						New organization
					</CustomMenuItem>
				</MenuItemStyle>
			</MenuContainer>
		</Menu.Root>
		</>
	);
};

const groupCss: any = {
	px: 2,
	pt: 1.5,
	pb: 1,
	fontSize: '11px',
	fontWeight: '600',
	letterSpacing: '0.04em',
	textTransform: 'uppercase',
	color: 'fg.muted',
};

const separatorCss: any = {
	my: '5px',
	mx: '-6px',
	borderColor: 'border.muted',
};

export default WorkspaceSwitcher;
