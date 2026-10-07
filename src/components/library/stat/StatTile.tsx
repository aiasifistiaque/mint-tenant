'use client';

import { FC, ReactNode } from 'react';
import { Box, Skeleton, Text } from '@chakra-ui/react';
import Link from 'next/link';
import { radius } from '..';

type StatTileProps = {
	label: string;
	value: ReactNode;
	/** Small muted line under the number — a period, a state, a caveat. */
	hint?: ReactNode;
	isLoading?: boolean;
	/** Makes the whole tile a link. Adds a hover lift; layout is unchanged. */
	href?: string;
};

/**
 * The one stat card. Lives here rather than beside the Heroku pages it started
 * in, because the dashboard shows the same kind of thing and a second copy
 * would drift from this one within a release.
 *
 * Flat: a 1px border and no shadow, matching the panels and tables. A grid of
 * shadowed cards is the fastest way to make an admin look a decade old.
 *
 * `value` is deliberately a ReactNode and never formatted here. Tiles on one
 * row carry different units — invoice amounts are cents and render as currency,
 * usage figures are in a unit Heroku does not document and render bare. A tile
 * that helpfully prepended a `$` would be wrong for half of them, so formatting
 * stays with the caller, which knows which is which. See
 * INVOICE_AMOUNTS_IN_CENTS and USAGE_UNITS_VERIFIED in
 * backend/lib/heroku/billing.ts.
 */
const StatTile: FC<StatTileProps> = ({ label, value, hint, isLoading, href }) => {
	const linkProps = href
		? {
				as: Link as any,
				href,
				cursor: 'pointer',
				transitionProperty: 'border-color, background-color',
				transitionDuration: '120ms',
				_hover: { borderColor: 'border.emphasized', bg: 'bg.subtle' },
		  }
		: {};

	return (
		<Box
			borderWidth='1px'
			borderColor='border'
			borderRadius={radius.CONTAINER}
			bg='bg.panel'
			px={4}
			py={3.5}
			minW={0}
			display='block'
			{...linkProps}>
			<Text
				fontSize='11px'
				fontWeight='500'
				letterSpacing='0.04em'
				textTransform='uppercase'
				color='fg.muted'
				truncate>
				{label}
			</Text>

			{isLoading ? (
				<Skeleton
					h='24px'
					w='60%'
					mt={2}
				/>
			) : (
				<Text
					fontSize='xl'
					fontWeight='600'
					lineHeight='1.3'
					mt={1}
					truncate>
					{value}
				</Text>
			)}

			{hint && !isLoading && (
				<Text
					fontSize='xs'
					color='fg.muted'
					mt={0.5}
					truncate>
					{hint}
				</Text>
			)}
		</Box>
	);
};

export default StatTile;
