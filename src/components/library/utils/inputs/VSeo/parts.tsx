'use client';

import { FC, ReactNode, useCallback, useMemo } from 'react';
import { Box, Button, Flex, Grid, Image, SimpleGrid, Text, Textarea as ChakraTextarea, TextareaProps } from '@chakra-ui/react';

import { FormControl, HelperText, Input, Label, SelectContainer, UploadModal, VTags, VSwitch, styles } from '../../..';
import {
	CHANGE_FREQUENCY_OPTIONS,
	DANGER,
	DESCRIPTION_HARD_MAX,
	DESCRIPTION_MAX,
	DESCRIPTION_MIN,
	IMAGE_PREVIEW_OPTIONS,
	OG_TYPE_OPTIONS,
	SCHEMA_TYPE_OPTIONS,
	SUCCESS,
	TEXT_MUTED,
	TEXT_STRONG,
	TITLE_HARD_MAX,
	TITLE_MAX,
	TITLE_MIN,
	TWITTER_CARD_OPTIONS,
	WARNING,
	tone,
} from './constants';
import SocialPreview from './SocialPreview';
import { useGetSeoPageWordsQuery, useGetSiteConfigQuery } from '@/components/library/store/services/tenantApi';
import { seoScore, type ScoreResult, type ScoreStatus } from './seoScore';
import CharCount from './CharCount';
import { DOCS_URL } from '@/components/library/config/lib/constants/panel';

/**
 * The SEO editor's parts: the fields of each section, the score and what they
 * both read. VSeo lays them out as tabs inside a form; an SEO record's own
 * page (app/t/_seo/SeoRecordPage, docs/seo SEO-20) lays them out as one page
 * with the score and previews beside it.
 */

/**
 * Chakra's bare `Textarea` doesn't carry the shared field surface the way the
 * library's `Input` does, so these rendered at the browser's default 16px on a
 * screen where every other control is 13px. Wrapped once here rather than
 * spreading the surface across all four call sites below; anything a call site
 * passes still wins, which is how the JSON-LD box keeps its 12px mono.
 */
const Textarea = (props: TextareaProps) => (
	<ChakraTextarea
		{...(styles.FIELD as TextareaProps)}
		{...props}
	/>
);

export const stripHtml = (value?: string): string =>
	typeof value === 'string' ? value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '';

/** Edits one key of the SEO object (or one inside `robots` / `sitemap`), emitting the whole object. */
export const useSeoSetters = (seo: any, emit: (next: any) => void) => {
	// Set one top-level key of the sub-document.
	const set = useCallback((key: string, fieldValue: any) => emit({ ...seo, [key]: fieldValue }), [emit, seo]);
	// Set one key inside `robots` / `sitemap` without losing its siblings.
	const setNested = useCallback(
		(group: string, key: string, fieldValue: any) => emit({ ...seo, [group]: { ...(seo[group] || {}), [key]: fieldValue } }),
		[emit, seo]
	);
	return { set, setNested };
};

/** A record that isn't a website page (a product, a post): its own text fields, its name as the heading. */
const TEXT_FIELDS = ['shortDescription', 'description', 'longDescription', 'summary', 'details', 'content', 'body'];
const recordWords = (formData: any) => {
	if (!formData || typeof formData !== 'object') return null;
	const text = TEXT_FIELDS.map(k => stripHtml(typeof formData[k] === 'string' ? formData[k] : '')).filter(Boolean).join('. ');
	const heading = String(formData.name || formData.title || '').trim();
	return text ? { text, headings: heading ? [heading] : [] } : null;
};

/**
 * What the editor shows besides the fields: the fallbacks blank fields inherit,
 * the address and host for the previews, and the score (docs/seo SEO-01).
 */
export const useSeoAnalysis = (seo: any, formData: any) => {
	// What the frontend will fall back to when a field is left blank. Showing
	// it as placeholder text is the difference between "empty means broken" and
	// "empty means inherit".
	// A website's SEO record links its page: its name and path stand in (an id alone says nothing).
	const page = formData?.page && typeof formData.page === 'object' ? formData.page : null;
	const fallbackTitle = formData?.name || formData?.title || page?.name || '';
	const fallbackDescription = stripHtml(formData?.shortDescription || formData?.description || '');

	// A website page's words come from the backend (its builder draft, or the live page for a site built
	// elsewhere); any other record's from its own text fields. An SEO record's form holds its page as an id,
	// so the backend finds the path too.
	const pageId = typeof formData?.page === 'string' ? formData.page : '';
	const pageRef = page?.path ? { path: page.path } : pageId ? { page: pageId } : null;
	const { data: pageWords, isFetching: wordsLoading } = useGetSeoPageWordsQuery(pageRef || {}, { skip: !pageRef });

	const previewPath = formData?.path || page?.path || pageWords?.path || (formData?.slug ? `/${formData.slug}` : '/');

	// A website project's own domain for the previews; other projects have none and keep this panel's host.
	const { data: site } = useGetSiteConfigQuery();
	const siteHost = (site?.seo?.canonicalDomain || site?.domains?.find((d: string) => !d.startsWith('localhost')) || '').replace(/^https?:\/\//, '');
	const shareHost = siteHost || (typeof window !== 'undefined' ? window.location.host : '');

	const score = useMemo(
		() =>
			seoScore({
				title: seo.metaTitle || fallbackTitle,
				description: seo.metaDescription || fallbackDescription,
				keyword: seo.focusKeyword || '',
				path: previewPath,
				hasImage: !!seo.ogImage,
				siteImage: !!site?.seo?.ogImage,
				noIndex: seo.robots?.index === false,
				page: pageRef ? (pageWords && pageWords.source !== 'none' ? pageWords : null) : recordWords(formData),
				otherKeywords: pageRef ? pageWords?.keywords : undefined,
			}),
		[seo, fallbackTitle, fallbackDescription, previewPath, site?.seo?.ogImage, pageRef?.path, pageRef?.page, pageWords, formData]
	);
	const wordsFrom = pageRef
		? wordsLoading
			? 'Reading the page’s words…'
			: pageWords?.source === 'builder'
			? 'Checked against the page’s words in the site builder (the saved draft).'
			: pageWords?.source === 'live'
			? 'Checked against the words on the live page.'
			: `Checked without the page’s words${pageWords?.note ? `: ${pageWords.note}` : '.'}`
		: 'Checked against this record’s own text.';

	return { fallbackTitle, fallbackDescription, previewPath, siteHost, shareHost, score, wordsFrom, siteImage: site?.seo?.ogImage as string | undefined };
};

export type SeoAnalysis = ReturnType<typeof useSeoAnalysis>;

export type SectionProps = {
	seo: any;
	set: (key: string, value: any) => void;
	setNested: (group: string, key: string, value: any) => void;
	a: SeoAnalysis;
};

/** A labelled field, built on this project's own `FormControl` (a Chakra v3
 *  `Field.Root` wrapper) rather than raw Chakra — matches every other input
 *  in this library (VTextarea, VSelect, …). */
const Field: FC<{ label: string; helper?: string; children: ReactNode }> = ({ label, helper, children }) => (
	<FormControl
		label={label}
		helper={helper}>
		{children}
	</FormControl>
);

/** Explanatory copy that belongs to a whole tab, not to one input. */
export const Note: FC<{ children: ReactNode; mt?: number }> = ({ children, mt }) => (
	<Text
		fontSize='13px'
		fontStyle='italic'
		mt={mt}
		{...tone(TEXT_MUTED)}>
		{children}
	</Text>
);

/** A social-image picker built the same way `VImage` builds its single-image
 *  field: this project's own `UploadModal` opens the media library, with a
 *  plain "Remove" button once something is selected. */
const ImageField: FC<{
	label: string;
	helper?: string;
	value?: string;
	onSelect: any;
	onClear: any;
}> = ({ label, helper, value, onSelect, onClear }) => (
	<FormControl>
		<Label>{label}</Label>
		<Flex
			mt={2}
			gap={4}
			align='flex-start'>
			<Box
				position='relative'
				w='200px'
				h='110px'
				borderWidth='1px'
				borderColor='border'
				_dark={{ borderColor: 'whiteAlpha.300' }}
				borderRadius='md'
				overflow='hidden'>
				<UploadModal
					type={value ? 'edit' : 'add'}
					handleImage={onSelect}
					multiple={true}
					fileType='image'
				/>
				{value && (
					<Image
						alt={label}
						h='100%'
						w='100%'
						objectFit='cover'
						src={value}
						pointerEvents='none'
					/>
				)}
			</Box>
			{value && (
				<Button
					size='xs'
					variant='outline'
					onClick={onClear}>
					Remove
				</Button>
			)}
		</Flex>
		{helper && <HelperText>{helper}</HelperText>}
	</FormControl>
);

const JsonStatus: FC<{ value?: string }> = ({ value }) => {
	if (!value || !value.trim()) return null;
	let ok = true;
	try {
		const parsed = JSON.parse(value);
		ok = !!parsed && typeof parsed === 'object';
	} catch {
		ok = false;
	}
	return (
		<Text
			mt={1}
			fontSize='11px'
			{...tone(ok ? SUCCESS : { light: '#C53030', dark: '#FC8181' })}>
			{ok ? 'Valid JSON' : 'Not valid JSON — this block will be ignored'}
		</Text>
	);
};

/* ------------------------------------------------------------- sections */

/** Meta title and description, focus keyword, canonical, keywords. */
export const SeoBasicsFields: FC<SectionProps> = ({ seo, set, a }) => (
	<Flex
		direction='column'
		gap={5}>
		<Field
			label='Meta title'
			helper='The clickable headline in search results. Put the primary keyword near the front and keep the brand at the end.'>
			<Input
				size='sm'
				px={3}
				maxLength={TITLE_HARD_MAX}
				placeholder={a.fallbackTitle || 'e.g. Wireless Headphones | Your Brand'}
				value={seo.metaTitle || ''}
				onChange={e => set('metaTitle', e.target.value)}
			/>
			<CharCount
				value={seo.metaTitle}
				min={TITLE_MIN}
				max={TITLE_MAX}
				hardMax={TITLE_HARD_MAX}
			/>
		</Field>

		<Field
			label='Meta description'
			helper='Not a ranking factor, but it decides whether someone clicks. Describe the page and end with a reason to visit.'>
			<Textarea
				size='sm'
				px={3}
				py={2}
				minH='90px'
				maxLength={DESCRIPTION_HARD_MAX}
				placeholder={a.fallbackDescription || 'One or two sentences about this page.'}
				value={seo.metaDescription || ''}
				onChange={e => set('metaDescription', e.target.value)}
			/>
			<CharCount
				value={seo.metaDescription}
				min={DESCRIPTION_MIN}
				max={DESCRIPTION_MAX}
				hardMax={DESCRIPTION_HARD_MAX}
			/>
		</Field>

		<SimpleGrid
			columns={{ base: 1, md: 2 }}
			gap={4}>
			<Field label='Focus keyword'>
				<Input
					size='sm'
					px={3}
					placeholder='e.g. wireless headphones dhaka'
					value={seo.focusKeyword || ''}
					onChange={e => set('focusKeyword', e.target.value)}
				/>
			</Field>

			<Field
				label='Canonical URL'
				helper='Leave empty unless this page duplicates another one.'>
				<Input
					size='sm'
					px={3}
					placeholder='https://…'
					value={seo.canonicalUrl || ''}
					onChange={e => set('canonicalUrl', e.target.value)}
				/>
			</Field>
		</SimpleGrid>

		<Box>
			<VTags
				label='Keywords'
				name='keywords'
				value={seo.keywords || []}
				helper='Supporting phrases. Google ignores the keywords meta tag, so these are used for internal search and related-content matching only.'
				lowercase={false}
				onChange={(e: any) => set('keywords', e.target.value)}
			/>
		</Box>
	</Flex>
);

/** Open Graph and Twitter / X. `preview` off when the page shows the share preview elsewhere. */
export const SeoSocialFields: FC<SectionProps & { preview?: boolean }> = ({ seo, set, a, preview = true }) => (
	<Flex
		direction='column'
		gap={5}>
		<Note>
			Leave these empty to reuse the meta title, meta description and the page&apos;s main image. Fill them in when the
			social copy should differ.
		</Note>

		{preview && (
			<SocialPreview
				host={a.shareHost}
				title={seo.ogTitle || seo.metaTitle || a.fallbackTitle}
				description={seo.ogDescription || seo.metaDescription || a.fallbackDescription}
				image={seo.ogImage}
			/>
		)}

		<SimpleGrid
			columns={{ base: 1, md: 2 }}
			gap={4}>
			<Field label='Open Graph title'>
				<Input
					size='sm'
					px={3}
					placeholder={seo.metaTitle || a.fallbackTitle}
					value={seo.ogTitle || ''}
					onChange={e => set('ogTitle', e.target.value)}
				/>
			</Field>
			<Field label='Open Graph type'>
				<SelectContainer
					value={seo.ogType || ''}
					onChange={(e: any) => set('ogType', e.target.value)}>
					{OG_TYPE_OPTIONS.map(option => (
						<option
							key={option.value}
							value={option.value}>
							{option.label}
						</option>
					))}
				</SelectContainer>
			</Field>
		</SimpleGrid>

		<Field label='Open Graph description'>
			<Textarea
				size='sm'
				px={3}
				py={2}
				minH='80px'
				placeholder={seo.metaDescription || ''}
				value={seo.ogDescription || ''}
				onChange={e => set('ogDescription', e.target.value)}
			/>
		</Field>

		<ImageField
			label='Social share image'
			helper='1200 × 630 works everywhere. Anything much smaller gets cropped or dropped by Facebook and LinkedIn.'
			value={seo.ogImage}
			onSelect={(url: string) => set('ogImage', url)}
			onClear={() => set('ogImage', '')}
		/>

		<Field
			label='Image alt text'
			helper='Describes the share image for screen readers.'>
			<Input
				size='sm'
				px={3}
				value={seo.ogImageAlt || ''}
				onChange={e => set('ogImageAlt', e.target.value)}
			/>
		</Field>

		<SimpleGrid
			columns={{ base: 1, md: 2 }}
			gap={4}>
			<Field label='Twitter / X card'>
				<SelectContainer
					value={seo.twitterCard || ''}
					onChange={(e: any) => set('twitterCard', e.target.value)}>
					{TWITTER_CARD_OPTIONS.map(option => (
						<option
							key={option.value}
							value={option.value}>
							{option.label}
						</option>
					))}
				</SelectContainer>
			</Field>
			<Field label='Twitter title'>
				<Input
					size='sm'
					px={3}
					placeholder={seo.ogTitle || seo.metaTitle || a.fallbackTitle}
					value={seo.twitterTitle || ''}
					onChange={e => set('twitterTitle', e.target.value)}
				/>
			</Field>
		</SimpleGrid>

		<Field label='Twitter description'>
			<Textarea
				size='sm'
				px={3}
				py={2}
				minH='70px'
				placeholder={seo.ogDescription || seo.metaDescription || ''}
				value={seo.twitterDescription || ''}
				onChange={e => set('twitterDescription', e.target.value)}
			/>
		</Field>

		<ImageField
			label='Twitter image'
			helper='Optional. Falls back to the social share image.'
			value={seo.twitterImage}
			onSelect={(url: string) => set('twitterImage', url)}
			onClear={() => set('twitterImage', '')}
		/>
	</Flex>
);

/** The robots meta tag. */
export const SeoIndexingFields: FC<SectionProps> = ({ seo, setNested }) => (
	<Flex
		direction='column'
		gap={5}>
		<Note>
			These become the robots meta tag. The defaults are what you want for a page you are trying to rank — only change
			them deliberately.
		</Note>

		<VSwitch
			label='Allow indexing'
			helper='Off adds noindex: the page stays reachable but disappears from search results.'
			value={seo.robots?.index !== false}
			onChange={(e: any) => setNested('robots', 'index', e.target.checked)}
		/>
		<VSwitch
			label='Follow links'
			helper='Off adds nofollow: crawlers will not pass authority through links on this page.'
			value={seo.robots?.follow !== false}
			onChange={(e: any) => setNested('robots', 'follow', e.target.checked)}
		/>
		<VSwitch
			label='Prevent archiving'
			helper='Adds noarchive. Stops Google offering a cached copy.'
			value={seo.robots?.noArchive === true}
			onChange={(e: any) => setNested('robots', 'noArchive', e.target.checked)}
		/>
		<VSwitch
			label='Prevent image indexing'
			helper="Adds noimageindex. Keeps this page's images out of Google Images."
			value={seo.robots?.noImageIndex === true}
			onChange={(e: any) => setNested('robots', 'noImageIndex', e.target.checked)}
		/>

		<SimpleGrid
			columns={{ base: 1, md: 2 }}
			gap={4}>
			<Field
				label='Max snippet length'
				helper='-1 lets Google choose. 0 suppresses the snippet entirely.'>
				<Input
					type='number'
					size='sm'
					px={3}
					min={-1}
					value={seo.robots?.maxSnippet ?? -1}
					onChange={e => {
						const n = parseInt(e.target.value, 10);
						setNested('robots', 'maxSnippet', Number.isNaN(n) ? -1 : n);
					}}
				/>
			</Field>
			<Field label='Max image preview'>
				<SelectContainer
					value={seo.robots?.maxImagePreview || 'large'}
					onChange={(e: any) => setNested('robots', 'maxImagePreview', e.target.value)}>
					{IMAGE_PREVIEW_OPTIONS.map(option => (
						<option
							key={option.value}
							value={option.value}>
							{option.label}
						</option>
					))}
				</SelectContainer>
			</Field>
		</SimpleGrid>
	</Flex>
);

/** Schema type, custom JSON-LD, breadcrumb label. */
export const SeoStructuredFields: FC<SectionProps> = ({ seo, set, a }) => (
	<Flex
		direction='column'
		gap={5}>
		<Note>
			Structured data is what earns rich results — star ratings, prices, FAQ accordions, breadcrumbs. The frontend
			builds it from this page&apos;s own content; you only need to touch this to override the choice.
		</Note>

		<Field label='Schema type'>
			<SelectContainer
				value={seo.schemaType || 'auto'}
				onChange={(e: any) => set('schemaType', e.target.value)}>
				{SCHEMA_TYPE_OPTIONS.map(option => (
					<option
						key={option.value}
						value={option.value}>
						{option.label}
					</option>
				))}
			</SelectContainer>
		</Field>

		<Field
			label='Custom JSON-LD'
			helper='Merged over the generated schema, so anything you set here wins. Must be a valid JSON object. Invalid JSON is ignored by the frontend rather than breaking the page.'>
			<Textarea
				size='sm'
				px={3}
				py={2}
				minH='180px'
				fontFamily='mono'
				fontSize='12px'
				placeholder={'{\n  "@type": "Product",\n  "brand": "Your Brand"\n}'}
				value={seo.schemaJson || ''}
				onChange={e => set('schemaJson', e.target.value)}
			/>
			<JsonStatus value={seo.schemaJson} />
		</Field>

		<Field
			label='Breadcrumb label'
			helper='Overrides how this page is named in the breadcrumb trail. Useful when the page title is long.'>
			<Input
				size='sm'
				px={3}
				placeholder={a.fallbackTitle}
				value={seo.breadcrumbTitle || ''}
				onChange={e => set('breadcrumbTitle', e.target.value)}
			/>
		</Field>
	</Flex>
);

/** sitemap.xml: in or out, priority, change frequency. */
export const SeoSitemapFields: FC<SectionProps> = ({ seo, setNested }) => (
	<Flex
		direction='column'
		gap={5}>
		<VSwitch
			label='Include in sitemap.xml'
			helper='Turning this off only removes the URL from the sitemap. To keep it out of search results, switch off indexing instead.'
			value={seo.sitemap?.include !== false}
			onChange={(e: any) => setNested('sitemap', 'include', e.target.checked)}
		/>

		<SimpleGrid
			columns={{ base: 1, md: 2 }}
			gap={4}>
			<Field
				label='Priority'
				helper='0 to 1, relative to your own pages. A hint only — crawlers weight it lightly.'>
				<Input
					type='number'
					size='sm'
					px={3}
					min={0}
					max={1}
					step={0.1}
					value={seo.sitemap?.priority ?? 0.7}
					onChange={e => {
						const n = parseFloat(e.target.value);
						setNested('sitemap', 'priority', Number.isNaN(n) ? 0.7 : n);
					}}
				/>
			</Field>

			<Field
				label='Change frequency'
				helper='How often the content actually changes. Claiming "always" for a static page is ignored.'>
				<SelectContainer
					value={seo.sitemap?.changeFrequency || 'weekly'}
					onChange={(e: any) => setNested('sitemap', 'changeFrequency', e.target.value)}>
					{CHANGE_FREQUENCY_OPTIONS.map(option => (
						<option
							key={option.value}
							value={option.value}>
							{option.label}
						</option>
					))}
				</SelectContainer>
			</Field>
		</SimpleGrid>
	</Flex>
);

/* ---------------------------------------------------------------- score */

export const GRADE: Record<ScoreStatus, { word: string; pair: { light: string; dark: string } }> = {
	good: { word: 'Good', pair: SUCCESS },
	ok: { word: 'Needs work', pair: WARNING },
	bad: { word: 'Poor', pair: DANGER },
};

/**
 * The SEO score (docs/seo SEO-01): 0–100 and each check, problems first, with
 * what to do about each. Worked out in seoScore.ts on every keystroke.
 */
export const SeoScore: FC<{ result: ScoreResult; note: string }> = ({ result, note }) => (
	<Box
		id='seo-score'
		borderWidth='1px'
		borderColor='border'
		_dark={{ borderColor: 'whiteAlpha.300' }}
		borderRadius='lg'
		p={4}>
		<Flex
			align='center'
			gap={3}
			mb={3}>
			<Flex
				w='44px'
				h='44px'
				flexShrink={0}
				align='center'
				justify='center'
				borderRadius='full'
				borderWidth='3px'
				borderColor={GRADE[result.grade].pair.light}
				_dark={{ borderColor: GRADE[result.grade].pair.dark }}>
				<Text
					fontSize='14px'
					fontWeight='700'
					{...tone(GRADE[result.grade].pair)}>
					{result.score}
				</Text>
			</Flex>
			<Box>
				<Text
					fontSize='13px'
					fontWeight='600'
					{...tone(TEXT_STRONG)}>
					SEO score · {GRADE[result.grade].word}
				</Text>
				<Text
					fontSize='11px'
					{...tone(TEXT_MUTED)}>
					{note}{' '}
					<Box
						as='a'
						fontSize='inherit'
						textDecoration='underline'
						{...{ href: `${DOCS_URL}/websites#seo-score`, target: '_blank', rel: 'noreferrer' }}>
						How the score works
					</Box>
				</Text>
			</Box>
		</Flex>
		<Grid gap={2}>
			{result.checks.map(check => (
				<Flex
					key={check.key}
					align='flex-start'
					gap={2}>
					<Box
						mt='3px'
						w='10px'
						h='10px'
						borderRadius='full'
						flexShrink={0}
						bg={GRADE[check.status].pair.light}
						_dark={{ bg: GRADE[check.status].pair.dark }}
					/>
					<Box>
						<Text
							fontSize='12px'
							{...tone(check.status === 'good' ? TEXT_MUTED : TEXT_STRONG)}>
							{check.label}
						</Text>
						{check.advice && (
							<Text
								fontSize='11px'
								{...tone(TEXT_MUTED)}>
								{check.advice}
							</Text>
						)}
					</Box>
				</Flex>
			))}
		</Grid>
	</Box>
);
