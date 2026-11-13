'use client';

import { FC } from 'react';
import { Badge, Box, Button, Flex, Text } from '@chakra-ui/react';
import { RefreshCw } from 'lucide-react';
import { Panel, dateTime } from '../../cl';
import GuideLink from '../../tenant/GuideLink';
import { useLazyGetStoreBuyerCheckQuery } from '../../store/services/courierApi';
import type { BuyerCheckAnswer, BuyerLevel, OrderBuyerCheck } from '../../store/services/courierApi';
import { errText } from './CourierCards';

/**
 * The buyer check on screen (backend docs/couriers BUYER_CHECK.md §5, CR-22): how often a phone number takes its
 * parcels — the badge for tables, the answer with a row per courier and the store's own orders, and the order
 * page's card with Check again. Send to courier shows the same answer.
 */

export const LEVEL_LABEL: Record<BuyerLevel, string> = { safe: 'Safe', check: 'Check first', risky: 'Risky', new: 'New buyer' };
const COLOR: Record<BuyerLevel, string> = { safe: 'green', check: 'orange', risky: 'red', new: 'gray' };
/** What to do next, in plain words. */
const NEXT: Record<BuyerLevel, string> = {
	safe: 'Send it as usual.',
	check: 'Call the buyer to confirm before sending.',
	risky: 'Call first, or ask for the delivery charge (or the whole amount) in advance.',
	new: 'Not enough parcels to this number yet to tell — treat it like any new buyer.',
};

/** "Safe · 92 %", "Risky · 31 %", "New buyer". */
export const BuyerBadge: FC<{ level?: BuyerLevel | string; rate?: number | null }> = ({ level, rate }) => {
	if (!level || !(level in LEVEL_LABEL)) return null;
	const l = level as BuyerLevel;
	return (
		<Badge
			colorPalette={COLOR[l]}
			variant='subtle'
			textTransform='none'
			whiteSpace='nowrap'>
			{LEVEL_LABEL[l]}
			{l !== 'new' && rate != null ? ` · ${rate}%` : ''}
		</Badge>
	);
};

const Row: FC<{ name: string; children: React.ReactNode; muted?: boolean }> = ({ name, children, muted }) => (
	<Flex
		justify='space-between'
		gap={3}
		fontSize='13px'
		py={1.5}
		borderTopWidth='1px'
		borderColor='border.muted'
		color={muted ? 'fg.muted' : undefined}>
		<Text fontWeight='500'>{name}</Text>
		<Text textAlign='right'>{children}</Text>
	</Flex>
);

const pct = (d: number, r: number) => (d + r ? ` · ${Math.round((d / (d + r)) * 100)}% delivered` : '');

/** The whole answer: the level and what it means, a row per source, warnings, what to do. */
export const BuyerAnswer: FC<{ a: BuyerCheckAnswer }> = ({ a }) => (
	<Box>
		<Flex
			align='center'
			gap={2}
			wrap='wrap'>
			<BuyerBadge
				level={a.level}
				rate={a.rate}
			/>
			<Text fontSize='13px'>{a.summary}</Text>
		</Flex>
		{a.warnings.length > 0 && (
			<Box
				mt={2}
				p={2}
				px={3}
				borderRadius='md'
				bg='red.subtle'
				color='red.fg'
				fontSize='13px'>
				{a.warnings.map(w => (
					<Text key={w}>{w}</Text>
				))}
			</Box>
		)}
		<Box mt={3}>
			{a.sources.map(s =>
				s.ok ? (
					<Row
						key={s.id}
						name={`${s.name}${s.via === 'panel' ? ' (your login)' : ''}`}>
						{s.delivered !== null && s.refused !== null ? `${s.delivered + s.refused} parcels${pct(s.delivered, s.refused)}` : 'No counts'}
						{s.rating ? ` · “${s.rating.replace(/_/g, ' ')}”` : ''}
						{s.reports ? ` · ${s.reports} fraud report${s.reports === 1 ? '' : 's'}` : ''}
					</Row>
				) : (
					<Row
						key={s.id}
						name={s.name}
						muted>
						{s.error || 'Couldn’t check'}
					</Row>
				)
			)}
			<Row name='This store'>
				{a.own.orders ? `${a.own.orders} order${a.own.orders === 1 ? '' : 's'} · ${a.own.delivered} delivered, ${a.own.refused} refused` : 'No earlier orders'}
			</Row>
			{a.sources.length === 0 && (
				<Text
					mt={2}
					fontSize='12px'
					color='fg.muted'>
					No courier can check yet — connect Steadfast, or add your RedX or Pathao login under Store settings → Delivery.
				</Text>
			)}
		</Box>
		<Text
			mt={3}
			fontSize='13px'
			fontWeight='500'>
			{NEXT[a.level]}
		</Text>
		<Text
			mt={1}
			fontSize='12px'
			color='fg.muted'>
			Couriers checked {dateTime(a.checkedAt)} · Safe from {a.thresholds.safe}%, Check first from {a.thresholds.checkFirst}%
		</Text>
	</Box>
);

/** The order page's card: what was kept on the order, then the full answer on Details or Check again. */
export const BuyerCheckCard: FC<{ phone?: string; saved?: OrderBuyerCheck }> = ({ phone, saved }) => {
	const [check, res] = useLazyGetStoreBuyerCheckQuery();
	if (!phone) return null;
	const a = res.data;
	return (
		<Panel
			id='store-buyer-check'
			title='Buyer check'
			actions={<GuideLink section='store-buyer-check' />}>
			{a ? (
				<BuyerAnswer a={a} />
			) : saved?.level ? (
				<Box>
					<Flex
						align='center'
						gap={2}
						wrap='wrap'>
						<BuyerBadge
							level={saved.level}
							rate={saved.rate}
						/>
						<Text fontSize='13px'>{saved.summary}</Text>
					</Flex>
					{saved.warnings && (
						<Text
							mt={2}
							fontSize='13px'
							color='red.fg'>
							{saved.warnings}
						</Text>
					)}
					{saved.sources && (
						<Text
							mt={2}
							fontSize='13px'
							color='fg.muted'>
							{saved.sources}
						</Text>
					)}
					<Text
						mt={2}
						fontSize='13px'
						fontWeight='500'>
						{NEXT[saved.level]}
					</Text>
					<Text
						mt={1}
						fontSize='12px'
						color='fg.muted'>
						Checked {dateTime(saved.checkedAt)}
					</Text>
				</Box>
			) : (
				<Text
					fontSize='13px'
					color='fg.muted'>
					Not checked yet. Check how often {phone} takes their parcels.
				</Text>
			)}
			{res.error && (
				<Text
					mt={2}
					fontSize='13px'
					color='red.fg'>
					{errText(res.error)}
				</Text>
			)}
			<Flex
				mt={3}
				gap={2}
				justify='flex-end'>
				{!a && saved?.level && (
					<Button
						size='xs'
						variant='ghost'
						loading={res.isFetching}
						onClick={() => check({ phone })}>
						Details
					</Button>
				)}
				<Button
					size='xs'
					variant='outline'
					loading={res.isFetching}
					onClick={() => check({ phone, fresh: !!(a || saved?.level) })}>
					<RefreshCw size={13} /> {a || saved?.level ? 'Check again' : 'Check now'}
				</Button>
			</Flex>
		</Panel>
	);
};
