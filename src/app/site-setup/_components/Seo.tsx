'use client';

import { FC } from 'react';
import { Box, Flex, Grid, Text } from '@chakra-ui/react';
import { VImage, VTags } from '@/components/library';
import { CopyValue } from '@/components/library/cl';
import GuideLink from '@/components/library/tenant/GuideLink';
import type { SiteConfig } from '@/components/library/store/services/tenantApi';
import { Field, SettingCard, TextField, Toggle, changed, imageValue, useDraft, useSave } from './parts';

/** SEO: the defaults every page falls back to, indexing, and search engine verification. */

type Props = { config: SiteConfig; canBuild: boolean; base: string };

const Defaults: FC<Props> = ({ config, canBuild }) => {
	const s = config.seo;
	const saved = { metaTitle: s.metaTitle, titleTemplate: s.titleTemplate, metaDescription: s.metaDescription, ogImage: s.ogImage, keywords: s.keywords || [] };
	const { draft, set, reset, dirty } = useDraft(saved);
	const { save, saving, error } = useSave('Default SEO');
	const sample = draft.titleTemplate.includes('%s') ? draft.titleTemplate.replace('%s', 'About us') : '';
	return (
		<SettingCard
			id='seo-defaults'
			title='Default SEO'
			description='Used on any page without its own title, description or share image. Each page’s own are in SEO.'
			aside={<GuideLink section='site-seo' />}
			dirty={dirty}
			saving={saving}
			error={error}
			disabled={!canBuild}
			onReset={reset}
			onSave={() => save({ seo: changed(draft, saved) })}>
			<Grid
				templateColumns={{ base: '1fr', md: '1fr 1fr' }}
				gap={4}>
				<TextField
					label='Default title'
					help={`${draft.metaTitle.length}/60 characters — the home page’s title in search results`}
					value={draft.metaTitle}
					onChange={metaTitle => set({ metaTitle })}
				/>
				<TextField
					label='Title template'
					placeholder='%s · Acme'
					help={sample ? `A page called “About us” shows as “${sample}”` : '%s is where each page’s own title goes'}
					value={draft.titleTemplate}
					onChange={titleTemplate => set({ titleTemplate })}
				/>
				<Box gridColumn={{ md: 'span 2' }}>
					<TextField
						label='Default description'
						long
						help={`${draft.metaDescription.length}/160 characters`}
						value={draft.metaDescription}
						onChange={metaDescription => set({ metaDescription })}
					/>
				</Box>
				<VImage
					label='Default share image'
					helper='1200×630 — shown when a link to your site is shared'
					value={draft.ogImage}
					onChange={(v: any) => set({ ogImage: imageValue(v) })}
					folder='website'
				/>
				<VTags
					label='Keywords'
					helper='Press Enter after each'
					section
					value={draft.keywords}
					onChange={(e: any) => set({ keywords: e.target.value })}
				/>
			</Grid>
		</SettingCard>
	);
};

const Indexing: FC<Props> = ({ config, canBuild, base }) => {
	const s = config.seo;
	const saved = { indexing: s.indexing, sitemap: s.sitemap, canonicalDomain: s.canonicalDomain, robots: s.robots };
	const { draft, set, reset, dirty } = useDraft(saved);
	const { save, saving, error } = useSave('Indexing');
	return (
		<SettingCard
			id='indexing'
			title='Indexing'
			description='Whether search engines list your site, and what they’re told about it.'
			aside={<GuideLink section='indexing' />}
			dirty={dirty}
			saving={saving}
			error={error}
			disabled={!canBuild}
			onReset={reset}
			onSave={() => save({ seo: changed(draft, saved) })}>
			<Flex
				direction='column'
				gap={5}>
				<Toggle
					label='Let search engines index the site'
					help='Off while you build: robots.txt asks every search engine to stay away, and every page says noindex.'
					checked={draft.indexing}
					onChange={indexing => set({ indexing })}
				/>
				<Toggle
					label='Sitemap'
					help='A sitemap.xml of your published pages, named in robots.txt. Pages marked “Hide from search engines” are left out.'
					checked={draft.sitemap}
					onChange={sitemap => set({ sitemap })}
				/>
				<Grid
					templateColumns={{ base: '1fr', md: '1fr 1fr' }}
					gap={4}>
					<TextField
						label='Main domain'
						help='The address search engines should use, e.g. example.com'
						placeholder={config.domains.find(d => !d.startsWith('localhost')) || 'example.com'}
						value={draft.canonicalDomain}
						onChange={v => set({ canonicalDomain: v.trim() })}
					/>
				</Grid>
				<TextField
					label='Extra robots.txt rules'
					help='Added after the defaults, e.g. “Disallow: /private”'
					long
					mono
					rows={4}
					value={draft.robots}
					onChange={robots => set({ robots })}
				/>
				{base && (
					<Grid
						templateColumns={{ base: '1fr', md: '1fr 1fr' }}
						gap={4}>
						<Field label='robots.txt'>
							<CopyValue value={`${base}/site/robots.txt`} />
						</Field>
						<Field label='sitemap.xml'>
							<CopyValue value={`${base}/site/sitemap.xml`} />
						</Field>
					</Grid>
				)}
			</Flex>
		</SettingCard>
	);
};

const Verification: FC<Props> = ({ config, canBuild }) => {
	const s = config.seo;
	const saved = { googleVerification: s.googleVerification, bingVerification: s.bingVerification };
	const { draft, set, reset, dirty } = useDraft(saved);
	const { save, saving, error } = useSave('Verification');
	return (
		<SettingCard
			title='Search engine verification'
			description='Proves to Google and Bing that the site is yours, so you can see how it does in their search.'
			source={{ href: 'https://search.google.com/search-console', label: 'Open Google Search Console' }}
			dirty={dirty}
			saving={saving}
			error={error}
			disabled={!canBuild}
			onReset={reset}
			onSave={() => save({ seo: changed(draft, saved) })}>
			<Grid
				templateColumns={{ base: '1fr', md: '1fr 1fr' }}
				gap={4}>
				<TextField
					label='Google Search Console'
					help='The content="…" of the google-site-verification meta tag (HTML tag method)'
					mono
					value={draft.googleVerification}
					onChange={v => set({ googleVerification: v.trim() })}
				/>
				<TextField
					label='Bing Webmaster Tools'
					help='The content="…" of the msvalidate.01 meta tag'
					mono
					value={draft.bingVerification}
					onChange={v => set({ bingVerification: v.trim() })}
				/>
			</Grid>
			<Text
				fontSize='12px'
				color='fg.muted'
				mt={3}>
				The analytics script adds these to every page.
			</Text>
		</SettingCard>
	);
};

export const SeoTab: FC<Props> = props => (
	<Flex
		direction='column'
		gap={4}>
		<Defaults {...props} />
		<Indexing {...props} />
		<Verification {...props} />
	</Flex>
);
