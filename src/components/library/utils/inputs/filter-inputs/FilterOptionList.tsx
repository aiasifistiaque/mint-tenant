import { FC } from 'react';
import { Flex, FlexProps } from '@chakra-ui/react';

/**
 * The column of `FilterCheckbox` / `FilterRadio` rows inside a filter popup.
 * The negative margin lets each row's hover run out to the popover's padding
 * while the boxes themselves stay aligned with the title and inputs above.
 */
const FilterOptionList: FC<FlexProps> = props => (
	<Flex
		direction='column'
		mx={-2}
		gap='2px'
		{...props}
	/>
);

export default FilterOptionList;
