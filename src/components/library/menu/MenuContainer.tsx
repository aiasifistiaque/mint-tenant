import { FC, ReactNode } from 'react';
import { Menu, Portal } from '@chakra-ui/react';
import { radius } from '../config';

type MenuContainerProps = any & {
	children: ReactNode;
};

const MenuContainer: FC<MenuContainerProps> = ({ children, ...props }) => {
	return (
		<Portal>
			<Menu.Positioner>
				<Menu.Content
					boxShadow='md'
					p={2}
					gap={2}
					borderRadius={radius?.MENU}
					bg={{ base: 'menu.light', _dark: 'menu.dark' }}
					borderWidth={1}
					borderColor={{ base: 'border.light', _dark: 'border.dark' }}
					{...props}>
					{children}
				</Menu.Content>
			</Menu.Positioner>
		</Portal>
	);
};

export default MenuContainer;
