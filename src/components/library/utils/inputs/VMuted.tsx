'use client';

import { FC, ReactNode } from 'react';
import { InputGroup } from '@chakra-ui/react';
import { Lock } from 'lucide-react';
import { FormControl, Input } from '.';

type Props = {
	label: string;
	isRequired?: boolean;
	/** The reason it can't be typed in, under the box. */
	helper?: string;
	/** The value as words. */
	value: string;
	placeholder?: string;
	/** At the end of the box — a lock by default. */
	icon?: ReactNode;
};

/**
 * A field that can't be typed in — read only, locked by the record's state, or
 * worked out (a formula, a total from linked records). The same box as every
 * other input, so the form keeps its shape, but muted: greyed, not focusable,
 * no focus ring, with an icon and the reason under it.
 */
const VMuted: FC<Props> = ({ label, isRequired, helper, value, placeholder, icon }) => (
	<FormControl
		label={label}
		isRequired={isRequired}
		helper={helper}>
		<InputGroup
			endElement={icon ?? <Lock size={13} />}
			endElementProps={{ color: 'fg.subtle', pointerEvents: 'none' }}>
			<Input
				px={3}
				value={value}
				placeholder={placeholder || '—'}
				readOnly
				tabIndex={-1}
				aria-readonly
				onChange={() => {}}
				bg='bg.muted'
				color='fg.muted'
				borderColor='border'
				cursor='not-allowed'
				_hover={{ borderColor: 'border' }}
				_focus={{ borderColor: 'border', boxShadow: 'none', outline: 'none' }}
				_focusVisible={{ borderColor: 'border', boxShadow: 'none', outline: 'none' }}
			/>
		</InputGroup>
	</FormControl>
);

export default VMuted;
