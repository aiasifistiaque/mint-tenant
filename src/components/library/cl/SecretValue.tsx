'use client';

import { FC, useState } from 'react';
import { Flex, IconButton, Text, useClipboard } from '@chakra-ui/react';
import { Check, Copy, Eye, EyeOff } from 'lucide-react';

/** Always the same length, so the mask doesn't give away how long the secret is. */
export const MASK = '••••••••••';

type SecretValueProps = {
	value?: string | null;
	/** Also offer to copy it — the real value, even while it's hidden. */
	copy?: boolean;
	size?: 'sm' | 'xs';
};

/**
 * A password, key or token: dots until the eye is pressed, then the value in
 * monospace; pressing again hides it. Copy works without revealing. Every
 * button stops the click, so it's safe inside a clickable table row.
 */
const SecretValue: FC<SecretValueProps> = ({ value, copy = true, size = 'sm' }) => {
	const [shown, setShown] = useState(false);
	const text = value == null ? '' : String(value);
	const { copy: doCopy, copied } = useClipboard({ value: text });
	const iconSize = size === 'xs' ? 13 : 14;

	if (!text)
		return (
			<Text
				as='span'
				color='fg.muted'>
				—
			</Text>
		);

	return (
		<Flex
			as='span'
			display='inline-flex'
			align='center'
			gap={1}
			minW={0}>
			<Text
				as='span'
				fontSize={size === 'xs' ? '12px' : '13px'}
				fontFamily={shown ? 'mono' : undefined}
				letterSpacing={shown ? undefined : '0.12em'}
				color={shown ? 'fg' : 'fg.muted'}
				truncate
				title={shown ? text : undefined}
				// Hidden, it's never selectable text; shown, it can be picked out.
				userSelect={shown ? 'text' : 'none'}>
				{shown ? text : MASK}
			</Text>
			<IconButton
				size='2xs'
				variant='ghost'
				flexShrink={0}
				color='fg.muted'
				_hover={{ color: 'fg', bg: 'bg.muted' }}
				aria-label={shown ? 'Hide' : 'Show'}
				aria-pressed={shown}
				title={shown ? 'Hide' : 'Show'}
				onClick={e => {
					e.stopPropagation();
					setShown(s => !s);
				}}>
				{shown ? <EyeOff size={iconSize} /> : <Eye size={iconSize} />}
			</IconButton>
			{copy && (
				<IconButton
					size='2xs'
					variant='ghost'
					flexShrink={0}
					color='fg.muted'
					_hover={{ color: 'fg', bg: 'bg.muted' }}
					aria-label='Copy'
					title={copied ? 'Copied' : 'Copy'}
					onClick={e => {
						e.stopPropagation();
						doCopy();
					}}>
					{copied ? <Check size={iconSize} /> : <Copy size={iconSize} />}
				</IconButton>
			)}
		</Flex>
	);
};

export default SecretValue;
