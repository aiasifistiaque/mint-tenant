import { FC, ReactNode } from 'react';
import { MenuItem, MenuItemProps } from '@chakra-ui/react';
import Link from 'next/link';

type CustomMenuItemProps = MenuItemProps & {
	children: ReactNode;
	href?: string;
};

const ModalMenuItem: FC<CustomMenuItemProps> = ({ children, href, ...props }) => {
	return (
		<MenuItem
			{...(href && { as: Link })}
			{...(href && { href })}
			borderBottomColor='border.light'
			borderBottomWidth={1}
			_last={{
				borderBottomWidth: 0,
			}}
			fontSize='sm'
			p={0}
			bg='menu.light'
			color='text.selected'
			fontWeight='600'
			_hover={{
				bg: 'hover.light',
			}}
			_dark={{
				color: 'text.selectedDark',
				borderBottomColor: 'border.dark',
				bg: 'menu.dark',
				_hover: {
					bg: 'hover.dark',
				},
			}}
			{...props}>
			{children}
		</MenuItem>
	);
};

export default ModalMenuItem;
