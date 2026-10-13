'use client';

import { FC, useRef } from 'react';
import { Box, Flex, Input, Text, Textarea } from '@chakra-ui/react';
import FieldPicker, { PickerContext } from './FieldPicker';

/**
 * Text that takes fields: an input (or a box for several lines) with an
 * "Insert a field" picker that puts the token where the cursor is.
 */
const TokenText: FC<{
	label?: string;
	value: string;
	onChange: (v: string) => void;
	ctx: PickerContext;
	multiline?: boolean;
	placeholder?: string;
	inTable?: boolean;
	hint?: string;
}> = ({ label, value, onChange, ctx, multiline, placeholder, inTable, hint }) => {
	const ref = useRef<any>(null);
	const insert = (token: string) => {
		const el = ref.current;
		const v = value || '';
		const start = el?.selectionStart ?? v.length;
		const end = el?.selectionEnd ?? v.length;
		onChange(v.slice(0, start) + token + v.slice(end));
		requestAnimationFrame(() => {
			if (!el) return;
			el.focus();
			el.setSelectionRange(start + token.length, start + token.length);
		});
	};
	return (
		<Box>
			<Flex
				align='center'
				justify='space-between'
				mb={1}
				minH='20px'>
				{label && (
					<Text
						fontSize='xs'
						fontWeight='500'>
						{label}
					</Text>
				)}
				<FieldPicker
					ctx={ctx}
					onPick={insert}
					inTable={inTable}
				/>
			</Flex>
			{multiline ? (
				<Textarea
					ref={ref}
					size='sm'
					rows={3}
					fontFamily='mono'
					fontSize='12px'
					value={value || ''}
					placeholder={placeholder}
					onChange={e => onChange(e.target.value)}
				/>
			) : (
				<Input
					ref={ref}
					size='sm'
					fontFamily='mono'
					fontSize='12px'
					value={value || ''}
					placeholder={placeholder}
					onChange={e => onChange(e.target.value)}
				/>
			)}
			{hint && (
				<Text
					fontSize='11px'
					color='fg.muted'
					mt={1}>
					{hint}
				</Text>
			)}
		</Box>
	);
};

export default TokenText;
