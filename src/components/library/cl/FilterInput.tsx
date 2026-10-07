'use client';

import { FC } from 'react';
import { Box, Flex, IconButton, Input, Text } from '@chakra-ui/react';
import { Search as SearchIcon, X as ClearIcon } from 'lucide-react';
import { radius } from '../index';

type FilterInputProps = {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	/** Rendered as "showing X of Y" once a filter is active. */
	shown?: number;
	total?: number;
	width?: string;
};

/**
 * Local, instant filtering — no debounce and no request.
 *
 * The list this filters is already fully in memory, so every keystroke can
 * render immediately. A debounce here would only add lag to a synchronous
 * array filter, and a server round trip would be slower than the work it saves.
 */
const FilterInput: FC<FilterInputProps> = ({
	value,
	onChange,
	placeholder = 'Search…',
	shown,
	total,
	width = '260px',
}) => {
	const filtering = value.trim().length > 0;

	return (
		<Flex
			align='center'
			gap={2}>
			<Box
				position='relative'
				w={width}
				maxW='full'>
				<Box
					position='absolute'
					left='10px'
					top='50%'
					transform='translateY(-50%)'
					color='fg.subtle'
					pointerEvents='none'
					lineHeight={0}>
					<SearchIcon size={14} />
				</Box>

				<Input
					size='sm'
					value={value}
					placeholder={placeholder}
					borderRadius={radius.INPUT}
					pl='30px'
					pr={filtering ? '30px' : 3}
					fontSize='13px'
					onChange={event => onChange(event.target.value)}
				/>

				{filtering && (
					<IconButton
						size='2xs'
						variant='ghost'
						aria-label='Clear search'
						position='absolute'
						right='4px'
						top='50%'
						transform='translateY(-50%)'
						onClick={() => onChange('')}>
						<ClearIcon size={12} />
					</IconButton>
				)}
			</Box>

			{filtering && typeof shown === 'number' && typeof total === 'number' && (
				<Text
					fontSize='xs'
					color='fg.muted'
					whiteSpace='nowrap'>
					{shown} of {total}
				</Text>
			)}
		</Flex>
	);
};

export default FilterInput;
