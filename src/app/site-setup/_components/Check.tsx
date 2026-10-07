'use client';

import { FC } from 'react';
import { Badge, Box, Flex, Text } from '@chakra-ui/react';
import { CircleCheck, CircleAlert, CircleX } from 'lucide-react';
import moment from 'moment';
import { useCheckSiteMutation } from '@/components/library';
import GuideLink from '@/components/library/tenant/GuideLink';
import type { SiteCheck, SiteConfig } from '@/components/library/store/services/tenantApi';
import { SettingCard, errorText } from './parts';

/**
 * Check the site (AGS's Test Analytics): fetches the live home page and shows,
 * for each tag set here, whether it's on the site — and any tag the page has
 * that isn't set here. Google and Meta confirm IDs and keys where they can.
 */

type Props = { config: SiteConfig; canBuild: boolean };

const TONE = {
	ok: { color: 'green.fg', icon: CircleCheck, label: 'On the site' },
	warning: { color: 'orange.fg', icon: CircleAlert, label: 'Check this' },
	missing: { color: 'red.fg', icon: CircleX, label: 'Not on the site' },
	idle: { color: 'fg.muted', icon: CircleAlert, label: '' },
} as const;

const Row: FC<{ status: keyof typeof TONE; label: string; detail?: string; message: string }> = ({ status, label, detail, message }) => {
	const t = TONE[status];
	const Icon = t.icon;
	return (
		<Flex
			gap={3}
			px={4}
			py={3}
			borderTopWidth='1px'
			borderColor='border.muted'
			align='flex-start'>
			<Box
				color={t.color}
				mt='2px'>
				<Icon size={16} />
			</Box>
			<Box
				flex={1}
				minW={0}>
				<Flex
					align='center'
					gap={2}
					wrap='wrap'>
					<Text
						fontSize='13px'
						fontWeight='600'>
						{label}
					</Text>
					{detail && (
						<Text
							fontSize='12px'
							fontFamily='mono'
							color='fg.muted'>
							{detail}
						</Text>
					)}
				</Flex>
				<Text
					fontSize='12.5px'
					color='fg.muted'
					mt={0.5}>
					{message}
				</Text>
			</Box>
		</Flex>
	);
};

const Result: FC<{ check: SiteCheck }> = ({ check }) => {
	const serverSide = Object.entries(check.serverSide || {}) as [string, { ok: boolean | null; note: string }][];
	return (
		<Box
			borderWidth='1px'
			borderColor='border'
			borderRadius='md'
			overflow='hidden'>
			<Flex
				px={4}
				py={3}
				gap={3}
				align='center'
				justify='space-between'
				wrap='wrap'
				bg='bg.subtle'>
				<Box>
					<Text
						fontSize='13px'
						fontWeight='600'>
						{check.origin || 'No domain yet'}
					</Text>
					<Text
						fontSize='12px'
						color={check.reachable ? 'fg.muted' : 'red.fg'}>
						{check.message}
					</Text>
				</Box>
				<Text
					fontSize='12px'
					color='fg.muted'
					title={moment(check.checkedAt).format('D MMM YYYY, h:mm:ss A')}>
					Checked {moment(check.checkedAt).fromNow()}
				</Text>
			</Flex>
			{check.items.map(i => (
				<Row
					key={i.key}
					status={i.status}
					label={i.label}
					detail={i.configured}
					message={i.message}
				/>
			))}
			{check.extra.map(e => (
				<Row
					key={e.key}
					status='warning'
					label={e.label}
					detail={e.ids.join(', ')}
					message='On the site, but not set here — the page adds it itself. Fine if that’s on purpose; set it here instead to manage it from the panel.'
				/>
			))}
			{serverSide.map(([key, r]) => (
				<Row
					key={key}
					status={r.ok ? 'ok' : r.ok === false ? 'warning' : 'idle'}
					label={key === 'meta' ? 'Meta Conversions API' : 'Google Analytics server-side'}
					message={r.note}
				/>
			))}
			{check.reachable && !check.items.length && !check.extra.length && !serverSide.length && (
				<Text
					px={4}
					py={3}
					borderTopWidth='1px'
					borderColor='border.muted'
					fontSize='12.5px'
					color='fg.muted'>
					No tags set yet — add them on the Tracking tab.
				</Text>
			)}
		</Box>
	);
};

export const CheckTab: FC<Props> = ({ config, canBuild }) => {
	const [run, { isLoading, error }] = useCheckSiteMutation();
	return (
		<SettingCard
			id='check'
			title='Check the site'
			description='Opens your live site’s home page now — not this panel — and checks every tag set here is on it, and whether the page adds others of its own. Google and Meta confirm the IDs and keys where they allow it.'
			badge={
				config.check ? (
					<Badge
						size='sm'
						variant='subtle'
						colorPalette={!config.check.reachable ? 'red' : config.check.items.some(i => i.status !== 'ok') ? 'orange' : 'green'}>
						{!config.check.reachable ? 'Couldn’t check' : config.check.items.some(i => i.status !== 'ok') ? 'Needs a look' : 'All good'}
					</Badge>
				) : null
			}
			aside={error ? <Text color='red.fg'>{errorText(error)}</Text> : <GuideLink section='site-check' />}
			ready
			saving={isLoading}
			disabled={!canBuild || !config.origin}
			saveLabel={config.check ? 'Check again' : 'Check now'}
			onSave={() => run()}>
			{config.check ? (
				<Result check={config.check} />
			) : (
				<Text
					fontSize='12.5px'
					color='fg.muted'>
					Not checked yet. {config.origin ? `It will open ${config.origin}.` : 'Add your domain on the Domains tab first.'}
				</Text>
			)}
		</SettingCard>
	);
};
