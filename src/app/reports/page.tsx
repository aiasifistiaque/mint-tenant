'use client';

import { Badge, Box, Button, Flex, Grid, Skeleton, Text } from '@chakra-ui/react';
import NextLink from 'next/link';
import { Download, List, Plus } from 'lucide-react';
import { KIND, describe } from './_components/kinds';
import { Layout } from '@/components/library';
import { EmptyState, Panel } from '@/components/library/cl';
import { projectHref } from '@/components/library/config/lib/constants/panel';
import { useGetSavedReportsQuery } from '@/components/library/store/services/tenantApi';
import type { SavedReport } from '@/components/library/store/services/tenantApi';

/**
 * Reports (backend docs/panel-users RP-03): the project's saved reports this
 * reader can open, by category. Developers (Build) make and change them; panel
 * users see those on the tables their role can view, and download them where
 * the report allows it and their role has Download reports.
 */


const Card = ({ r }: { r: SavedReport }) => {
	const Icon = KIND[r.type]?.icon || List;
	return (
		<NextLink href={projectHref(`/reports/${r._id}`)}>
			<Flex
				data-testid='report-card'
				gap={3}
				p={4}
				h='100%'
				borderWidth='1px'
				borderColor='border'
				borderRadius='lg'
				bg='bg.panel'
				_hover={{ borderColor: 'border.emphasized', bg: 'bg.subtle' }}>
				<Flex
					align='center'
					justify='center'
					boxSize='36px'
					borderRadius='md'
					bg='bg.muted'
					color='fg.muted'
					flexShrink={0}>
					<Icon size={17} />
				</Flex>
				<Box minW={0}>
					<Text
						fontSize='14px'
						fontWeight='600'>
						{r.name}
					</Text>
					<Text
						fontSize='12.5px'
						color='fg.muted'
						lineClamp={2}>
						{r.description || describe(r)}
					</Text>
					<Flex
						gap={1.5}
						mt={2}
						wrap='wrap'>
						<Badge size='sm'>{r.model}</Badge>
						{r.canDownload && (
							<Badge
								size='sm'
								colorPalette='green'>
								<Download size={10} /> {r.formats.map(f => (f === 'xlsx' ? 'Excel' : f.toUpperCase())).join(' · ')}
							</Badge>
						)}
					</Flex>
				</Box>
			</Flex>
		</NextLink>
	);
};

export default function ReportsPage() {
	const { data, isLoading, isError } = useGetSavedReportsQuery();
	const groups = new Map<string, SavedReport[]>();
	for (const r of data?.doc || []) groups.set(r.category || 'Reports', [...(groups.get(r.category || 'Reports') || []), r]);

	return (
		<Layout
			title='Reports'
			path='reports'>
			<Flex
				direction='column'
				gap={4}
				pt={2}>
				{isError ? (
					<EmptyState
						title='Reports aren’t available'
						description='Your role may not open reports, or they arrive with the next update of MINT.'
					/>
				) : isLoading || !data ? (
					<Skeleton h='240px' />
				) : !data.doc.length ? (
					<EmptyState
						title='No reports yet'
						description={data.canBuild ? 'Make one: a list of records with totals, a summary by a field, or totals per month.' : 'Your project’s developers make them.'}
						action={
							data.canBuild ? (
								<Button
									asChild
									size='sm'>
									<NextLink href={projectHref('/reports/new')}>
										<Plus size={14} /> New report
									</NextLink>
								</Button>
							) : undefined
						}
					/>
				) : (
					<Panel
						id='reports'
						title='Reports'
						subtitle='Open one to pick the dates, see its rows and totals, and download it.'
						actions={
							data.canBuild && (
								<Button
									asChild
									size='sm'>
									<NextLink href={projectHref('/reports/new')}>
										<Plus size={14} /> New report
									</NextLink>
								</Button>
							)
						}>
						<Flex
							direction='column'
							gap={5}>
							{[...groups].map(([name, list]) => (
								<Box key={name}>
									<Text
										fontSize='12px'
										fontWeight='600'
										textTransform='uppercase'
										letterSpacing='0.04em'
										color='fg.muted'
										mb={2}>
										{name}
									</Text>
									<Grid
										templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }}
										gap={3}>
										{list.map(r => (
											<Card
												key={r._id}
												r={r}
											/>
										))}
									</Grid>
								</Box>
							))}
						</Flex>
					</Panel>
				)}
			</Flex>
		</Layout>
	);
}
