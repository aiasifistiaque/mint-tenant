import { ChangeEvent } from 'react';
import { Flex } from '@chakra-ui/react';

import { FilterSelect, FilterInput } from '../../..';

type InTheLastProps = {
	/** `<unit>_<count>`, e.g. `days_7` — the shape the API expects. */
	value: string;
	setVal: (val: string) => void;
};

const InTheLast = ({ value, setVal }: InTheLastProps) => {
	const [unit = 'days', count = ''] = value.split('_');

	const handleCount = (e: ChangeEvent<HTMLInputElement>) => {
		setVal(`${unit}_${e.target.value}`);
	};

	const handleUnit = (e: { target: { value: string } }) => {
		setVal(`${e.target.value}_${count}`);
	};

	return (
		<Flex gap={2}>
			<FilterInput
				type='number'
				min={1}
				w='72px'
				flexShrink={0}
				value={count}
				onChange={handleCount}
			/>
			<FilterSelect
				value={unit}
				onChange={handleUnit}>
				<option value='days'>days</option>
				<option value='months'>months</option>
			</FilterSelect>
		</Flex>
	);
};

export default InTheLast;
