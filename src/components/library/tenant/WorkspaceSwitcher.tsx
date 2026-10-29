'use client';

import { FC, ReactNode, useState } from 'react';
import { Box, Center, Drawer, Flex, Menu, Portal, Text } from '@chakra-ui/react';
import Link from 'next/link';
import { Check, ChevronsUpDown, FolderKanban, Globe, LayoutGrid, Plus, Building2 } from 'lucide-react';
import CustomMenuItem, { MenuItemStyle } from '../menu/CustomMenuItem';
import { MenuContainer } from '../menu';
import { useAppDispatch } from '../hooks';
import { refreshAuth, useSwitchOrganizationMutation } from '../store';
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
		<Drawer.Root open={sheet} onOpenChange={d => setSheet(d.open)} placement='bottom'>
			<Portal>
				<Drawer.Backdrop />
				<Drawer.Positioner>
					<Drawer.Content borderTopRadius='xl' maxH='80vh'>
						<Drawer.Header pb={1}>
							<Drawer.Title fontSize='15px'>{project ? project.name : organization.name}</Drawer.Title>
						</Drawer.Header>
						<Drawer.Body px={2} pb={6}>
							{groups.map(g => (
								<Box key={g._id}>
									<Text {...groupCss}>{g.name}{g.guest ? ' · Invited' : ''}</Text>
									{g.projects.length ? (
										g.projects.map(p =>
											row(p._id, p.type === 'website' ? <Globe size={18} /> : <LayoutGrid size={18} />, p.name, () => p._id !== project?._id && open(g._id, p.publicSlug), undefined, p._id === project?._id),
										)
									) : (
										<Text px={3} py={2} fontSize='13px' color='fg.muted'>No projects yet</Text>
									)}
								</Box>
							))}
							<Box borderTopWidth='1px' borderColor='border.muted' my={2} />
							{row('all', <FolderKanban size={18} />, 'All projects', undefined, '/projects')}
							<Box borderTopWidth='1px' borderColor='border.muted' my={2} />
							<Text {...groupCss}>Organization</Text>
							{row(`org-${organization._id}`, <Building2 size={18} />, organization.name, undefined, undefined, true)}
							{others.map(o => row(`org-${o._id}`, <Building2 size={18} />, o.name, () => toOrg(o._id)))}
							{row('new-org', <Plus size={18} />, 'New organization', undefined, '/org/new')}
						</Drawer.Body>
					</Drawer.Content>
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
