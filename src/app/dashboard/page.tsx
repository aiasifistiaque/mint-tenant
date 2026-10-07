'use client';

import NextLink from 'next/link';
import { Button, Center, Flex, Grid, Skeleton, Text } from '@chakra-ui/react';
import { LayoutDashboard } from 'lucide-react';

import { Layout, Count, useGetByIdQuery, ShowSum, useGetDashboardQuery } from '@/components/library';
import { DashboardGrid } from '@/components/library/dashboard/widgets';
import { IS_TENANT_PANEL, getProjectSlug, projectHref } from '@/components/library/config/lib/constants/panel';
import ProjectsBoard from '@/components/library/tenant/ProjectsBoard';
import WebsiteOverview from '@/components/library/tenant/WebsiteOverview';
import ApiOverview from '@/components/library/tenant/ApiOverview';
import { useWorkspace } from '@/components/library/tenant';
import FirstSteps from '@/components/library/tenant/FirstSteps';

/**
 * The dashboard: the widgets saved in the dashboard builder (/dashboard-builder),
 * or — until one is saved — the built-in cards below. The super-admin panel
 * shows it at / too; the tenant panel's / is its landing page (panel.ts HOME).
 */
export default function Home() {
	// The tenant panel with no project open: the organization's projects.
	if (IS_TENANT_PANEL && !getProjectSlug())
		return (
			<Layout
				title='Home'
				path='dashboard'>
				<ProjectsBoard welcome />
			</Layout>
		);
	return <Dashboard />;
}

function Dashboard() {
	const { data, isLoading } = useGetDashboardQuery();
	const widgets = data?.widgets || [];
	// A website's home starts with how the site is doing and what's left to set up (WO-34);
	// an API's with its address, endpoints and recent calls (docs/templates T-09).
	const { project } = useWorkspace();
	if (IS_TENANT_PANEL && (project?.type === 'website' || project?.type === 'api'))
		return (
			<Layout
				title='Dashboard'
				path='dashboard'>
				<Firsts />
				{project.type === 'website' ? <WebsiteOverview /> : <ApiOverview />}
				{data?.saved && widgets.length ? (
					<Flex
						direction='column'
						mt={4}>
						<DashboardGrid widgets={widgets} />
					</Flex>
				) : null}
			</Layout>
		);

	return (
		<Layout
			title='Dashboard'
			path='dashboard'>
			{IS_TENANT_PANEL && <Firsts />}
			{isLoading ? (
				<Grid
					pt={3}
					gridTemplateColumns={{ base: '1fr', md: '1fr 1fr 1fr' }}
					gap={2}>
					{[0, 1, 2].map(i => (
						<Skeleton
							key={i}
							h='96px'
						/>
					))}
				</Grid>
			) : data?.saved && widgets.length ? (
				<DashboardGrid widgets={widgets} />
			) : IS_TENANT_PANEL ? (
				<EmptyProjectDashboard />
			) : (
				<BuiltInDashboard />
			)}
		</Layout>
	);
}

/** The organization's first steps, while any are left (FirstSteps renders nothing after). */
const Firsts = () => (
	<Flex
		direction='column'
		mb={4}
		css={{ '&:empty': { display: 'none' } }}>
		<FirstSteps />
	</Flex>
);

/** A tenant project with no dashboard yet: where to make one. */
const EmptyProjectDashboard = () => (
	<Flex
		direction='column'
		align='center'
		textAlign='center'
		gap={2}
		py={16}>
		<Center
			boxSize='44px'
			borderRadius='full'
			bg='bg.muted'
			color='fg.muted'>
			<LayoutDashboard size={20} />
		</Center>
		<Text
			fontSize='14px'
			fontWeight='600'>
			No dashboard yet
		</Text>
		<Text
			fontSize='13px'
			color='fg.muted'
			maxW='380px'>
			Add numbers, charts and recent records from this project’s models.
		</Text>
		<Flex
			gap={2}
			mt={2}>
			<Button
				asChild
				size='sm'
				variant='outline'>
				<NextLink href={projectHref('/get-started')}>Get started</NextLink>
			</Button>
			<Button
				asChild
				size='sm'>
				<NextLink href={projectHref('/dashboard-builder')}>Build the dashboard</NextLink>
			</Button>
		</Flex>
	</Flex>
);

/** The dashboard as it was before the builder — shown until one is saved. */
const BuiltInDashboard = () => {
	const { data, isFetching, isError }: any = useGetByIdQuery({
		path: 'sms/check',
		id: 'balance',
	});

	return (
		<Grid
			pt={3}
			gridTemplateColumns={{ base: '1fr', md: '1fr 1fr 1fr' }}
			gap={2}>
			<Count
				href='/views'
				title='Website views'
				path='views'
			/>

			<ShowSum
				title='SMS Balance'
				isLoading={isFetching}
				isError={isError}>
				BDT. {data?.balance || '--'}
			</ShowSum>

			<Count
				title='Total Stores'
				path='shops'
			/>
			<Count
				title='Total Products'
				path='products'
			/>
			<Count
				title='Total Customers'
				path='customers'
			/>
		</Grid>
	);
};
