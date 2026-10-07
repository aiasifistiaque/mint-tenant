import { ReactNode } from 'react';
import { Flex } from '@chakra-ui/react';
import { radius, shadow } from '../../../../../config';
import { SpaceBetween } from '../../../../../containers';

/**
 * Replaces the toolbar while rows are selected. It uses an inverted surface so
 * it's unmistakably a mode the table is in, not another row of filters.
 */
const SelectedItemsContainer = ({ children }: { children: ReactNode }) => {
	return (
		<Flex
			w='full'
			py={1}>
			<SpaceBetween
				px={3}
				py={2}
				w='full'
				alignItems='center'
				borderRadius={radius.SELECT_CONTAINER}
				bg='bg.inverted'
				color='fg.inverted'
				fontSize='14px'
				fontWeight='500'
				boxShadow={shadow.SUBTLE}>
				{children}
			</SpaceBetween>
		</Flex>
	);
};

export default SelectedItemsContainer;
