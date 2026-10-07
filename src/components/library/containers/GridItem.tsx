import { ReactNode } from 'react';
import { GridItem as GridComponent, GridItemProps } from '@chakra-ui/react';

const GridItem = ({ children, ...props }: GridItemProps & { children?: ReactNode }) => {
	return <GridComponent {...props}>{children}</GridComponent>;
};

export default GridItem;
