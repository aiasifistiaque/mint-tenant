'use client';

import { FC, useCallback } from 'react';
import { Box, Flex, Tabs, Text } from '@chakra-ui/react';

import { Label } from '../../..';
import { TEXT_MUTED, tone } from './constants';
import SerpPreview from './SerpPreview';
import {
	GRADE,
	Note,
	SeoBasicsFields,
	SeoIndexingFields,
	SeoScore,
	SeoSitemapFields,
	SeoSocialFields,
	SeoStructuredFields,
	useSeoAnalysis,
	useSeoSetters,
} from './parts';

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
 *
 * The fields of each tab live in parts.tsx, shared with an SEO record's own
 * page (app/t/_seo/SeoRecordPage).
 */
const VSeo: FC<Props> = ({ value, onChange, name, label, helper, formData }) => {
	const seo = value && typeof value === 'object' ? value : {};

	const emit = useCallback(
		(next: any) => {
			onChange({ target: { name, value: next } });
		},
		[onChange, name]
	);
	const { set, setNested } = useSeoSetters(seo, emit);
	const a = useSeoAnalysis(seo, formData);
	const section = { seo, set, setNested, a };

	return (
		<Box w='full'>
			{/* The surrounding accordion already titles this section 'SEO', so the
			    field label would only repeat it — shown only when this field is
			    dropped in somewhere that doesn't already title the section. */}
			{label && <Label mb={2}>{label}</Label>}

			<Box>
				<SerpPreview
					title={seo.metaTitle || a.fallbackTitle}
					description={seo.metaDescription || a.fallbackDescription}
					path={a.previewPath}
					host={a.siteHost}
				/>
				<Flex
					mt={2}
					align='center'
					gap={2}
					fontSize='12px'>
					<Text {...tone(TEXT_MUTED)}>SEO score</Text>
					<Text
						fontWeight='700'
						{...tone(GRADE[a.score.grade].pair)}>
						{a.score.score} · {GRADE[a.score.grade].word}
					</Text>
					<Text {...tone(TEXT_MUTED)}>— the checks are under Basics</Text>
				</Flex>
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

				<Tabs.Content
					value='basics'
					px={0}>
					<Flex
						direction='column'
						gap={5}>
						<SeoBasicsFields {...section} />
						<SeoScore
							result={a.score}
							note={a.wordsFrom}
						/>
					</Flex>
				</Tabs.Content>
				<Tabs.Content
					value='social'
					px={0}>
					<SeoSocialFields {...section} />
				</Tabs.Content>
				<Tabs.Content
					value='indexing'
					px={0}>
					<SeoIndexingFields {...section} />
				</Tabs.Content>
				<Tabs.Content
					value='structured'
					px={0}>
					<SeoStructuredFields {...section} />
				</Tabs.Content>
				<Tabs.Content
					value='sitemap'
					px={0}>
					<SeoSitemapFields {...section} />
				</Tabs.Content>
			</Tabs.Root>

			{helper && <Note mt={4}>{helper}</Note>}
		</Box>
	);
};

const TAB_ITEMS = [
	{ value: 'basics', label: 'Basics' },
	{ value: 'social', label: 'Social' },
	{ value: 'indexing', label: 'Indexing' },
	{ value: 'structured', label: 'Structured data' },
	{ value: 'sitemap', label: 'Sitemap' },
];

export default VSeo;
