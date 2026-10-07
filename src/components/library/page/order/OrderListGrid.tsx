import { ReactNode } from 'react';
import { Grid, GridProps } from '@chakra-ui/react';

const OrderListGrid = ({ children, ...props }: GridProps & { children: ReactNode }) => (
	<Grid
		display={{ base: 'flex', md: 'grid' }}
		flexDir={{ base: 'column', md: 'row' }}
		gridTemplateColumns={{ base: '1fr', md: '3fr 2fr' }}
		gap={10}
		{...props}>
		{children}
	</Grid>
);

export default OrderListGrid;
