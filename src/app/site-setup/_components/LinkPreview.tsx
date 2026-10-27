'use client';

import { FC, FormEvent, ReactNode, useEffect, useRef, useState } from 'react';
import NextLink from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Badge, Box, Button, Flex, Grid, Input, Text } from '@chakra-ui/react';
import { CircleAlert, CircleCheck, CircleX, Info, PenLine } from 'lucide-react';
import moment from 'moment';
import GuideLink from '@/components/library/tenant/GuideLink';
import { createPath, projectHref } from '@/components/library/config/lib/constants/panel';
import { useCheckLinkPreviewMutation, type LinkPreview, type PreviewApp, type PreviewLevel, type SiteConfig } from '@/components/library/store/services/tenantApi';
import { errorText } from './parts';

/**
 * Site setup → Link previews (backend docs/seo SEO-14): type any address and
 * see the card Facebook, LinkedIn, WhatsApp, X and Slack show when it's
 * shared. Those apps read only the HTML the server sends — no JavaScript — so
 * the backend reads the same HTML and builds each card with that app's own
 * fallbacks; the problems say what to change. For a page added to SEO here,
 * Edit SEO opens its record. `?url=` checks an address straight away (the SEO
 * record page's "Link previews" button).
 *
 * The cards are drawn the way each app lays them out today, roughly — the apps
 * change their looks often; what they show comes from the tags.
 */

type Props = { config: SiteConfig };
type Card = NonNullable<LinkPreview['cards']>[number];

const APP_NAME: Record<PreviewApp, string> = { facebook: 'Facebook', linkedin: 'LinkedIn', whatsapp: 'WhatsApp', x: 'X', slack: 'Slack' };

const LEVEL: Record<PreviewLevel, { color: string; palette: string; icon: typeof CircleX; word: [string, string] }> = {
	error: { color: 'red.fg', palette: 'red', icon: CircleX, word: ['error', 'errors'] },
	warning: { color: 'orange.fg', palette: 'orange', icon: CircleAlert, word: ['warning', 'warnings'] },
	notice: { color: 'fg.muted', palette: 'gray', icon: Info, word: ['notice', 'notices'] },
};

/** Where to make an app read the page again — they keep a copy of a card for days. */
const REFRESH: { label: string; href: (url: string) => string }[] = [
	{ label: 'Facebook Sharing Debugger', href: u => `https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(u)}` },
	{ label: 'LinkedIn Post Inspector', href: u => `https://www.linkedin.com/post-inspector/inspect/${encodeURIComponent(u)}` },
];

const kb = (n?: number) => (!n ? '' : n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/** Lines of text cut the way the apps cut them. */
const Clamp: FC<{ lines: number; children: ReactNode } & Record<string, any>> = ({ lines, children, ...rest }) => (
	<Text
		lineClamp={lines}
		wordBreak='break-word'
		{...rest}>
		{children}
	</Text>
);

const Picture: FC<{ src: string; ratio: string; w?: string }> = ({ src, ratio, w = '100%' }) => (
	<Box
		w={w}
		flexShrink={0}
		aspectRatio={ratio}
		bg='bg.muted'
		overflow='hidden'>
		{/* eslint-disable-next-line @next/next/no-img-element */}
		<img
			src={src}
			alt=''
			referrerPolicy='no-referrer'
			style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
		/>
	</Box>
);

/* ------------------------------------------------------------ the five cards */

const Facebook: FC<{ c: Card }> = ({ c }) => (
	<Box
		borderWidth='1px'
		borderColor='border'
		overflow='hidden'
		bg='bg.panel'>
		{c.layout === 'large' && (
			<Picture
				src={c.image}
				ratio='1.91'
			/>
		)}
		<Flex>
			{c.layout === 'small' && (
				<Picture
					src={c.image}
					ratio='1'
					w='96px'
				/>
			)}
			<Box
				px={3}
				py={2}
				bg='bg.muted'
				flex={1}
				minW={0}>
				<Text
					fontSize='11px'
					color='fg.muted'
					textTransform='uppercase'
					truncate>
					{c.domain}
				</Text>
				<Clamp
					lines={2}
					fontSize='14px'
					fontWeight='600'>
					{c.title || c.domain}
				</Clamp>
				{c.description && (
					<Clamp
						lines={1}
						fontSize='12.5px'
						color='fg.muted'>
						{c.description}
					</Clamp>
				)}
			</Box>
		</Flex>
	</Box>
);

const LinkedIn: FC<{ c: Card }> = ({ c }) => (
	<Box
		borderWidth='1px'
		borderColor='border'
		borderRadius='md'
		overflow='hidden'
		bg='bg.panel'>
		{c.layout === 'large' && (
			<Picture
				src={c.image}
				ratio='1.91'
			/>
		)}
		<Flex
			gap={3}
			p={3}
			align='center'>
			{c.layout === 'small' && (
				<Picture
					src={c.image}
					ratio='1'
					w='64px'
				/>
			)}
			<Box minW={0}>
				<Clamp
					lines={2}
					fontSize='14px'
					fontWeight='600'>
					{c.title || c.domain}
				</Clamp>
				<Text
					fontSize='12px'
					color='fg.muted'
					truncate>
					{c.domain}
				</Text>
			</Box>
		</Flex>
	</Box>
);

const WhatsApp: FC<{ c: Card; url: string }> = ({ c, url }) => (
	<Box
		bg='#d9fdd3'
		_dark={{ bg: '#005c4b' }}
		borderRadius='lg'
		p={1}
		maxW='360px'>
		<Box
			bg='#d1f4cc'
			_dark={{ bg: '#025144' }}
			borderRadius='md'
			overflow='hidden'>
			{c.layout === 'large' && (
				<Picture
					src={c.image}
					ratio='1.91'
				/>
			)}
			<Flex>
				{c.layout === 'small' && (
					<Picture
						src={c.image}
						ratio='1'
						w='80px'
					/>
				)}
				<Box
					px={2.5}
					py={2}
					minW={0}
					color='#111b21'
					_dark={{ color: '#e9edef' }}>
					<Clamp
						lines={2}
						fontSize='13.5px'
						fontWeight='600'>
						{c.title || c.domain}
					</Clamp>
					{c.description && (
						<Clamp
							lines={2}
							fontSize='12.5px'
							opacity={0.75}>
							{c.description}
						</Clamp>
					)}
					<Text
						fontSize='12px'
						opacity={0.6}
						truncate>
						{c.domain}
					</Text>
				</Box>
			</Flex>
		</Box>
		<Text
			px={1.5}
			py={1}
			fontSize='13px'
			color='#027eb5'
			_dark={{ color: '#53bdeb' }}
			truncate>
			{url}
		</Text>
	</Box>
);

const X: FC<{ c: Card }> = ({ c }) =>
	c.layout === 'large' ? (
		<Box>
			<Box
				position='relative'
				borderWidth='1px'
				borderColor='border'
				borderRadius='2xl'
				overflow='hidden'>
				<Picture
					src={c.image}
					ratio='1.91'
				/>
				<Box
					position='absolute'
					left={3}
					bottom={3}
					maxW='calc(100% - 24px)'
					bg='blackAlpha.700'
					color='white'
					fontSize='12px'
					px={1.5}
					borderRadius='sm'
					truncate>
					{c.title || c.domain}
				</Box>
			</Box>
			<Text
				fontSize='12px'
				color='fg.muted'
				mt={1}>
				From {c.domain}
			</Text>
		</Box>
	) : (
		<Flex
			borderWidth='1px'
			borderColor='border'
			borderRadius='2xl'
			overflow='hidden'
			bg='bg.panel'>
			{c.image ? (
				<Picture
					src={c.image}
					ratio='1'
					w='96px'
				/>
			) : null}
			<Box
				px={3}
				py={2}
				minW={0}
				borderLeftWidth={c.image ? '1px' : 0}
				borderColor='border'>
				<Text
					fontSize='12px'
					color='fg.muted'
					truncate>
					{c.domain}
				</Text>
				<Clamp
					lines={1}
					fontSize='13.5px'>
					{c.title || c.domain}
				</Clamp>
				{c.description && (
					<Clamp
						lines={2}
						fontSize='12.5px'
						color='fg.muted'>
						{c.description}
					</Clamp>
				)}
			</Box>
		</Flex>
	);

const Slack: FC<{ c: Card }> = ({ c }) => (
	<Flex
		gap={2.5}
		pl={2.5}
		borderLeftWidth='4px'
		borderColor='border.emphasized'>
		<Box
			flex={1}
			minW={0}>
			<Text
				fontSize='12.5px'
				fontWeight='700'
				truncate>
				{c.siteName}
			</Text>
			<Clamp
				lines={2}
				fontSize='13.5px'
				fontWeight='700'
				color='#1264a3'
				_dark={{ color: '#1d9bd1' }}>
				{c.title || c.domain}
			</Clamp>
			{c.description && (
				<Clamp
					lines={3}
					fontSize='13px'>
					{c.description}
				</Clamp>
			)}
			{c.layout === 'large' && (
				<Box
					mt={2}
					maxW='320px'
					borderRadius='md'
					overflow='hidden'>
					<Picture
						src={c.image}
						ratio='1.91'
					/>
				</Box>
			)}
		</Box>
		{c.layout === 'small' && (
			<Box
				borderRadius='md'
				overflow='hidden'
				h='fit-content'>
				<Picture
					src={c.image}
					ratio='1'
					w='72px'
				/>
			</Box>
		)}
	</Flex>
);

const DRAW: Record<PreviewApp, FC<{ c: Card; url: string }>> = { facebook: Facebook, linkedin: LinkedIn, whatsapp: WhatsApp, x: X, slack: Slack };

const AppCard: FC<{ c: Card; url: string; problems: number }> = ({ c, url, problems }) => {
	const Draw = DRAW[c.app];
	return (
		<Box
			id={`preview-${c.app}`}
			minW={0}>
			<Flex
				align='center'
				gap={2}
				mb={2}>
				<Text
					fontSize='12.5px'
					fontWeight='600'>
					{APP_NAME[c.app]}
				</Text>
				<Text
					fontSize='11.5px'
					color='fg.muted'>
					{c.layout === 'large' ? 'Big picture' : c.layout === 'small' ? 'Small thumbnail' : 'Text only'}
				</Text>
				{problems > 0 && (
					<Badge
						size='xs'
						variant='subtle'
						colorPalette='orange'>
						{problems} to fix
					</Badge>
				)}
			</Flex>
			<Draw
				c={c}
				url={url}
			/>
		</Box>
	);
};

/* ------------------------------------------------------------ the result */

const Problems: FC<{ list: NonNullable<LinkPreview['problems']> }> = ({ list }) => (
	<Box
		borderWidth='1px'
		borderColor='border'
		borderRadius='md'
		overflow='hidden'>
		{list.map((p, i) => {
			const l = LEVEL[p.level];
			const Icon = l.icon;
			return (
				<Flex
					key={`${p.key}-${i}`}
					gap={3}
					px={4}
					py={2.5}
					borderTopWidth={i ? '1px' : 0}
					borderColor='border.muted'
					align='flex-start'>
					<Box
						color={l.color}
						mt='2px'
						flexShrink={0}>
						<Icon size={15} />
					</Box>
					<Box
						flex={1}
						minW={0}>
						<Text fontSize='12.5px'>{p.message}</Text>
						{p.apps && p.apps.length < 5 && (
							<Text
								fontSize='11.5px'
								color='fg.muted'
								mt={0.5}>
								{p.apps.map(a => APP_NAME[a]).join(', ')}
							</Text>
						)}
					</Box>
				</Flex>
			);
		})}
	</Box>
);

const TagRow: FC<{ name: string; value?: string; note?: string }> = ({ name, value, note }) => (
	<Grid
		templateColumns={{ base: '1fr', sm: '170px minmax(0, 1fr)' }}
		gap={{ base: 0, sm: 3 }}
		px={4}
		py={1.5}
		borderTopWidth='1px'
		borderColor='border.muted'>
		<Text
			fontSize='12px'
			fontFamily='mono'
			color='fg.muted'>
			{name}
		</Text>
		<Text
			fontSize='12.5px'
			wordBreak='break-word'
			color={value ? 'fg' : 'fg.subtle'}>
			{value || 'not set'}
			{note && (
				<Text
					as='span'
					color='fg.muted'>
					{' '}
					· {note}
				</Text>
			)}
		</Text>
	</Grid>
);

const imageNote = (i?: LinkPreview['image']) =>
	!i ? '' : !i.ok ? i.message || 'can’t be shown' : [i.width && `${i.width}×${i.height}`, kb(i.bytes), i.type?.replace('image/', '').toUpperCase()].filter(Boolean).join(', ');

const Result: FC<{ r: LinkPreview }> = ({ r }) => {
	const [showTags, setShowTags] = useState(false);
	const problems = r.problems || [];
	const counts = (['error', 'warning', 'notice'] as const).filter(l => r.counts?.[l]);
	const perApp = (app: PreviewApp) => problems.filter(p => p.level !== 'notice' && p.apps?.includes(app)).length;
	const t = r.tags!;
	const shown = r.finalUrl || r.url;
	return (
		<Flex
			direction='column'
			gap={4}>
			<Flex
				gap={3}
				align='center'
				wrap='wrap'>
				<Box
					flex={1}
					minW='220px'>
					<Text
						fontSize='13px'
						fontWeight='600'
						wordBreak='break-all'>
						{shown}
					</Text>
					<Text
						fontSize='12px'
						color='fg.muted'
						title={moment(r.checkedAt).format('D MMM YYYY, h:mm:ss A')}>
						Read from the HTML the server sends — as the apps read it · checked {moment(r.checkedAt).fromNow()}
					</Text>
				</Box>
				<Flex
					gap={1.5}
					align='center'
					wrap='wrap'>
					{!counts.length && (
						<Badge
							size='sm'
							variant='subtle'
							colorPalette='green'>
							<CircleCheck size={12} /> Ready to share
						</Badge>
					)}
					{counts.map(l => (
						<Badge
							key={l}
							size='sm'
							variant='subtle'
							colorPalette={LEVEL[l].palette}>
							{r.counts![l]} {LEVEL[l].word[r.counts![l] === 1 ? 0 : 1]}
						</Badge>
					))}
					{r.mint?.seo ? (
						<Button
							asChild
							size='xs'>
							<NextLink href={projectHref(`/view/seo/${r.mint.seo}`)}>
								<PenLine size={13} />
								Edit SEO
							</NextLink>
						</Button>
					) : r.mint ? (
						<Button
							asChild
							size='xs'
							variant='outline'>
							<NextLink href={createPath('seo')}>
								<PenLine size={13} />
								Add SEO for {r.mint.page.path}
							</NextLink>
						</Button>
					) : null}
				</Flex>
			</Flex>

			{problems.length > 0 && <Problems list={problems} />}

			<Grid
				templateColumns={{ base: '1fr', md: 'repeat(2, minmax(0, 1fr))' }}
				gap={6}
				alignItems='start'>
				{r.cards!.map(c => (
					<AppCard
						key={c.app}
						c={c}
						url={shown}
						problems={perApp(c.app)}
					/>
				))}
			</Grid>

			<Box
				borderWidth='1px'
				borderColor='border'
				borderRadius='md'
				overflow='hidden'>
				<Flex
					as='button'
					w='full'
					px={4}
					py={2.5}
					justify='space-between'
					align='center'
					cursor='pointer'
					onClick={() => setShowTags(v => !v)}
					{...{ type: 'button', 'aria-expanded': showTags }}>
					<Text
						fontSize='12.5px'
						fontWeight='600'>
						The tags in the page’s HTML
					</Text>
					<Text
						fontSize='12px'
						color='fg.muted'>
						{showTags ? 'Hide' : 'Show'}
					</Text>
				</Flex>
				{showTags && (
					<Box>
						<TagRow
							name='<title>'
							value={t.title}
						/>
						<TagRow
							name='description'
							value={t.description}
						/>
						<TagRow
							name='og:title'
							value={t.ogTitle}
						/>
						<TagRow
							name='og:description'
							value={t.ogDescription}
						/>
						<TagRow
							name='og:image'
							value={t.ogImage}
							note={imageNote(r.image)}
						/>
						<TagRow
							name='og:url'
							value={t.ogUrl}
						/>
						<TagRow
							name='og:site_name'
							value={t.ogSiteName}
						/>
						<TagRow
							name='og:type'
							value={t.ogType}
						/>
						<TagRow
							name='twitter:card'
							value={t.twitterCard}
						/>
						<TagRow
							name='twitter:title'
							value={t.twitterTitle}
						/>
						<TagRow
							name='twitter:image'
							value={t.twitterImage}
							note={imageNote(r.twitterImage)}
						/>
						<TagRow
							name='canonical'
							value={t.canonical}
						/>
					</Box>
				)}
			</Box>

			<Text
				fontSize='12px'
				color='fg.muted'>
				Changed something? Facebook, LinkedIn and WhatsApp keep their copy of a card for days — make them read the page again:{' '}
				{REFRESH.map((x, i) => (
					<span key={x.label}>
						{i > 0 && ' · '}
						<Box
							as='a'
							textDecoration='underline'
							{...{ href: x.href(shown), target: '_blank', rel: 'noreferrer' }}>
							{x.label}
						</Box>
					</span>
				))}
				. WhatsApp follows Facebook’s copy.
			</Text>
		</Flex>
	);
};

export const LinkPreviewTab: FC<Props> = ({ config }) => {
	const params = useSearchParams();
	const asked = params.get('url') || '';
	const domain = config.domains?.find(d => !d.startsWith('localhost')) || '';
	const [url, setUrl] = useState(asked || (domain ? `https://${domain}/` : ''));
	const [check, { data, isLoading, error }] = useCheckLinkPreviewMutation();
	const ran = useRef(false);
	useEffect(() => {
		if (asked && !ran.current) {
			ran.current = true;
			check({ url: asked });
		}
	}, [asked, check]);
	const submit = (e: FormEvent) => {
		e.preventDefault();
		if (url.trim()) check({ url: url.trim() });
	};

	return (
		<Flex
			direction='column'
			gap={4}
			id='link-preview'>
			<Box
				borderWidth='1px'
				borderColor='border'
				borderRadius='md'
				bg='bg.panel'
				px={{ base: 4, md: 5 }}
				py={4}>
				<Flex
					justify='space-between'
					gap={3}
					align='baseline'
					wrap='wrap'>
					<Text
						fontSize='14px'
						fontWeight='600'>
						Link previews
					</Text>
					<GuideLink section='link-preview' />
				</Flex>
				<Text
					fontSize='12.5px'
					color='fg.muted'
					mt={0.5}
					mb={3}>
					What Facebook, LinkedIn, WhatsApp, X and Slack show when someone shares a page. They don’t run the page’s JavaScript — only what your server sends counts, so that’s what’s read here. Any address works, yours or not.
				</Text>
				<Flex
					as='form'
					gap={2}
					onSubmit={submit}>
					<Input
						size='sm'
						flex={1}
						value={url}
						onChange={e => setUrl(e.target.value)}
						placeholder='https://www.example.com/page'
						aria-label='Address to check'
						inputMode='url'
					/>
					<Button
						type='submit'
						size='sm'
						loading={isLoading}
						disabled={!url.trim()}>
						Check
					</Button>
				</Flex>
			</Box>
			{error && (
				<Text
					fontSize='12.5px'
					color='red.fg'>
					{errorText(error)}
				</Text>
			)}
			{data && !isLoading && !data.ok && (
				<Flex
					gap={2}
					align='flex-start'
					fontSize='12.5px'
					color='red.fg'>
					<Box mt='2px'>
						<CircleX size={15} />
					</Box>
					<Text>{data.message}</Text>
				</Flex>
			)}
			{data?.ok && <Result r={data} />}
			{!data && !isLoading && (
				<Text
					fontSize='12px'
					color='fg.muted'>
					Tip: each page’s SEO (Website → SEO) has a Link previews button that checks that page.
				</Text>
			)}
		</Flex>
	);
};
