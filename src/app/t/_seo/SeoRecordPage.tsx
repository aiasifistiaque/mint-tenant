'use client';

import { FC, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Badge, Box, Button, Flex, Grid, Tabs, Text } from '@chakra-ui/react';
import { CircleAlert, CircleX, ExternalLink, FileText, Info } from 'lucide-react';
import RecordView from '../../view/_components/RecordView';
import { useGetByIdQuery, useUpdateByIdMutation } from '@/components/library/store/services/commonApi';
import { useGetSeoHealthQuery, type SeoHealthLevel } from '@/components/library/store/services/tenantApi';
import { DOCS_URL, projectHref } from '@/components/library/config/lib/constants/panel';
import { toaster } from '@/components/ui/toaster';
import SerpPreview from '@/components/library/utils/inputs/VSeo/SerpPreview';
import SocialPreview from '@/components/library/utils/inputs/VSeo/SocialPreview';
import {
	SeoBasicsFields,
	SeoIndexingFields,
	SeoScore,
	SeoSitemapFields,
	SeoSocialFields,
	SeoStructuredFields,
	useSeoAnalysis,
	useSeoSetters,
	type SectionProps,
} from '@/components/library/utils/inputs/VSeo/parts';

/**
 * A website's SEO record as a page of its own (backend docs/seo SEO-20): every
 * part of the SEO editor on one page, with the score, the Google and social
 * previews and the site-wide problems this page is part of kept beside it.
 * Edits stay here until Save. Overview, Comments and History follow as on any
 * record's page. /<project>/seo/<id> opens it (app/view/[slug]/[id]).
 */

const SECTIONS: { id: string; title: string; hint: string; Fields: FC<SectionProps & { preview?: boolean }> }[] = [
	{ id: 'search', title: 'Search result', hint: 'What Google shows, and the phrase this page should be found for.', Fields: SeoBasicsFields },
	{ id: 'social', title: 'Sharing', hint: 'How a link to this page looks on Facebook, WhatsApp, LinkedIn and X.', Fields: SeoSocialFields },
	{ id: 'indexing', title: 'Search engines', hint: 'Whether search engines may list this page and follow its links.', Fields: SeoIndexingFields },
	{ id: 'structured', title: 'Structured data', hint: 'The details behind rich results: stars, prices, breadcrumbs.', Fields: SeoStructuredFields },
	{ id: 'sitemap', title: 'Sitemap', hint: 'This page’s entry in sitemap.xml.', Fields: SeoSitemapFields },
];

const GRADE_PALETTE = { good: 'green', ok: 'orange', bad: 'red' } as const;
const GRADE_WORD = { good: 'Good', ok: 'Needs work', bad: 'Poor' } as const;
const LEVEL: Record<SeoHealthLevel, { color: string; icon: typeof CircleX }> = {
	error: { color: 'red.fg', icon: CircleX },
	warning: { color: 'orange.fg', icon: CircleAlert },
	notice: { color: 'fg.muted', icon: Info },
};

/** Empty values count as unset, so typing a letter and deleting it isn't an unsaved change. */
const clean = (v: any): any => {
	if (Array.isArray(v)) return v.length ? v.map(clean) : undefined;
	if (v && typeof v === 'object') {
		const out: Record<string, any> = {};
		for (const k of Object.keys(v).sort()) {
			const c = clean(v[k]);
			if (c !== undefined) out[k] = c;
		}
		return Object.keys(out).length ? out : undefined;
	}
	return v === '' || v === null ? undefined : v;
};
const same = (a: any, b: any) => JSON.stringify(clean(a) ?? {}) === JSON.stringify(clean(b) ?? {});

const Card: FC<{ id?: string; title: string; hint?: string; children: ReactNode }> = ({ id, title, hint, children }) => (
	<Box
		id={id}
		borderWidth='1px'
		borderColor='border'
		borderRadius='md'
		p={{ base: 4, md: 5 }}
		scrollMarginTop='80px'>
		<Text
			fontSize='14px'
			fontWeight='600'>
			{title}
		</Text>
		{hint && (
			<Text
				fontSize='12px'
				color='fg.muted'
				mt={0.5}>
				{hint}
			</Text>
		)}
		<Box mt={4}>{children}</Box>
	</Box>
);

const SeoRecordPage: FC<{ id: string }> = ({ id }) => {
	const { data: doc } = useGetByIdQuery({ path: 'seo', id });
	// The record's page: populated, or an id to look up.
	const pageId: string = typeof doc?.page === 'string' ? doc.page : doc?.page?._id || '';
	const populated = doc?.page && typeof doc.page === 'object' && doc.page.path ? doc.page : null;
	const { data: pageDoc } = useGetByIdQuery({ path: 'pages', id: pageId }, { skip: !pageId || !!populated });
	const page = populated || pageDoc || null;

	const saved = useMemo(() => (doc?.seo && typeof doc.seo === 'object' ? doc.seo : {}), [doc?.seo]);
	const [draft, setDraft] = useState<any>(null);
	// A fresh copy when the record loads, and again after each save.
	useEffect(() => {
		if (doc) setDraft(doc.seo && typeof doc.seo === 'object' ? doc.seo : {});
	}, [doc?._id, doc?.updatedAt]); // eslint-disable-line react-hooks/exhaustive-deps

	const seo = draft || saved;
	const dirty = !!draft && !same(draft, saved);
	const { set, setNested } = useSeoSetters(seo, setDraft);
	const a = useSeoAnalysis(seo, { page: page || pageId || undefined });
	const section = { seo, set, setNested, a };

	const [update, { isLoading: saving }] = useUpdateByIdMutation();
	const save = useCallback(async () => {
		if (!dirty || saving) return;
		try {
			await update({ path: 'seo', id, body: { seo: draft }, invalidate: ['history'] }).unwrap();
			toaster.create({ title: 'SEO saved', description: 'The site uses it from its next visit.', type: 'success' });
		} catch (e: any) {
			toaster.create({ title: 'Couldn’t save', description: e?.data?.message || 'Try again.', type: 'error' });
		}
	}, [dirty, saving, update, id, draft]);
	const discard = () => setDraft(saved);

	// ⌘S / Ctrl+S saves; leaving with unsaved changes asks first.
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
				e.preventDefault();
				save();
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [save]);
	useEffect(() => {
		if (!dirty) return;
		const warn = (e: BeforeUnloadEvent) => {
			e.preventDefault();
			e.returnValue = '';
		};
		window.addEventListener('beforeunload', warn);
		return () => window.removeEventListener('beforeunload', warn);
	}, [dirty]);

	// This page in the site's SEO health (SEO-03): the problems it's part of, as of the last save.
	const { data: health } = useGetSeoHealthQuery();
	const problems = (health?.groups || []).flatMap(g => {
		const mine = g.pages.find(p => p.seo === id || (pageId && p.page === pageId));
		// The pages it shares the problem with — for the "same …" problems; a gap of its own lists none.
		const others = g.key.startsWith('same-') ? g.pages.filter(p => p !== mine) : [];
		return mine ? [{ ...g, others }] : g.key === 'site-hidden' ? [{ ...g, others }] : [];
	});

	const path: string = page?.path || a.previewPath;
	const liveUrl = a.siteHost && path && !/\[|\{\{/.test(path) ? `https://${a.siteHost}${path}` : '';
	const jump = (to: string) => document.getElementById(`seo-${to}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

	const editor = (
		<Grid
			templateColumns={{ base: '1fr', lg: 'minmax(0, 1fr) 360px' }}
			gap={6}
			alignItems='start'
			pb={dirty ? 20 : 4}>
			<Flex
				direction='column'
				gap={4}
				minW={0}>
				<Flex
					gap={1.5}
					wrap='wrap'>
					{SECTIONS.map(s => (
						<Button
							key={s.id}
							size='xs'
							variant='outline'
							borderRadius='full'
							onClick={() => jump(s.id)}>
							{s.title}
						</Button>
					))}
				</Flex>
				{SECTIONS.map(({ id: key, title, hint, Fields }) => (
					<Card
						key={key}
						id={`seo-${key}`}
						title={title}
						hint={hint}>
						<Fields
							{...section}
							preview={false}
						/>
					</Card>
				))}
			</Flex>

			<Flex
				direction='column'
				gap={4}
				position={{ lg: 'sticky' }}
				top={{ lg: 4 }}
				minW={0}>
				<SeoScore
					result={a.score}
					note={a.wordsFrom}
				/>

				<Card title='Preview'>
					<Tabs.Root
						size='sm'
						variant='subtle'
						defaultValue='google'
						lazyMount>
						<Tabs.List
							gap={1}
							border='none'
							mb={3}>
							<Tabs.Trigger
								value='google'
								borderRadius='full'
								px={3}>
								Google
							</Tabs.Trigger>
							<Tabs.Trigger
								value='social'
								borderRadius='full'
								px={3}>
								Shared link
							</Tabs.Trigger>
						</Tabs.List>
						<Tabs.Content
							value='google'
							p={0}>
							<SerpPreview
								title={seo.metaTitle || a.fallbackTitle}
								description={seo.metaDescription || a.fallbackDescription}
								path={path}
								host={a.siteHost}
							/>
						</Tabs.Content>
						<Tabs.Content
							value='social'
							p={0}>
							<SocialPreview
								host={a.shareHost}
								title={seo.ogTitle || seo.metaTitle || a.fallbackTitle}
								description={seo.ogDescription || seo.metaDescription || a.fallbackDescription}
								image={seo.ogImage || a.siteImage}
							/>
						</Tabs.Content>
					</Tabs.Root>
				</Card>

				<Card
					title='Across the site'
					hint='Problems this page shares with others, as of the last save.'>
					{!health ? (
						<Text
							fontSize='12px'
							color='fg.muted'>
							Checking…
						</Text>
					) : !problems.length ? (
						<Text
							fontSize='12px'
							color='fg.muted'>
							{page && page.status !== 'published' ? 'Only published pages are checked.' : 'Nothing found.'}
						</Text>
					) : (
						<Flex
							direction='column'
							gap={3}>
							{problems.map(g => {
								const Icon = LEVEL[g.level].icon;
								return (
									<Flex
										key={g.key}
										gap={2}
										align='flex-start'>
										<Box
											color={LEVEL[g.level].color}
											mt='2px'
											flexShrink={0}>
											<Icon size={14} />
										</Box>
										<Box minW={0}>
											<Text
												fontSize='12.5px'
												fontWeight='600'>
												{g.label}
											</Text>
											{g.others.length > 0 && (
												<Text
													fontSize='12px'
													color='fg.muted'>
													Also on{' '}
													{g.others.map((p, i) => (
														<span key={p.page}>
															{i > 0 && ', '}
															<Link
																href={p.seo ? projectHref(`/view/seo/${p.seo}`) : projectHref(`/view/pages/${p.page}`)}
																style={{ textDecoration: 'underline' }}>
																{p.path}
															</Link>
														</span>
													))}
												</Text>
											)}
											<Text
												fontSize='11.5px'
												color='fg.muted'>
												{g.advice}
											</Text>
										</Box>
									</Flex>
								);
							})}
						</Flex>
					)}
					<Box
						as='a'
						mt={3}
						display='inline-block'
						fontSize='12px'
						textDecoration='underline'
						color='fg.muted'
						{...{ href: `${DOCS_URL}/websites#seo-page`, target: '_blank', rel: 'noreferrer' }}>
						About this page
					</Box>
				</Card>
			</Flex>

			{dirty && (
				<Flex
					position='fixed'
					bottom={4}
					left='50%'
					transform='translateX(-50%)'
					zIndex='sticky'
					w={{ base: 'calc(100% - 32px)', md: 'auto' }}
					gap={3}
					align='center'
					justify='space-between'
					bg='bg.panel'
					borderWidth='1px'
					borderColor='border'
					borderRadius='full'
					boxShadow='lg'
					pl={5}
					pr={2}
					py={2}>
					<Text
						fontSize='13px'
						fontWeight='500'>
						Unsaved changes
					</Text>
					<Flex gap={2}>
						<Button
							size='sm'
							variant='ghost'
							borderRadius='full'
							onClick={discard}>
							Discard
						</Button>
						<Button
							size='sm'
							borderRadius='full'
							loading={saving}
							onClick={save}>
							Save
						</Button>
					</Flex>
				</Flex>
			)}
		</Grid>
	);

	return (
		<RecordView
			slug='seo'
			id={id}
			noEdit
			title={page?.name ? `SEO · ${page.name}` : undefined}
			badge={
				<Badge
					size='sm'
					variant='subtle'
					colorPalette={GRADE_PALETTE[a.score.grade]}>
					{a.score.score} · {GRADE_WORD[a.score.grade]}
				</Badge>
			}
			meta={[path, page?.status && page.status !== 'published' ? `Page is ${page.status}` : ''].filter(Boolean).join(' · ') || undefined}
			actions={
				<>
					{pageId && (
						<Button
							asChild
							size='sm'
							variant='ghost'>
							<Link href={projectHref(`/view/pages/${pageId}`)}>
								<FileText size={14} />
								Page
							</Link>
						</Button>
					)}
					{liveUrl && (
						<Button
							asChild
							size='sm'
							variant='ghost'>
							<a
								href={liveUrl}
								target='_blank'
								rel='noreferrer'>
								<ExternalLink size={14} />
								View on site
							</a>
						</Button>
					)}
					<Button
						size='sm'
						disabled={!dirty}
						loading={saving}
						onClick={save}>
						Save
					</Button>
				</>
			}
			tabs={[{ value: 'seo', label: 'SEO', content: editor }]}
		/>
	);
};

export default SeoRecordPage;
