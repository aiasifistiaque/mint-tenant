import { GridItem, GridItemProps } from '@chakra-ui/react';
import { ReactNode } from 'react';

const ItemText = ({ children, ...props }: GridItemProps & { children: ReactNode }) => {
	return (
		<GridItem
			fontSize='.9rem'
			{...props}>
			{children}
		</GridItem>
	);
};

export default ItemText;
