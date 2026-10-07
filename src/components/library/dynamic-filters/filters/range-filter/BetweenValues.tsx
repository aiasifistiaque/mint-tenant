import { ChangeEvent } from 'react';
import { Flex, Text } from '@chakra-ui/react';
import FilterInput from '../../../utils/inputs/filter-inputs/FilterInput';

type BetweenValuesProps = {
	/** `<min>_<max>`; either side may be empty while it's being filled in. */
	value: string;
	setVal: (val: string) => void;
};

const BetweenValues = ({ value, setVal }: BetweenValuesProps) => {
	const [start = '', end = ''] = value.split('_');

	const handleStart = (e: ChangeEvent<HTMLInputElement>) => {
		setVal(`${e.target.value}_${end}`);
	};

	const handleEnd = (e: ChangeEvent<HTMLInputElement>) => {
		setVal(`${start}_${e.target.value}`);
	};

	return (
		<Flex
			alignItems='center'
			gap={2}
			w='full'>
			<FilterInput
				type='number'
				value={start}
				onChange={handleStart}
				placeholder='Min'
				flex='1'
			/>
			<Text
				fontSize='12px'
				color='fg.muted'
				flexShrink={0}>
				and
			</Text>
			<FilterInput
				type='number'
				value={end}
				onChange={handleEnd}
				placeholder='Max'
				flex='1'
			/>
		</Flex>
	);
};

export default BetweenValues;
