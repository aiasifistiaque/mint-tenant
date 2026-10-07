'use client';

import { FC } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';

export type StatusTone = 'running' | 'idle' | 'pending' | 'failed' | 'maintenance';

/**
 * Status is a dot and a word, not a filled badge.
 *
 * A table of twenty apps with twenty coloured pills reads as decoration and
 * nothing stands out. An 8px dot carries the same information at a fraction of
 * the visual weight, which is what lets the one genuinely bad row catch the eye.
 */
const TONE_COLOR: Record<StatusTone, string> = {
	// green.fg, not green.500: colors.theme.ts maps the green scale onto the brand black.
	running: 'green.fg',
	idle: 'fg.subtle',
	pending: 'orange.400',
	failed: 'red.500',
	maintenance: 'blue.400',
};

/**
 * Every provider's state vocabulary, mapped in one place.
 *
 * Heroku is inconsistent across its own resources, and Vercel uses a different
 * set again (`READY` / `BUILDING` / `QUEUED` / `ERROR` / `CANCELED`). Both live
 * here rather than in two components, so a state that is not yet handled shows
 * up as `idle` everywhere at once instead of as green on one page and grey on
 * another.
 *
 * Note `queued` and `initializing`: on a Hobby plan only one build runs at a
 * time, so a queued deployment is the normal case rather than an anomaly. It is
 * `pending`, not `idle` — rendering a waiting build in the same grey as a
 * cancelled one makes a working system look stalled.
 */
export const toneFor = (value?: string | null): StatusTone => {
	const state = String(value || '').toLowerCase();

	if (
		['up', 'succeeded', 'success', 'active', 'running', 'provisioned', 'ready'].includes(state)
	)
		return 'running';
	if (['crashed', 'failed', 'error', 'payment-failed'].includes(state)) return 'failed';
	if (
		[
			'starting',
			'restarting',
			'pending',
			'building',
			'provisioning',
			'up-pending',
			'queued',
			'initializing',
		].includes(state)
	)
		return 'pending';
	if (['maintenance'].includes(state)) return 'maintenance';

	// Includes Vercel's `canceled`, which is genuinely inert rather than failed.
	return 'idle';
};

type StatusDotProps = {
	tone?: StatusTone;
	/** Raw Heroku state; mapped through `toneFor` when `tone` is not given. */
	state?: string | null;
	label?: string;
	showLabel?: boolean;
	/** Hover text — used to surface a raw code behind a friendly label. */
	title?: string;
};

const StatusDot: FC<StatusDotProps> = ({ tone, state, label, showLabel = true, title }) => {
	const resolved = tone || toneFor(state);
	const text = label ?? state ?? resolved;

	return (
		<Flex
			align='center'
			gap={2}
			minW={0}
			title={title}>
			<Box
				w='8px'
				h='8px'
				flexShrink={0}
				borderRadius='full'
				bg={TONE_COLOR[resolved]}
			/>
			{showLabel && (
				<Text
					fontSize='xs'
					color='fg.muted'
					textTransform='capitalize'
					truncate>
					{text}
				</Text>
			)}
		</Flex>
	);
};

export default StatusDot;
