import { ChangeEvent } from 'react';
import { Flex, Text } from '@chakra-ui/react';

import { FilterInput } from '../../..';

type BetweenDatesProps = {
	/** `<start>_<end>`; either side may be empty while it's being filled in. */
	value: string;
	setVal: (val: string) => void;
};

// Stacked rather than side by side: two native date inputs don't fit on one
// line in the popover without clipping their text.
const BetweenDates = ({ value, setVal }: BetweenDatesProps) => {
	const [start = '', end = ''] = value.split('_');

	const handleStart = (e: ChangeEvent<HTMLInputElement>) => {
		setVal(`${e.target.value}_${end}`);
	};

	const handleEnd = (e: ChangeEvent<HTMLInputElement>) => {
		setVal(`${start}_${e.target.value}`);
	};

	return (
		<Flex
			flexDir='column'
			gap={1.5}>
			<FilterInput
				date
				value={start}
				max={end || undefined}
				onChange={handleStart}
			/>
			<Text
				fontSize='12px'
				color='fg.muted'
				lineHeight={1}>
				and
			</Text>
			<FilterInput
				date
				value={end}
				min={start || undefined}
				onChange={handleEnd}
			/>
		</Flex>
	);
};

export default BetweenDates;
