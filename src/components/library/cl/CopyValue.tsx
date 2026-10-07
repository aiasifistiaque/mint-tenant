'use client';

import { FC } from 'react';
import { Flex, IconButton, Text, useClipboard } from '@chakra-ui/react';
import { Check as CheckIcon, Copy as CopyIcon } from 'lucide-react';

type CopyValueProps = {
	value: string;
	/** What to show instead of the value — a mask, a truncation. */
	display?: string;
	mono?: boolean;
	ariaLabel?: string;
};

/**
 * Copies the real value even when `display` is showing something else, which is
 * what makes "copy without revealing" work for a masked config var.
 */
const CopyValue: FC<CopyValueProps> = ({ value, display, mono = true, ariaLabel = 'Copy' }) => {
	const { copy, copied } = useClipboard({ value });

	return (
		<Flex
			align='center'
			gap={2}
			minW={0}>
			<Text
				fontSize='13px'
				fontFamily={mono ? 'mono' : undefined}
				truncate
				title={display ?? value}>
				{display ?? value}
			</Text>
			<IconButton
				size='2xs'
				variant='ghost'
				flexShrink={0}
				aria-label={ariaLabel}
				title={copied ? 'Copied' : ariaLabel}
				onClick={copy}>
				{copied ? <CheckIcon size={13} /> : <CopyIcon size={13} />}
			</IconButton>
		</Flex>
	);
};

export default CopyValue;
