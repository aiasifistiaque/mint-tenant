import { FC, ReactNode } from 'react';

import { MenuItemProps } from '@chakra-ui/react';
import { useColorMode } from '@/components/ui/color-mode';
import { useAppSelector, MenuItem } from '../';

const WIDTH = '300px';
const MAX_H = '300px';

type ItemOfMenuProps = any & {
	children: ReactNode;
	id: string;
	filter: string;
	value?: string;
};

const ItemOfMenu: FC<ItemOfMenuProps> = ({ children, filter, id, ...props }) => {
	const { filters } = useAppSelector((state: any) => state.table);
	const { colorMode } = useColorMode();
	const hoverBg = colorMode === 'dark' ? 'hover.dark' : 'hover.light';
	const itemBg = 'accent.solid';
	const itemColor = 'accent.contrast';

	const isActive = (id: string): boolean => {
		return filters[filter] === id;
	};

	const hoverStyle = (id: string): any => {
		if (isActive(id)) return {};
		return {
			bg: hoverBg,
		};
	};
	return (
		<MenuItem
			w={WIDTH}
			_hover={hoverStyle(id)}
			bg={isActive(id) ? itemBg : 'transparent'}
			color={isActive(id) ? itemColor : 'inherit'}
			{...props}>
			{children}
		</MenuItem>
	);
};

export default ItemOfMenu;
