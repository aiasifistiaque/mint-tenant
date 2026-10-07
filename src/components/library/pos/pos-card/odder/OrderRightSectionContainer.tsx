import { ReactNode } from 'react';
import { Grid } from '@chakra-ui/react';

const OrderRightSectionContainer = ({ children }: { children: ReactNode }) => {
	// const borderColor = useColorModeValue('#bbb', 'stroke.deepD');

	return (
		<Grid
			pr={3}
			gridTemplateColumns='2fr 1fr 1fr 1fr'
			rowGap={4}
			py={2}
			borderBottom='1px dashed'
			borderTop='1px dashed'
			borderColor='border.emphasized'
			_dark={{
				borderColor: 'stroke.deepD',
			}}
			w='100%'>
			{children}
		</Grid>
	);
};

export default OrderRightSectionContainer;
