'use client';

import { FC, ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { Badge, Box, Flex, Grid, Link, Skeleton, Text } from '@chakra-ui/react';
import { FileText, MousePointerClick, Zap } from 'lucide-react';
import { Layout, useGetAnalyticsVisitorQuery } from '@/components/library';
import { CopyValue, Crumbs, DetailRow, ErrorState, Panel, dateTime } from '@/components/library/cl';
import GuideLink from '@/components/library/tenant/GuideLink';
import { projectHref } from '@/components/library/config/lib/constants/panel';
import type { AnalyticsStep, AnalyticsVisit, AnalyticsVisitor } from '@/components/library/store/services/tenantApi';
import { AD_NETWORK, deviceLine, duration, flag, number, placeLine, sourceLine, time, visitorName } from '../../_components/format';

/**
 * One visitor of a website project (docs/multi-tenancy WO-56): who they are
 * when the site knows, where they are and on what network, what they use,
 * how they first arrived — and their journey: every visit, newest first, page
 * by page with the time spent and how far they scrolled, and the clicks and
 * events between the pages.
 */

const Facts: FC<{ title: string; children: ReactNode }> = ({ title, children }) => (
	<Panel title={title}>
		<Flex
			direction='column'
			gap={2.5}>
			{children}
		</Flex>
	</Panel>
);

const Who: FC<{ v: AnalyticsVisitor }> = ({ v }) => (
	<Facts title='Who'>
		<DetailRow
			label='Name'
			value={v.name}
		/>
		<DetailRow
			label='Email'
			value={v.email ? <CopyValue value={v.email} /> : undefined}
		/>
		<DetailRow
			label='Signed in'
			value={v.customer ? 'Yes — a customer of the site' : v.userId ? 'Named by the site (MintAnalytics.identify)' : 'Not that we know'}
		/>
		{v.userId && (
			<DetailRow
				label='Site’s user id'
				value={<CopyValue value={v.userId} />}
			/>
		)}
		<DetailRow
			label='Visitor id'
			value={<CopyValue value={v.visitorId} />}
		/>
		<DetailRow
			label='First seen'
			value={dateTime(v.firstSeen)}
		/>
		<DetailRow
			label='Last seen'
			value={dateTime(v.lastSeen)}
		/>
		<DetailRow
			label='Visits · pages'
			value={`${number(v.visits || 0)} · ${number(v.pageviews || 0)}`}
		/>
	</Facts>
);

const Where: FC<{ v: AnalyticsVisitor }> = ({ v }) => {
	const p = v.place || {};
	const map = typeof p.lat === 'number' && typeof p.lng === 'number' ? `https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lng}#map=10/${p.lat}/${p.lng}` : '';
	return (
		<Facts title='Where'>
			<DetailRow
				label='IP address'
				value={p.ip ? <CopyValue value={p.ip} /> : 'Not kept (Site setup → Tracking)'}
			/>
			<DetailRow
				label='Internet provider'
				value={p.isp}
			/>
			<DetailRow
				label='Network'
				value={[p.org && p.org !== p.isp ? p.org : '', p.asn ? `AS${p.asn}` : ''].filter(Boolean).join(' · ')}
			/>
			<DetailRow
				label='Place'
				value={
					placeLine(p) ? (
						<Flex
							gap={2}
							align='baseline'
							wrap='wrap'>
							<Text fontSize='13px'>{[placeLine(p), p.region && p.region !== p.city ? `(${p.region})` : ''].filter(Boolean).join(' ')}</Text>
							{map && (
								<Link
									href={map}
									target='_blank'
									rel='noreferrer'
									fontSize='12px'
									color='fg.muted'>
									Map ↗
								</Link>
							)}
						</Flex>
					) : undefined
				}
			/>
			<DetailRow
				label='Timezone'
				value={p.timezone}
			/>
			<Text
				fontSize='11.5px'
				color='fg.muted'>
				The place comes from the IP address — about the city, not the street; a VPN shows the VPN’s.
			</Text>
		</Facts>
	);
};

const What: FC<{ v: AnalyticsVisitor }> = ({ v }) => (
	<Facts title='On what'>
		<DetailRow
			label='Device'
			value={v.device ? v.device[0].toUpperCase() + v.device.slice(1) : undefined}
		/>
		<DetailRow
			label='Model'
			value={v.deviceModel}
		/>
		<DetailRow
			label='Browser · system'
			value={[v.browser, v.os].filter(Boolean).join(' · ')}
		/>
		<DetailRow
			label='Screen'
			value={v.screen?.replace('x', ' × ')}
		/>
		<DetailRow
			label='Language'
			value={v.language}
		/>
	</Facts>
);

const Arrival: FC<{ v: AnalyticsVisitor }> = ({ v }) => {
	const f = v.first || {};
	return (
		<Facts title='How they first arrived'>
			<DetailRow
				label='Came from'
				value={sourceLine(f.channel, f.source)}
			/>
			<DetailRow
				label='Referring page'
				value={f.referrer}
			/>
			<DetailRow
				label='Landing page'
				value={f.landing}
			/>
			<DetailRow
				label='Campaign'
				value={[f.utmCampaign, f.utmSource, f.utmMedium].filter(Boolean).join(' · ')}
			/>
			<DetailRow
				label='Ad click'
				value={f.clickId ? AD_NETWORK[f.clickId] || f.clickId : undefined}
			/>
			<DetailRow
				label='Latest visit from'
				value={sourceLine(v.lastChannel, v.lastSource)}
			/>
		</Facts>
	);
};

const ICON = { pageview: FileText, click: MousePointerClick, event: Zap };

const StepLine: FC<{ step: AnalyticsStep }> = ({ step }) => {
	const Icon = ICON[step.type] || Zap;
	const read = [step.duration ? duration(step.duration) : '', typeof step.scroll === 'number' ? `${step.scroll}% read` : ''].filter(Boolean).join(' · ');
	const props = step.props ? Object.entries(step.props).map(([k, v]) => `${k}: ${v}`).join(' · ') : '';
	return (
		<Flex
			gap={3}
			align='flex-start'
			py={2}>
			<Text
				fontSize='11.5px'
				color='fg.muted'
				fontFamily='mono'
				w='62px'
				flexShrink={0}
				pt='1px'>
				{time(step.at)}
			</Text>
			<Box
				color={step.type === 'pageview' ? 'fg' : 'fg.muted'}
				pt='2px'
				flexShrink={0}>
				<Icon size={14} />
			</Box>
			<Box
				flex='1'
				minW={0}>
				{step.type === 'pageview' ? (
					<>
						<Text
							fontSize='13px'
							fontFamily='mono'
							truncate>
							{step.path || '/'}
						</Text>
						{step.title && (
							<Text
								fontSize='11.5px'
								color='fg.muted'
								truncate>
								{step.title}
							</Text>
						)}
						{read && (
							// On a phone the time on the page goes under it, so the path keeps the width.
							<Text
								display={{ base: 'block', md: 'none' }}
								fontSize='11.5px'
								color='fg.muted'>
								{read}
							</Text>
						)}
					</>
				) : step.type === 'click' ? (
					<Text
						fontSize='13px'
						truncate>
						Clicked “{step.name || step.element?.text || 'a link'}”
						{step.element?.href && (
							<Box
								as='span'
								color='fg.muted'
								fontSize='inherit'>
								{' '}
								→ {step.element.href}
							</Box>
						)}
					</Text>
				) : (
					<Text
						fontSize='13px'
						truncate>
						{step.name}
						{props && (
							<Box
								as='span'
								color='fg.muted'
								fontSize='inherit'>
								{' '}
								— {props}
							</Box>
						)}
					</Text>
				)}
			</Box>
			{step.type === 'pageview' && read && (
				<Text
					display={{ base: 'none', md: 'block' }}
					fontSize='11.5px'
					color='fg.muted'
					whiteSpace='nowrap'
					textAlign='right'>
					{read}
				</Text>
			)}
		</Flex>
	);
};

const Visit: FC<{ visit: AnalyticsVisit; n: number }> = ({ visit, n }) => (
	<Box
		borderWidth='1px'
		borderColor='border.muted'
		borderRadius='lg'>
		<Flex
			px={4}
			py={3}
			gap={2}
			wrap='wrap'
			align='baseline'
			justify='space-between'
			borderBottomWidth='1px'
			borderColor='border.muted'>
			<Box>
				<Text
					fontSize='13px'
					fontWeight='600'>
					Visit {n} · {dateTime(visit.start)}
				</Text>
				<Text
					fontSize='11.5px'
					color='fg.muted'>
					{[
						sourceLine(visit.channel, visit.source) || 'Source unknown',
						visit.utmCampaign ? `campaign ${visit.utmCampaign}` : '',
						[flag(visit.countryCode), visit.city || visit.country].filter(Boolean).join(' '),
						visit.isp,
						visit.ip,
					]
						.filter(Boolean)
						.join(' · ')}
				</Text>
			</Box>
			<Flex
				gap={2}
				align='center'>
				<Badge
					size='sm'
					variant='surface'>
					{visit.pageviews} {visit.pageviews === 1 ? 'page' : 'pages'}
				</Badge>
				<Badge
					size='sm'
					variant='surface'>
					{duration(visit.duration)}
				</Badge>
			</Flex>
		</Flex>
		<Box
			px={4}
			py={1}>
			{visit.steps.map((s, i) => (
				<Box
					key={`${s.at}-${i}`}
					borderTopWidth={i ? '1px' : 0}
					borderColor='border.muted'>
					<StepLine step={s} />
				</Box>
			))}
		</Box>
	</Box>
);

export default function VisitorPage() {
	const { visitorId } = useParams<{ visitorId: string }>();
	const id = decodeURIComponent(visitorId || '');
	const { data, isLoading, isError, error, refetch } = useGetAnalyticsVisitorQuery(id, { skip: !id });
	const v = data?.visitor;
	const name = v ? visitorName(v) : 'Visitor';

	return (
		<Layout
			title={name}
			path='analytics'>
			<Flex
				direction='column'
				gap={4}
				pt={2}>
				<Crumbs
					data={[
						{ href: projectHref('/analytics'), title: 'Analytics' },
						{ href: projectHref('/analytics?tab=visitors'), title: 'Visitors' },
						{ href: '', title: name },
					]}
				/>
				{isError ? (
					<ErrorState
						error={error}
						onRetry={refetch}
					/>
				) : isLoading || !v ? (
					<Skeleton h='420px' />
				) : (
					<>
						<Flex
							align='center'
							justify='space-between'
							gap={3}
							wrap='wrap'>
							<Box minW={0}>
								<Flex
									align='center'
									gap={2}>
									<Text
										fontSize='18px'
										fontWeight='600'
										truncate>
										{name}
									</Text>
									{v.customer && (
										<Badge
											size='sm'
											colorPalette='green'>
											Customer
										</Badge>
									)}
								</Flex>
								<Text
									fontSize='12.5px'
									color='fg.muted'>
									{[placeLine(v.place), v.place?.isp, deviceLine(v)].filter(Boolean).join(' · ')}
								</Text>
							</Box>
							<GuideLink section='journey' />
						</Flex>
						<Grid
							templateColumns={{ base: '1fr', lg: '1fr 1fr' }}
							gap={4}>
							<Who v={v} />
							<Where v={v} />
							<What v={v} />
							<Arrival v={v} />
						</Grid>
						<Panel
							title='Journey'
							subtitle={`${data.visits.length} ${data.visits.length === 1 ? 'visit' : 'visits'}, newest first — every page in order, with the time on it and how far it was read${data.truncated ? ' (the latest 2,000 steps)' : ''}`}>
							<Flex
								direction='column'
								gap={3}>
								{data.visits.map((visit, i) => (
									<Visit
										key={visit.sessionId}
										visit={visit}
										n={data.visits.length - i}
									/>
								))}
							</Flex>
						</Panel>
					</>
				)}
			</Flex>
		</Layout>
	);
}
