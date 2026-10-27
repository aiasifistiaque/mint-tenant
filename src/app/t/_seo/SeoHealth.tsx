'use client';

import { FC, useState } from 'react';
import Link from 'next/link';
import { Badge, Box, Button, Flex, Skeleton, Text } from '@chakra-ui/react';
import { ChevronDown, ChevronRight, CircleAlert, CircleCheck, CircleX, Info, RefreshCw } from 'lucide-react';
import { useGetSeoHealthQuery, type SeoHealth as Health, type SeoHealthLevel } from '@/components/library/store/services/tenantApi';
import { DOCS_URL, createPath, projectHref } from '@/components/library/config/lib/constants/panel';

/**
 * Website → SEO's health card (backend docs/seo SEO-03): the site's SEO
 * problems across its published pages — the same title or focus keyword on
 * two pages, hidden pages in the menu, canonicals pointing nowhere — and each
 * page's gaps. Each problem lists its pages, linked to their SEO.
 */

const LEVEL: Record<SeoHealthLevel, { color: string; palette: string; icon: typeof CircleX; word: [string, string] }> = {
	error: { color: 'red.fg', palette: 'red', icon: CircleX, word: ['error', 'errors'] },
	warning: { color: 'orange.fg', palette: 'orange', icon: CircleAlert, word: ['warning', 'warnings'] },
	notice: { color: 'fg.muted', palette: 'gray', icon: Info, word: ['notice', 'notices'] },
};

type Group = Health['groups'][number];

const PageRow: FC<{ p: Group['pages'][number] }> = ({ p }) => (
	<Flex
		as={Link}
		{...{ href: p.seo ? projectHref(`/view/seo/${p.seo}`) : createPath('seo') }}
		gap={3}
		px={3}
		py={1.5}
		borderRadius='sm'
		align='baseline'
		_hover={{ bg: 'bg.muted' }}
		minW={0}>
		<Text
			fontSize='12.5px'
			fontWeight='500'
			flexShrink={0}>
			{p.name}
		</Text>
		<Text
			fontSize='12px'
			color='fg.muted'
			fontFamily='mono'
			flexShrink={0}>
			{p.path}
		</Text>
		{p.detail && (
			<Text
				fontSize='12px'
				color='fg.muted'
				truncate
				minW={0}>
				{p.detail}
			</Text>
		)}
	</Flex>
);

const GroupRow: FC<{ g: Group; open: boolean; onToggle: () => void }> = ({ g, open, onToggle }) => {
	const l = LEVEL[g.level];
	const Icon = l.icon;
	const Chevron = open ? ChevronDown : ChevronRight;
	return (
		<Box
			borderTopWidth='1px'
			borderColor='border.muted'>
			<Flex
				as='button'
				w='full'
				textAlign='left'
				gap={3}
				px={4}
				py={3}
				align='flex-start'
				cursor={g.pages.length ? 'pointer' : 'default'}
				onClick={g.pages.length ? onToggle : undefined}
				{...{ type: 'button', 'aria-expanded': g.pages.length ? open : undefined }}>
				<Box
					color={l.color}
					mt='1px'
					flexShrink={0}>
					<Icon size={16} />
				</Box>
				<Box
					flex={1}
					minW={0}>
					<Flex
						gap={2}
						align='center'
						wrap='wrap'>
						<Text
							fontSize='13px'
							fontWeight='600'>
							{g.label}
						</Text>
						{g.pages.length > 0 && (
							<Badge
								size='sm'
								variant='subtle'
								colorPalette={l.palette}>
								{g.pages.length} {g.pages.length === 1 ? 'page' : 'pages'}
							</Badge>
						)}
					</Flex>
					<Text
						fontSize='12px'
						color='fg.muted'
						mt={0.5}>
						{g.advice}
					</Text>
				</Box>
				{g.pages.length > 0 && (
					<Box
						color='fg.muted'
						flexShrink={0}>
						<Chevron size={16} />
					</Box>
				)}
			</Flex>
			{open && g.pages.length > 0 && (
				<Box
					pl={9}
					pr={3}
					pb={3}>
					{g.pages.map(p => (
						<PageRow
							key={`${g.key}-${p.page}`}
							p={p}
						/>
					))}
				</Box>
			)}
		</Box>
	);
};

const SeoHealth: FC = () => {
	const { data, isLoading, isFetching, isError, refetch } = useGetSeoHealthQuery();
	const [open, setOpen] = useState<Record<string, boolean>>({});
	const toggle = (key: string) => setOpen(o => ({ ...o, [key]: !(o[key] ?? key === data?.groups[0]?.key) }));
	const isOpen = (key: string) => open[key] ?? key === data?.groups[0]?.key;
	const counts = (['error', 'warning', 'notice'] as const).filter(l => data?.counts[l]);

	return (
		<Box
			id='seo-health'
			borderWidth='1px'
			borderColor='border'
			borderRadius='md'
			overflow='hidden'
			mb={2}>
			<Flex
				px={4}
				py={3}
				gap={3}
				align='center'
				wrap='wrap'>
				<Box
					flex={1}
					minW='200px'>
					<Text
						fontSize='14px'
						fontWeight='600'>
						Site SEO health
					</Text>
					<Text
						fontSize='12px'
						color='fg.muted'>
						{!data
							? 'Problems across your published pages. '
							: data.checked
							? `${data.checked} published ${data.checked === 1 ? 'page' : 'pages'} checked together. `
							: 'No published pages yet — publish the site, or set a page’s status to Published on Website → Pages. '}
						<Box
							as='a'
							fontSize='inherit'
							textDecoration='underline'
							{...{ href: `${DOCS_URL}/websites#seo-health`, target: '_blank', rel: 'noreferrer' }}>
							What each problem means
						</Box>
					</Text>
				</Box>
				<Flex
					gap={1.5}
					align='center'>
					{data && data.checked > 0 && !counts.length && (
						<Badge
							size='sm'
							variant='subtle'
							colorPalette='green'>
							<CircleCheck size={12} /> No problems found
						</Badge>
					)}
					{counts.map(l => (
						<Badge
							key={l}
							size='sm'
							variant='subtle'
							colorPalette={LEVEL[l].palette}>
							{data!.counts[l]} {LEVEL[l].word[data!.counts[l] === 1 ? 0 : 1]}
						</Badge>
					))}
					<Button
						size='xs'
						variant='ghost'
						aria-label='Check again'
						loading={isFetching}
						onClick={() => refetch()}>
						<RefreshCw size={13} />
					</Button>
				</Flex>
			</Flex>
			{isLoading && (
				<Box
					px={4}
					pb={3}>
					<Skeleton h='40px' />
				</Box>
			)}
			{isError && (
				<Text
					px={4}
					pb={3}
					fontSize='12.5px'
					color='red.fg'>
					Couldn’t check the site’s SEO — try again.
				</Text>
			)}
			{data?.groups.map(g => (
				<GroupRow
					key={g.key}
					g={g}
					open={isOpen(g.key)}
					onToggle={() => toggle(g.key)}
				/>
			))}
		</Box>
	);
};

export default SeoHealth;
