'use client';

import { FC, ReactNode } from 'react';
import { Flex, Text } from '@chakra-ui/react';

type DetailRowProps = {
	label: string;
	/** A string renders as body text; anything else renders as given, so a
	 *  CopyValue or a StatusDot can sit in the value slot. */
	value?: ReactNode;
	/** Widen when a grid has long labels and the values look ragged. */
	labelWidth?: string;
	/** On a phone, the label above and the value below at full width (pictures). */
	stackOnMobile?: boolean;
};

/**
 * One label/value line in a detail grid.
 *
 * Three copies of this existed — two on the Heroku pages, one on each Vercel
 * page — with three different label widths, which is why the same grid looked
 * subtly different on every page it appeared on.
 */
const DetailRow: FC<DetailRowProps> = ({ label, value, labelWidth = '150px', stackOnMobile }) => (
	<Flex
		gap={stackOnMobile ? { base: 2, md: 4 } : 4}
		direction={stackOnMobile ? { base: 'column', md: 'row' } : 'row'}
		align={stackOnMobile ? { base: 'stretch', md: 'baseline' } : 'baseline'}>
		<Text
			fontSize='xs'
			color='fg.muted'
			minW={labelWidth}>
			{label}
		</Text>

		{value === null || value === undefined || value === '' ? (
			<Text fontSize='13px'>—</Text>
		) : typeof value === 'string' || typeof value === 'number' ? (
			<Text fontSize='13px'>{value}</Text>
		) : (
			value
		)}
	</Flex>
);

export default DetailRow;
