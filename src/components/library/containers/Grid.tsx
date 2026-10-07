import { ReactNode } from 'react';
import { Grid as GridComponent, GridProps } from '@chakra-ui/react';

const Grid = ({ children, ...props }: GridProps & { children?: ReactNode }) => {
	return <GridComponent {...props}>{children}</GridComponent>;
};

export default Grid;
