'use client';

import { FC, ReactNode } from 'react';
import { useIsMobile, styles } from '../../../..';
import { Dialog, DrawerContent, DrawerContentProps } from '@chakra-ui/react';

type Props = any &
	DrawerContentProps & {
		children: ReactNode;
	};

const DialogContent: FC<Props> = ({ children, ...props }) => {
	const isMobile = useIsMobile();

	if (isMobile) {
		return (
			<DrawerContent
				{...(styles.DRAWER as any)}
				maxH='85dvh'
				minH='20vh'
				overflow='hidden'
				{...props}>
				{children}
			</DrawerContent>
		);
	}

	return (
		<Dialog.Positioner>
			<Dialog.Content
				{...(styles.MODAL as any)}
				{...props}>
				{children}
			</Dialog.Content>
		</Dialog.Positioner>
	);
};

export default DialogContent;
