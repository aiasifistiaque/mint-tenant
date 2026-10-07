import { FC, ReactNode } from 'react';
import { RadioGroup } from '@chakra-ui/react';

type FilterRadioProps = {
	value: string;
	children: ReactNode;
};

/**
 * One full-width option row inside a `RadioGroup.Root`. Same shape as the
 * multi-select filter's checkbox rows, and the chosen row stays highlighted.
 */
const FilterRadio: FC<FilterRadioProps> = ({ value, children }) => {
	return (
		<RadioGroup.Item
			value={value}
			w='full'
			gap={2.5}
			px={2}
			py={{ base: 2, md: 1 }}
			borderRadius='md'
			cursor='pointer'
			transition='background-color 120ms'
			_hover={{ bg: 'bg.muted' }}
			_checked={{ bg: 'bg.muted' }}>
			<RadioGroup.ItemHiddenInput />
			{/* The gray palette's `contrast` (the dot) is near-identical to its
			    `solid` (the fill), so a checked radio read as a plain disc. Punch
			    the dot out in the popover's own background instead. */}
			<RadioGroup.ItemIndicator
				css={{ '& .dot': { bg: 'menu.light', _dark: { bg: 'menu.dark' } } }}
			/>
			<RadioGroup.ItemText
				fontSize={{ base: '15px', md: '13px' }}
				fontWeight='400'>
				{children}
			</RadioGroup.ItemText>
		</RadioGroup.Item>
	);
};

export default FilterRadio;
