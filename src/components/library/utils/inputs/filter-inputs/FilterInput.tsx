import { Input, InputProps } from '@chakra-ui/react';
import { FC } from 'react';
import { styles, radius } from '../../../config';

type FilterInputProps = InputProps & {
	date?: boolean;
};

// One height for every control inside a filter popup, so a text box, a date
// box and a select all line up on the same baseline.
export const FILTER_CONTROL_HEIGHT = { base: '42px', md: '32px' };

const FilterInput: FC<FilterInputProps> = ({ date, ...props }) => {
	return (
		<Input
			{...(styles.FIELD as InputProps)}
			type={date ? 'date' : props.type}
			h={FILTER_CONTROL_HEIGHT}
			// No `flex` here: most filter bodies are a column, where a flex child
			// would be stretched or squashed vertically instead of keeping its
			// height. The side-by-side range inputs opt into it themselves.
			minW={0}
			w='100%'
			px={2.5}
			borderRadius={radius.INPUT}
			{...props}
		/>
	);
};

export default FilterInput;
