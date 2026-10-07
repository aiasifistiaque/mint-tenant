'use client';

import { FC } from 'react';
import { Button, Flex, Text } from '@chakra-ui/react';
import GuideLink from '@/components/library/tenant/GuideLink';
import type { SiteConfig } from '@/components/library/store/services/tenantApi';
import { Rows, SettingCard, useDraft, useSave } from './parts';

/** Redirects & headers, and Domains: lists saved whole. */

type Props = { config: SiteConfig; canBuild: boolean; canDomains: boolean };

const Redirects: FC<Props> = ({ config, canBuild }) => {
	const { draft, replace, reset, dirty } = useDraft(config.redirects);
	const { save, saving, error } = useSave('Redirects');
	return (
		<SettingCard
			id='redirects'
			title='Redirects'
			description='Send old addresses to new ones. Your site applies them from the site API.'
			aside={<GuideLink section='redirects' />}
			dirty={dirty}
			saving={saving}
			error={error}
			disabled={!canBuild}
			onReset={reset}
			onSave={() => save({ redirects: draft.filter(r => r.from?.trim() || r.to?.trim()) })}>
			<Rows
				rows={draft}
				onChange={replace}
				blank={{ from: '', to: '', permanent: true }}
				columns={[
					{ key: 'from', placeholder: '/old-page', mono: true },
					{ key: 'to', placeholder: '/new-page or https://…', mono: true },
				]}
				extra={(row, set) => (
					<Button
						size='xs'
						variant='outline'
						flexShrink={0}
						onClick={() => set({ permanent: !row.permanent })}
						title='Permanent (301) tells search engines the page moved for good; temporary is 302'>
						{row.permanent ? '301 permanent' : '302 temporary'}
					</Button>
				)}
				addLabel='Add redirect'
				empty='No redirects.'
			/>
		</SettingCard>
	);
};

const Headers: FC<Props> = ({ config, canBuild }) => {
	const { draft, replace, reset, dirty } = useDraft(config.headers);
	const { save, saving, error } = useSave('Response headers');
	return (
		<SettingCard
			title='Response headers'
			description='Headers your site sends with its pages — security headers, caching.'
			dirty={dirty}
			saving={saving}
			error={error}
			disabled={!canBuild}
			onReset={reset}
			onSave={() => save({ headers: draft.filter(h => h.name?.trim() || h.value?.trim()) })}>
			<Rows
				rows={draft}
				onChange={replace}
				blank={{ source: '/(.*)', name: '', value: '' }}
				columns={[
					{ key: 'source', placeholder: '/(.*)', width: '140px', mono: true },
					{ key: 'name', placeholder: 'X-Frame-Options', width: '220px', mono: true },
					{ key: 'value', placeholder: 'DENY', mono: true },
				]}
				addLabel='Add header'
				empty='No extra headers.'
			/>
		</SettingCard>
	);
};

export const RedirectsTab: FC<Props> = props => (
	<Flex
		direction='column'
		gap={4}>
		<Redirects {...props} />
		<Headers {...props} />
	</Flex>
);

export const DomainsTab: FC<Props> = ({ config, canDomains }) => {
	const saved = config.domains.map(domain => ({ domain }));
	const { draft, replace, reset, dirty } = useDraft(saved);
	const { save, saving, error } = useSave('Domains');
	return (
		<SettingCard
			id='domains'
			title='Domains'
			description='Where your site is live. Analytics only counts visits from these (and localhost while you build); Check the site uses the first.'
			aside={<GuideLink section='site-domains' />}
			dirty={dirty}
			saving={saving}
			error={error}
			disabled={!canDomains}
			onReset={reset}
			onSave={() => save({ domains: draft.map(r => r.domain.trim().toLowerCase()).filter(Boolean) })}>
			<Rows
				rows={draft}
				onChange={replace}
				blank={{ domain: '' }}
				columns={[{ key: 'domain', placeholder: 'example.com' }]}
				addLabel='Add domain'
				empty='No domains yet — visits from any site are counted.'
			/>
			{!canDomains && (
				<Text
					fontSize='12px'
					color='fg.muted'
					mt={2}>
					Changing domains needs the Manage projects permission.
				</Text>
			)}
		</SettingCard>
	);
};
