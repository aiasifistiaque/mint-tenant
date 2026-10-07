'use client';
import { FC, ReactNode } from 'react';
import { Drawer, Dialog } from '@chakra-ui/react';
import { radius } from '../config';
import { useColorMode } from '@/components/ui/color-mode';

type MenuContainerProps = any & {
	children: ReactNode;
	isSmallScreen?: boolean;
};

const ModalContainer: FC<MenuContainerProps> = ({ children, isSmallScreen, ...props }) => {
	const { colorMode } = useColorMode();

	if (isSmallScreen)
		return (
			<Drawer.Content
				borderTopRadius='2xl'
				h='85vh'
				bg={colorMode === 'dark' ? 'menu.dark' : 'menu.light'}
				{...props}>
				{children}
			</Drawer.Content>
		);
	else
		return (
			<Dialog.Content
				boxShadow='lg'
				borderRadius={radius.MODAL}
				bg={colorMode === 'dark' ? 'menu.dark' : 'background.light'}
				{...props}>
				{children}
			</Dialog.Content>
		);
};

export default ModalContainer;
