'use client';

import { Flex, FlexProps } from '@chakra-ui/react';
import { FC, ReactNode } from 'react';
import SideDrawer from './sidebar/SideDrawer';
import { padding, styles } from '..';

type FlexPropsType = FlexProps & {
	children: ReactNode;
	showMenu?: boolean;
};

const PX = { base: padding.BASE, md: padding.MD, lg: padding.LG };

const Navbar: FC<FlexPropsType> = ({ children, showMenu, ...props }) => {
	const container = {
		position: 'fixed',
		top: 0,
		left: 0,
		px: PX,
		w: '100vw',
		...props,
	};

	return (
		<Flex
			{...styles.NAVBAR}
			{...container}
			{...props}
			position='fixed'>
			{showMenu && <SideDrawer />}

			{children}
		</Flex>
	);
};

export default Navbar;
