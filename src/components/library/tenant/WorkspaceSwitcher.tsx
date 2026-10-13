'use client';

import { FC } from 'react';
import { Box, Center, Flex, Menu, Text } from '@chakra-ui/react';
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

	return (
		<Menu.Root positioning={{ placement: 'bottom-end', gutter: 8 }}>
			<Menu.Trigger asChild>
				<Flex
					as='button'
					aria-label='Switch project or organization'
					align='center'
					gap={2}
					h='32px'
					maxW={{ base: '150px', md: '260px' }}
					px={2}
					borderRadius='md'
					borderWidth='1px'
					borderColor='border'
					bg='bg.panel'
					cursor='pointer'
					_hover={{ bg: 'bg.muted' }}>
					<Center
						boxSize='20px'
						flexShrink={0}
						borderRadius='sm'
						bg='bg.muted'
						color='fg.muted'>
						{project ? project.type === 'website' ? <Globe size={13} /> : <LayoutGrid size={13} /> : <Building2 size={13} />}
					</Center>
					<Box
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
								display={{ base: 'none', md: 'block' }}
								fontSize='11px'
								lineHeight='1.2'
								color='fg.muted'
								truncate>
								{organization.name}
							</Text>
						)}
					</Box>
					<Box
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
