import { ReactNode } from 'react';
import { Grid } from '@chakra-ui/react';

const OrderItemsContainer = ({ children }: { children: ReactNode }) => {
	return (
		<Grid
			gridTemplateColumns='1fr'
			rowGap={4}
			pr={3}
			py={2}
			maxH='300px'
			overflowY='scroll'>
			{children}
		</Grid>
	);
};

export default OrderItemsContainer;
