'use client';

import { FC } from 'react';
import { Box, Flex, Grid, Text } from '@chakra-ui/react';
import { VSeo } from '@/components/library/utils/inputs/VSeo';
import { CopyValue } from '@/components/library/cl';
import GuideLink from '@/components/library/tenant/GuideLink';
import type { SiteConfig } from '@/components/library/store/services/tenantApi';
import { Field, SettingCard, TextField, Toggle, changed, imageValue, useDraft, useSave } from './parts';

/** SEO: the defaults every page falls back to, indexing, and search engine verification. */

type Props = { config: SiteConfig; canBuild: boolean; base: string; apiKey?: string };

const Defaults: FC<Props> = ({ config, canBuild }) => {
	const s = config.seo;
	// The SEO editor's object (SB-33): its meta title, description, share image and keywords are
	// Default SEO's own fields as before; the rest (social, indexing, structured data, sitemap) is `defaults`.
	const saved = {
		metaTitle: s.metaTitle,
		titleTemplate: s.titleTemplate,
		metaDescription: s.metaDescription,
		ogImage: s.ogImage,
		keywords: s.keywords || [],
		defaults: ((s as any).defaults || {}) as Record<string, any>,
	};
	const { draft, set, reset, dirty } = useDraft(saved);
	const { save, saving, error } = useSave('Default SEO');
	const sample = draft.titleTemplate.includes('%s') ? draft.titleTemplate.replace('%s', 'About us') : '';
	const editor = { ...draft.defaults, metaTitle: draft.metaTitle, metaDescription: draft.metaDescription, ogImage: draft.ogImage, keywords: draft.keywords };
	const onEditor = (e: any) => {
		const { metaTitle = '', metaDescription = '', ogImage = '', keywords = [], ...defaults } = e?.target?.value || {};
		set({ metaTitle, metaDescription, ogImage: imageValue(ogImage), keywords, defaults });
	};
	return (
		<SettingCard
			id='seo-defaults'
			title='Default SEO'
			description='The home page’s SEO, and what any page without its own falls back to: share cards, robots and sitemap settings apply to every page that doesn’t set them; titles, descriptions and structured data only to the home page. Each page’s own SEO is under Website → SEO, or a page’s ⋯ → Name, address & SEO in the site builder.'
			aside={<GuideLink section='site-seo' />}
			dirty={dirty}
			saving={saving}
			error={error}
			disabled={!canBuild}
			onReset={reset}
			onSave={() => save({ seo: changed(draft, saved) })}>
			<Box mb={5}>
				<TextField
					label='Title template'
					placeholder='%s · Acme'
					help={sample ? `A page called “About us” shows as “${sample}”` : '%s is where each page’s own title goes'}
					value={draft.titleTemplate}
					onChange={titleTemplate => set({ titleTemplate })}
				/>
			</Box>
			<VSeo
				name='seo'
				value={editor}
				onChange={onEditor}
				formData={{ name: config.identity?.siteName, path: '/' }}
			/>
		</SettingCard>
	);
};

const Indexing: FC<Props> = ({ config, canBuild, base, apiKey }) => {
	const s = config.seo;
	// Extra addresses are edited one per line and saved as a list (docs/seo SEO-08).
	const saved = { indexing: s.indexing, sitemap: s.sitemap, canonicalDomain: s.canonicalDomain, robots: s.robots, sitemapExtra: (s.sitemapExtra || []).join('\n') };
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
			onSave={() => {
				const seo: any = changed(draft, saved);
				if ('sitemapExtra' in seo)
					seo.sitemapExtra = String(seo.sitemapExtra)
						.split('\n')
						.map(l => l.trim())
						.filter(Boolean);
				save({ seo });
			}}>
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
					help='A sitemap.xml of your published pages and every blog post, product or other record your template pages show, named in robots.txt. Anything marked “Hide from search engines” is left out.'
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
				{draft.sitemap && (
					<TextField
						label='Extra sitemap addresses'
						help='Pages Mint doesn’t know about, one per line: /old-page, or a full address on your site.'
						placeholder={'/catalogue\n/landing/summer-sale'}
						long
						mono
						rows={3}
						value={draft.sitemapExtra}
						onChange={sitemapExtra => set({ sitemapExtra })}
					/>
				)}
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
							<CopyValue value={`${base}/site/robots.txt?apiKey=${apiKey}`} />
						</Field>
						<Field label='sitemap.xml'>
							<CopyValue value={`${base}/site/sitemap.xml?apiKey=${apiKey}`} />
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
