'use client';

import { FC } from 'react';
import { Box, Checkbox, Flex, SegmentGroup, Text } from '@chakra-ui/react';
import { Globe, LayoutGrid } from 'lucide-react';
import { useGetProjectsQuery } from '../store';
import type { ProjectAccess } from '../store/services/tenantApi';

/**
 * Which projects a member — or the person invited — can open (WO-22): every
 * project of the organization, new ones included, or only the ones ticked.
 * Owner and Admin always open every project; `everything` says so instead of
 * offering a choice. Used by the invite dialog and the members list.
 */
const ProjectAccessPicker: FC<{ value: ProjectAccess; onChange: (v: ProjectAccess) => void; everything?: boolean; disabled?: boolean }> = ({
	value,
	onChange,
	everything,
	disabled,
}) => {
	const { data } = useGetProjectsQuery();
	const projects = data?.doc || [];

	if (everything)
		return (
			<Text
				fontSize='12.5px'
				color='fg.muted'>
				Owner and Admin open every project.
			</Text>
		);

	const toggle = (id: string) =>
		onChange({ allProjects: false, projects: value.projects.includes(id) ? value.projects.filter(p => p !== id) : [...value.projects, id] });

	return (
		<Flex
			direction='column'
			gap={2.5}>
			<SegmentGroup.Root
				size='sm'
				value={value.allProjects ? 'all' : 'some'}
				disabled={disabled}
				onValueChange={d => onChange({ allProjects: d.value === 'all', projects: value.projects })}
				w='fit-content'>
				<SegmentGroup.Indicator />
				<SegmentGroup.Items
					items={[
						{ value: 'all', label: 'All projects' },
						{ value: 'some', label: 'Only these' },
					]}
				/>
			</SegmentGroup.Root>
			{value.allProjects ? (
				<Text
					fontSize='12.5px'
					color='fg.muted'>
					Every project, including ones made later.
				</Text>
			) : projects.length ? (
				<Box
					borderWidth='1px'
					borderColor='border'
					borderRadius='md'
					maxH='220px'
					overflowY='auto'>
					{projects.map(p => (
						<Checkbox.Root
							key={p._id}
							size='sm'
							w='full'
							px={3}
							py={2}
							borderTopWidth='1px'
							borderColor='border.muted'
							_first={{ borderTopWidth: 0 }}
							disabled={disabled}
							checked={value.projects.includes(p._id)}
							onCheckedChange={() => toggle(p._id)}>
							<Checkbox.HiddenInput />
							<Checkbox.Control />
							<Checkbox.Label
								display='flex'
								alignItems='center'
								gap={2}
								fontSize='13px'>
								<Box color='fg.muted'>{p.type === 'website' ? <Globe size={14} /> : <LayoutGrid size={14} />}</Box>
								{p.name}
							</Checkbox.Label>
						</Checkbox.Root>
					))}
				</Box>
			) : (
				<Text
					fontSize='12.5px'
					color='fg.muted'>
					No projects yet.
				</Text>
			)}
			{!value.allProjects && !value.projects.length && projects.length > 0 && (
				<Text
					fontSize='12px'
					color='orange.fg'>
					With no project ticked they’ll only see the organization’s pages.
				</Text>
			)}
		</Flex>
	);
};

/** "All projects" or "2 projects: Shop, Blog" — for a list row. */
export const accessSummary = (access: ProjectAccess, names: Map<string, string>) => {
	if (access.allProjects) return 'All projects';
	const list = access.projects.map(id => names.get(id)).filter(Boolean) as string[];
	if (!list.length) return 'No projects';
	return `${list.length} project${list.length === 1 ? '' : 's'}: ${list.join(', ')}`;
};

export default ProjectAccessPicker;
