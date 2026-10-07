import { ReactNode } from 'react';
import { Flex, Text } from '@chakra-ui/react';
import { hasActiveFilters, formatFilterKeys } from '../../../../../functions';
import { useAppSelector } from '../../../../../hooks';

const FIlterContainer = ({ children }: { children: ReactNode }) => {
	const { filters } = useAppSelector((state: any) => state.table);

	return (
		<Flex
			flexDir='column'
			gap={2}>
			<Flex
				gap={2}
				align='center'>
				{children}
			</Flex>
			{hasActiveFilters(filters) && (
				// A caption under the chips, not a heading. The chips themselves
				// already invert to show which filters are on, so this repeats
				// them for scanning and should sit behind them, not compete.
				<Text
					color='fg.muted'
					fontSize='12px'
					fontWeight='400'>
					Active Filters: {formatFilterKeys(filters)}
				</Text>
			)}
		</Flex>
	);
};

export default FIlterContainer;
