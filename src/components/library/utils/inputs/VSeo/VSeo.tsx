'use client';

import { FC, ReactNode, useCallback } from 'react';
import {
	Box,
	Button,
	Flex,
	Grid,
	Image,
	SimpleGrid,
	Tabs,
	Text,
	Textarea as ChakraTextarea,
	TextareaProps,
} from '@chakra-ui/react';

import {
	FormControl,
	HelperText,
	Input,
	Label,
	SelectContainer,
	UploadModal,
	VTags,
	VSwitch,
	styles,
} from '../../..';

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
import {
	CHANGE_FREQUENCY_OPTIONS,
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
import SerpPreview from './SerpPreview';
import CharCount from './CharCount';

type Props = {
	value: any;
	onChange: any;
	name: string;
	label?: string;
	helper?: string;
	isRequired?: boolean;
	formData?: any;
};

/**
 * The whole SEO sub-document, edited as one field.
 *
 * The generic form passes `value` (the `seo` object) and `onChange`, and every
 * edit here emits the *entire* object back through the standard synthetic
 * event, so nothing about the surrounding form machinery had to change:
 *
 *   onChange({ target: { name: 'seo', value: nextSeoObject } })
 *
 * Ported from ags-admin's VSeo, which was built against Chakra v2 — this
 * project is on Chakra v3, so every primitive that changed shape (Tabs,
 * Switch, Select, FormControl/Field) was rebuilt against this project's own
 * field components (`FormControl`, `VSwitch`, `SelectContainer`, `VTags`,
 * `UploadModal`) instead of raw Chakra, matching how the rest of this input
 * library is written. The copy, field list and length-window constants are
 * unchanged from the original.
 */
const VSeo: FC<Props> = ({ value, onChange, name, label, helper, formData }) => {
	const seo = value && typeof value === 'object' ? value : {};

	const emit = useCallback(
		(next: any) => {
			onChange({ target: { name, value: next } });
		},
		[onChange, name]
	);

	// Set one top-level key of the sub-document.
	const set = useCallback(
		(key: string, fieldValue: any) => emit({ ...seo, [key]: fieldValue }),
		[emit, seo]
	);

	// Set one key inside `robots` / `sitemap` without losing its siblings.
	const setNested = useCallback(
		(group: string, key: string, fieldValue: any) =>
			emit({ ...seo, [group]: { ...(seo[group] || {}), [key]: fieldValue } }),
		[emit, seo]
	);

	// What the frontend will fall back to when a field is left blank. Showing
	// it as placeholder text is the difference between "empty means broken" and
	// "empty means inherit".
	const fallbackTitle = formData?.name || formData?.title || formData?.page || '';
	const fallbackDescription = formData?.shortDescription || formData?.description || '';

	const previewPath = formData?.path || (formData?.slug ? `/${formData.slug}` : '/');

	return (
		<Box w='full'>
			{/* The surrounding accordion already titles this section 'SEO', so the
			    field label would only repeat it — shown only when this field is
			    dropped in somewhere that doesn't already title the section. */}
			{label && <Label mb={2}>{label}</Label>}

			<Box>
				<SerpPreview
					title={seo.metaTitle || fallbackTitle}
					description={seo.metaDescription || stripHtml(fallbackDescription)}
					path={previewPath}
				/>
			</Box>

			<Tabs.Root
				mt={4}
				size='sm'
				colorPalette='brand'
				variant='subtle'
				defaultValue='basics'
				lazyMount>
				<Tabs.List
					flexWrap='wrap'
					gap={1}
					border='none'>
					{TAB_ITEMS.map(({ value: tabValue, label: tabLabel }) => (
						<Tabs.Trigger
							key={tabValue}
							value={tabValue}
							borderRadius='full'
							px={3}
							{...tone(TEXT_MUTED)}
							// The accent pair, which a colour theme keeps readable
							// against each other in both modes.
							_selected={{
								bg: 'accent.solid',
								color: 'accent.contrast',
							}}>
							{tabLabel}
						</Tabs.Trigger>
					))}
				</Tabs.List>

				{/* ---------------------------------------------------- Basics */}
				<Tabs.Content
					value='basics'
					px={0}>
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
								placeholder={fallbackTitle || 'e.g. Wireless Headphones | Your Brand'}
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
								placeholder={stripHtml(fallbackDescription) || 'One or two sentences about this page.'}
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

						<SeoChecklist
							seo={seo}
							fallbackTitle={fallbackTitle}
							fallbackDescription={stripHtml(fallbackDescription)}
						/>
					</Flex>
				</Tabs.Content>

				{/* ---------------------------------------------------- Social */}
				<Tabs.Content
					value='social'
					px={0}>
					<Flex
						direction='column'
						gap={5}>
						<Note>
							Leave these empty to reuse the meta title, meta description and the page&apos;s
							main image. Fill them in when the social copy should differ.
						</Note>

						<SimpleGrid
							columns={{ base: 1, md: 2 }}
							gap={4}>
							<Field label='Open Graph title'>
								<Input
									size='sm'
									px={3}
									placeholder={seo.metaTitle || fallbackTitle}
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
									placeholder={seo.ogTitle || seo.metaTitle || fallbackTitle}
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
				</Tabs.Content>

				{/* --------------------------------------------------- Indexing */}
				<Tabs.Content
					value='indexing'
					px={0}>
					<Flex
						direction='column'
						gap={5}>
						<Note>
							These become the robots meta tag. The defaults are what you want for a page
							you are trying to rank — only change them deliberately.
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
				</Tabs.Content>

				{/* -------------------------------------------- Structured data */}
				<Tabs.Content
					value='structured'
					px={0}>
					<Flex
						direction='column'
						gap={5}>
						<Note>
							Structured data is what earns rich results — star ratings, prices, FAQ
							accordions, breadcrumbs. The frontend builds it from this page&apos;s own
							content; you only need to touch this to override the choice.
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
								placeholder={fallbackTitle}
								value={seo.breadcrumbTitle || ''}
								onChange={e => set('breadcrumbTitle', e.target.value)}
							/>
						</Field>
					</Flex>
				</Tabs.Content>

				{/* ---------------------------------------------------- Sitemap */}
				<Tabs.Content
					value='sitemap'
					px={0}>
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
				</Tabs.Content>
			</Tabs.Root>

			{helper && <Note mt={4}>{helper}</Note>}
		</Box>
	);
};

/* ------------------------------------------------------------------ helpers */

const TAB_ITEMS = [
	{ value: 'basics', label: 'Basics' },
	{ value: 'social', label: 'Social' },
	{ value: 'indexing', label: 'Indexing' },
	{ value: 'structured', label: 'Structured data' },
	{ value: 'sitemap', label: 'Sitemap' },
];

const stripHtml = (value?: string): string =>
	typeof value === 'string' ? value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '';

/** A labelled field, built on this project's own `FormControl` (a Chakra v3
 *  `Field.Root` wrapper) rather than raw Chakra — matches every other input
 *  in this library (VTextarea, VSelect, …). */
const Field: FC<{ label: string; helper?: string; children: ReactNode }> = ({
	label,
	helper,
	children,
}) => (
	<FormControl
		label={label}
		helper={helper}>
		{children}
	</FormControl>
);

/** Explanatory copy that belongs to a whole tab, not to one input. */
const Note: FC<{ children: ReactNode; mt?: number }> = ({ children, mt }) => (
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

/**
 * The handful of checks that actually move the needle, shown inline so the
 * admin does not have to remember them.
 */
const SeoChecklist: FC<{ seo: any; fallbackTitle: string; fallbackDescription: string }> = ({
	seo,
	fallbackTitle,
	fallbackDescription,
}) => {
	const title = (seo.metaTitle || fallbackTitle || '').toLowerCase();
	const description = (seo.metaDescription || fallbackDescription || '').toLowerCase();
	const keyword = (seo.focusKeyword || '').trim().toLowerCase();

	const checks = [
		{ label: 'Meta title is set', pass: !!(seo.metaTitle || fallbackTitle) },
		{
			label: `Meta title is ${TITLE_MIN}–${TITLE_MAX} characters`,
			pass: title.length >= TITLE_MIN && title.length <= TITLE_MAX,
		},
		{ label: 'Meta description is set', pass: !!(seo.metaDescription || fallbackDescription) },
		{
			label: `Meta description is ${DESCRIPTION_MIN}–${DESCRIPTION_MAX} characters`,
			pass: description.length >= DESCRIPTION_MIN && description.length <= DESCRIPTION_MAX,
		},
		{ label: 'Focus keyword is set', pass: !!keyword },
		{ label: 'Focus keyword appears in the title', pass: !!keyword && title.includes(keyword) },
		{
			label: 'Focus keyword appears in the description',
			pass: !!keyword && description.includes(keyword),
		},
		{ label: 'Social share image is set', pass: !!seo.ogImage },
	];

	const passed = checks.filter(check => check.pass).length;

	return (
		<Box
			borderWidth='1px'
			borderColor='border'
			_dark={{ borderColor: 'whiteAlpha.300' }}
			borderRadius='lg'
			p={4}>
			<Flex
				justify='space-between'
				align='center'
				mb={3}>
				<Text
					fontSize='12px'
					fontWeight='600'
					{...tone(TEXT_STRONG)}>
					SEO checks
				</Text>
				<Text
					fontSize='12px'
					fontWeight='600'
					{...tone(passed === checks.length ? SUCCESS : WARNING)}>
					{passed} / {checks.length}
				</Text>
			</Flex>
			<Grid gap={1}>
				{checks.map(check => (
					<Flex
						key={check.label}
						align='center'
						gap={2}>
						<Box
							w='14px'
							h='14px'
							borderRadius='full'
							flexShrink={0}
							bg={check.pass ? SUCCESS.dark : '#D9DDE3'}
							_dark={{ bg: check.pass ? SUCCESS.dark : '#4A5568' }}
						/>
						<Text
							fontSize='12px'
							{...tone(check.pass ? TEXT_STRONG : TEXT_MUTED)}>
							{check.label}
						</Text>
					</Flex>
				))}
			</Grid>
		</Box>
	);
};

export default VSeo;
