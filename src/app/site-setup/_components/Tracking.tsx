'use client';

import { FC, useState } from 'react';
import { Box, Button, Flex, Input, Text } from '@chakra-ui/react';
import { KeyRound } from 'lucide-react';
import GuideLink from '@/components/library/tenant/GuideLink';
import type { SiteCheck, SiteConfig, SiteTracking } from '@/components/library/store/services/tenantApi';
import { CheckBadge, Field, SettingCard, TextField, Toggle, useDraft, useSave } from './parts';

/**
 * Tracking: each tag on its own card with its own Save (the AGS Analytics
 * tab), grouped by what it's for; the last "Check the site" result beside
 * each. Server-side tracking is its own tab.
 */

type Props = { config: SiteConfig; canBuild: boolean };
type TagKey = Exclude<keyof SiteTracking, 'mintAnalytics'>;

const TAGS: { group: string; items: { key: TagKey; label: string; placeholder: string; description: string; source: string }[] }[] = [
	{
		group: 'Google',
		items: [
			{
				key: 'ga4',
				label: 'Google Analytics 4',
				placeholder: 'G-XXXXXXXXXX',
				description: 'Page views and events in Google Analytics. Admin → Data streams → your web stream → Measurement ID. Leave it empty if GA4 is set up inside your Tag Manager container.',
				source: 'https://analytics.google.com/',
			},
			{
				key: 'gtm',
				label: 'Google Tag Manager',
				placeholder: 'GTM-XXXXXXX',
				description: 'Loads your Tag Manager container on every page, so you can manage other tags there without changing the site. The container ID is at the top of Tag Manager.',
				source: 'https://tagmanager.google.com/',
			},
			{
				key: 'googleAds',
				label: 'Google Ads',
				placeholder: 'AW-123456789',
				description: 'Conversion tracking and remarketing for Google Ads. Tools → Conversions → Tag setup → Install the tag yourself.',
				source: 'https://ads.google.com/',
			},
		],
	},
	{
		group: 'Ad pixels',
		items: [
			{
				key: 'metaPixel',
				label: 'Meta Pixel',
				placeholder: '1234567890123456',
				description: 'Facebook and Instagram ads: page views, conversions and retargeting audiences. Events Manager → Data sources → your pixel’s ID.',
				source: 'https://business.facebook.com/events_manager2/list/pixel/',
			},
			{
				key: 'tiktokPixel',
				label: 'TikTok Pixel',
				placeholder: 'C1234567890ABCDEFGHI',
				description: 'Page views and conversions for TikTok ads. Ads Manager → Tools → Events → Web events.',
				source: 'https://ads.tiktok.com/',
			},
			{
				key: 'linkedinPartner',
				label: 'LinkedIn Insight Tag',
				placeholder: '1234567',
				description: 'Conversions and audiences for LinkedIn ads. Campaign Manager → Analyze → Insight tag → the Partner ID.',
				source: 'https://www.linkedin.com/campaignmanager/',
			},
			{
				key: 'pinterestTag',
				label: 'Pinterest Tag',
				placeholder: '2612345678901',
				description: 'Page views and conversions for Pinterest ads. Ads → Conversions → the Tag ID.',
				source: 'https://ads.pinterest.com/',
			},
			{
				key: 'xPixel',
				label: 'X (Twitter) Pixel',
				placeholder: 'o1a2b',
				description: 'Conversions and audiences for X ads. Ads → Tools → Events manager → the pixel ID.',
				source: 'https://ads.x.com/',
			},
			{
				key: 'snapPixel',
				label: 'Snap Pixel',
				placeholder: 'a1b2c3d4-e5f6-…',
				description: 'Page views and conversions for Snapchat ads. Ads Manager → Events Manager → the Pixel ID.',
				source: 'https://ads.snapchat.com/',
			},
		],
	},
	{
		group: 'How visitors use the site',
		items: [
			{
				key: 'clarity',
				label: 'Microsoft Clarity',
				placeholder: 'abcd1234ef',
				description: 'Free session recordings and heatmaps. Settings → Overview → Project ID.',
				source: 'https://clarity.microsoft.com/',
			},
			{
				key: 'hotjar',
				label: 'Hotjar',
				placeholder: '1234567',
				description: 'Heatmaps, recordings and surveys. Sites & Organizations → the Site ID.',
				source: 'https://insights.hotjar.com/',
			},
		],
	},
];

const checkOf = (check: SiteCheck | null, key: string) => check?.items?.find(i => i.key === key);

const TagCard: FC<Props & { tag: (typeof TAGS)[number]['items'][number] }> = ({ config, canBuild, tag }) => {
	const saved = { value: config.tracking[tag.key] || '' };
	const { draft, set, reset, dirty } = useDraft(saved);
	const { save, saving, error } = useSave(tag.label);
	const result = checkOf(config.check, tag.key);
	const fresh = result && result.configured === saved.value;
	return (
		<SettingCard
			id={`tag-${tag.key}`}
			title={tag.label}
			description={tag.description}
			badge={fresh ? <CheckBadge status={result.status} /> : null}
			source={{ href: tag.source }}
			dirty={dirty}
			saving={saving}
			error={error}
			disabled={!canBuild}
			onReset={reset}
			onSave={() => save({ tracking: { [tag.key]: draft.value.trim() } })}>
			<Input
				size='sm'
				fontFamily='mono'
				fontSize='12.5px'
				placeholder={tag.placeholder}
				value={draft.value}
				onChange={e => set({ value: e.target.value })}
			/>
			{fresh && result.status !== 'ok' && (
				<Text
					fontSize='12px'
					color={result.status === 'missing' ? 'red.fg' : 'orange.fg'}
					mt={2}>
					{result.message}
				</Text>
			)}
		</SettingCard>
	);
};

const MintAnalytics: FC<Props> = ({ config, canBuild }) => {
	const saved = { on: config.tracking.mintAnalytics };
	const { draft, set, reset, dirty } = useDraft(saved);
	const { save, saving, error } = useSave('MINT analytics');
	return (
		<SettingCard
			title='MINT analytics'
			description='Counts visits for this project’s Analytics page — cookie-free, nothing to set up. Off, the script still adds your tags but counts nothing.'
			aside={<GuideLink section='tracking' />}
			dirty={dirty}
			saving={saving}
			error={error}
			disabled={!canBuild}
			onReset={reset}
			onSave={() => save({ tracking: { mintAnalytics: draft.on } })}>
			<Toggle
				label='Count visits'
				checked={draft.on}
				onChange={on => set({ on })}
			/>
		</SettingCard>
	);
};

const GroupTitle: FC<{ children: string }> = ({ children }) => (
	<Text
		fontSize='11.5px'
		fontWeight='600'
		color='fg.muted'
		textTransform='uppercase'
		letterSpacing='0.04em'
		mt={2}>
		{children}
	</Text>
);

export const TrackingTab: FC<Props> = props => {
	const t = props.config.tracking;
	return (
		<Flex
			direction='column'
			gap={4}>
			<Text
				fontSize='12.5px'
				color='fg.muted'>
				Paste an ID and save — your site’s analytics script adds the tag to every page, no code change. Check the site (last tab) to see them live.
			</Text>
			<MintAnalytics {...props} />
			{TAGS.map(g => (
				<Flex
					key={g.group}
					direction='column'
					gap={4}>
					<GroupTitle>{g.group}</GroupTitle>
					{g.group === 'Google' && t.gtm && t.ga4 && (
						<Text
							fontSize='12.5px'
							color='orange.fg'>
							Both Tag Manager and a Google Analytics ID are set. If your Tag Manager container also loads Google Analytics, every visit is counted twice — clear one.
						</Text>
					)}
					{g.items.map(tag => (
						<TagCard
							key={tag.key}
							tag={tag}
							{...props}
						/>
					))}
				</Flex>
			))}
		</Flex>
	);
};

/* -------------------------------------------------------- server-side */

/** A key the server keeps: shows only whether one is saved, with Replace / Remove. */
const SecretInput: FC<{ label: string; help: string; isSet: boolean; value: string; removing: boolean; onChange: (v: string) => void; onRemove: (v: boolean) => void }> = ({
	label,
	help,
	isSet,
	value,
	removing,
	onChange,
	onRemove,
}) => {
	const [replacing, setReplacing] = useState(false);
	const showInput = !isSet || replacing;
	return (
		<Field
			label={label}
			help={help}>
			{showInput ? (
				<Flex gap={2}>
					<Input
						size='sm'
						type='password'
						autoComplete='off'
						fontFamily='mono'
						fontSize='12.5px'
						placeholder={isSet ? 'Paste the new one' : 'Paste it here'}
						value={value}
						onChange={e => onChange(e.target.value.trim())}
					/>
					{isSet && (
						<Button
							size='sm'
							variant='ghost'
							onClick={() => {
								setReplacing(false);
								onChange('');
							}}>
							Cancel
						</Button>
					)}
				</Flex>
			) : (
				<Flex
					align='center'
					gap={2}
					px={3}
					h='32px'
					borderWidth='1px'
					borderColor='border'
					borderRadius='md'
					fontSize='12.5px'>
					<KeyRound size={13} />
					<Text flex={1}>{removing ? 'Will be removed when you save' : 'Saved — kept on the server, never shown again'}</Text>
					{!removing && (
						<Button
							size='2xs'
							variant='ghost'
							onClick={() => setReplacing(true)}>
							Replace
						</Button>
					)}
					<Button
						size='2xs'
						variant='ghost'
						color={removing ? undefined : 'red.fg'}
						onClick={() => onRemove(!removing)}>
						{removing ? 'Keep' : 'Remove'}
					</Button>
				</Flex>
			)}
		</Field>
	);
};

const MetaCapi: FC<Props> = ({ config, canBuild }) => {
	const s = config.serverSide.meta;
	const saved = { enabled: s.enabled, testEventCode: s.testEventCode, token: '', remove: false };
	const { draft, set, reset, dirty } = useDraft(saved);
	const { save, saving, error } = useSave('Meta Conversions API');
	const result = config.check?.serverSide?.meta;
	const onSave = () =>
		save({
			serverSide: { meta: { enabled: draft.remove ? false : draft.enabled, testEventCode: draft.testEventCode.trim() } },
			...((draft.token || draft.remove) && { secrets: { metaAccessToken: draft.remove ? '' : draft.token } }),
		});
	return (
		<SettingCard
			id='meta-capi'
			title='Meta Conversions API'
			description='Sends page views, leads (records your site sends in) and sign-ups to Meta from this server as well as from the browser, so ad blockers and iOS don’t hide them. The pixel and the server send each page view with the same event id, so Meta counts it once.'
			badge={result ? <CheckBadge status={result.ok ? 'ok' : result.ok === false ? 'warning' : 'idle'} /> : null}
			source={{ href: 'https://business.facebook.com/events_manager2/list/pixel/', label: 'Events Manager → your pixel → Settings → Conversions API' }}
			dirty={dirty}
			saving={saving}
			error={error}
			disabled={!canBuild}
			onReset={reset}
			onSave={onSave}>
			<Flex
				direction='column'
				gap={4}>
				{!config.tracking.metaPixel && (
					<Text
						fontSize='12.5px'
						color='orange.fg'>
						Add your Meta Pixel ID on the Tracking tab first.
					</Text>
				)}
				<Toggle
					label='Send events from the server'
					checked={draft.enabled && !draft.remove}
					disabled={draft.remove}
					onChange={enabled => set({ enabled })}
				/>
				<SecretInput
					key={config.updatedAt}
					label='Access token'
					help='Generate it in the pixel’s Conversions API settings (“Generate access token”).'
					isSet={s.tokenSet}
					value={draft.token}
					removing={draft.remove}
					onChange={token => set({ token })}
					onRemove={remove => set({ remove })}
				/>
				<TextField
					label='Test event code'
					help='Optional — from Events Manager’s Test events tab while you check it works. Clear it before going live: events with a code only show there.'
					mono
					placeholder='TEST12345'
					value={draft.testEventCode}
					onChange={testEventCode => set({ testEventCode })}
				/>
				{result && (
					<Text
						fontSize='12px'
						color={result.ok ? 'fg.muted' : 'orange.fg'}>
						Last check: {result.note}
					</Text>
				)}
			</Flex>
		</SettingCard>
	);
};

const Ga4Mp: FC<Props> = ({ config, canBuild }) => {
	const s = config.serverSide.ga4;
	const saved = { enabled: s.enabled, secret: '', remove: false };
	const { draft, set, reset, dirty } = useDraft(saved);
	const { save, saving, error } = useSave('Google Analytics server-side');
	const onSave = () =>
		save({
			serverSide: { ga4: { enabled: draft.remove ? false : draft.enabled } },
			...((draft.secret || draft.remove) && { secrets: { ga4ApiSecret: draft.remove ? '' : draft.secret } }),
		});
	return (
		<SettingCard
			id='ga4-mp'
			title='Google Analytics — Measurement Protocol'
			description='Sends generate_lead (records your site sends in) and sign_up (customers who register) to Google Analytics from this server. Page views stay with the browser tag: Google can’t match a server page view to the browser’s, so it would count it twice.'
			source={{ href: 'https://analytics.google.com/', label: 'Admin → Data streams → your stream → Measurement Protocol API secrets' }}
			dirty={dirty}
			saving={saving}
			error={error}
			disabled={!canBuild}
			onReset={reset}
			onSave={onSave}>
			<Flex
				direction='column'
				gap={4}>
				{!config.tracking.ga4 && (
					<Text
						fontSize='12.5px'
						color='orange.fg'>
						Add your Google Analytics ID on the Tracking tab first.
					</Text>
				)}
				<Toggle
					label='Send events from the server'
					checked={draft.enabled && !draft.remove}
					disabled={draft.remove}
					onChange={enabled => set({ enabled })}
				/>
				<SecretInput
					key={config.updatedAt}
					label='API secret'
					help='Create one under Measurement Protocol API secrets on your web data stream.'
					isSet={s.secretSet}
					value={draft.secret}
					removing={draft.remove}
					onChange={secret => set({ secret })}
					onRemove={remove => set({ remove })}
				/>
			</Flex>
		</SettingCard>
	);
};

export const ServerSideTab: FC<Props> = props => (
	<Flex
		direction='column'
		gap={4}>
		<Box>
			<Text
				fontSize='12.5px'
				color='fg.muted'>
				Browsers block a good share of tracking. With server-side tracking on, this server also sends what happens on your site straight to the ad platform — matched to the
				visitor by their IP address, browser and the platform’s own cookie, never their raw email or phone (those are hashed first). The keys stay on the server.
			</Text>
			<Text
				mt={2}
				fontSize='12.5px'
				color='fg.muted'>
				Forms your site sends in should add <code>window.MintAnalytics?.headers()</code> to the request’s headers, so a lead is matched to the visitor who sent it.{' '}
				<GuideLink
					section='server-side'
					label='How this works'
				/>
			</Text>
		</Box>
		<MetaCapi {...props} />
		<Ga4Mp {...props} />
	</Flex>
);
