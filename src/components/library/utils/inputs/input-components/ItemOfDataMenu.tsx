import { FC, ReactNode } from 'react';
import { MenuItem } from '../../..';
import { useColorMode } from '@/components/ui/color-mode';

/**
 *
 * This is the item of data Menu
 */

type ItemOfMenuProps = {
	children: ReactNode;
	id: string;
	filter?: string;
	onClick?: () => void;
	[key: string]: any;
};

const WIDTH = { base: '300px', md: '360px' };
const MAX_H = '200px';

const ItemOfMenu: FC<ItemOfMenuProps> = ({ children, filter, id, ...props }) => {
	const { colorMode } = useColorMode();
	const hoverBg = colorMode === 'light' ? 'hover.light' : 'hover.dark';
	const itemBg = 'accent.solid';
	const itemColor = 'accent.contrast';

	const isActive = (id: string): boolean => {
		//return filters[filter] === id;
		return false;
	};

	return (
		<MenuItem
			fontWeight='500'
			fontSize='15px'
			py={{ base: 3, md: 2 }}
			w='full'
			bg={isActive(id) ? itemBg : 'transparent'}
			color={isActive(id) ? itemColor : 'inherit'}
			_hover={{ bg: hoverBg }}
			{...props}>
			{children}
		</MenuItem>
	);
};

export default ItemOfMenu;
