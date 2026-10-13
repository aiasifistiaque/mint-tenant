'use client';

import { FC } from 'react';
import { Box, Center, Flex, Grid, Text } from '@chakra-ui/react';
import { Globe, LayoutGrid, PlugZap } from 'lucide-react';
import { Panel } from '../cl';
import type { OrgRef, ProjectRef } from '../store/services/tenantApi';
import { useOpenAnyProject, useWorkspace } from './useWorkspace';
import GuideLink from './GuideLink';
import { GLYPH, TONES, Tone } from '@/theme/tones';

/** Each kind's icon and colour, as on the project cards. */
const KIND: Record<string, { label: string; icon: any; tone: Tone }> = {
	app: { label: 'App', icon: LayoutGrid, tone: 'emerald' },
	website: { label: 'Website', icon: Globe, tone: 'sky' },
	api: { label: 'API', icon: PlugZap, tone: 'violet' },
};

/** One project of another organization: opening it switches there first. */
const Card: FC<{ org: OrgRef; project: ProjectRef }> = ({ org, project }) => {
	const { open, opening } = useOpenAnyProject();
	const kind = KIND[project.type] || KIND.app;
	const Icon = kind.icon;
	return (
		<Flex
			as='button'
			// @ts-ignore — Flex as button
			type='button'
			onClick={() => open(org._id, project.publicSlug)}
			aria-busy={opening === org._id}
			direction='column'
			align='flex-start'
			gap={3}
			p={4}
			minW={0}
			textAlign='left'
			borderWidth='1px'
			borderColor='border'
			borderRadius='2xl'
			bg='bg.panel'
			cursor='pointer'
			opacity={opening === org._id ? 0.6 : 1}
			transition='border-color .12s ease'
			_hover={{ borderColor: 'border.emphasized' }}>
			<Center
				{...GLYPH}
				boxSize='36px'
				borderRadius='10px'
				color={TONES[kind.tone].fg}>
				<Icon size={18} />
			</Center>
			<Box minW={0}>
				<Text
					fontSize='14px'
					fontWeight='600'
					truncate>
					{project.name}
				</Text>
				<Text
					fontSize='12.5px'
					color='fg.muted'
					lineClamp={2}
					minH='2lh'>
					{project.description || kind.label}
				</Text>
			</Box>
			<Text
				fontSize='12px'
				color='fg.muted'>
				{kind.label} · {org.name}
			</Text>
		</Flex>
	);
};

/**
 * The projects this account opens in its other organizations (WO-47), each
 * organization under its own name — a project someone invited it to shows up
 * here, under the inviter's organization. Opening one switches to that
 * organization.
 */
const OtherOrgProjects: FC = () => {
	const { organization, organizations } = useWorkspace();
	const others = organizations.filter(o => o._id !== organization?._id && o.projects?.length);
	if (!others.length) return null;
	return (
		<>
			{others.map(org => (
				<Panel
					key={org._id}
					title={org.name}
					subtitle={org.guest ? 'Projects you were invited to' : `Your projects here, as ${org.role || 'a member'}`}
					actions={<GuideLink section='project-people' />}>
					<Grid
						templateColumns='repeat(auto-fill, minmax(240px, 1fr))'
						gap={3}>
						{(org.projects || []).map(p => (
							<Card
								key={p._id}
								org={org}
								project={p}
							/>
						))}
					</Grid>
				</Panel>
			))}
		</>
	);
};

export default OtherOrgProjects;
