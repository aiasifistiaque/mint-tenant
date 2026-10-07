import { ReactNode } from 'react';
import { GridItem, GridItemProps } from '@chakra-ui/react';

const Heading = ({ children, ...props }: GridItemProps & { children: ReactNode }) => {
	return (
		<GridItem
			fontWeight='600'
			{...props}>
			{children}
		</GridItem>
	);
};

export default Heading;
