import { FC, ReactNode } from 'react';
import { useIsMobile, useModalLayout, styles } from '../../../..';
import { DrawerContent, DrawerContentProps, Dialog } from '@chakra-ui/react';

type Props = any &
	DrawerContentProps & {
		children: ReactNode;
	};

const MenuModalContent: FC<Props> = ({ children, ...props }) => {
	const isMobile = useIsMobile();
	const layout = useModalLayout();

	if (isMobile) {
		return (
			<DrawerContent
				{...(styles.DRAWER as any)}
				maxH='85dvh'
				overflow='hidden'
				{...props}>
				{children}
			</DrawerContent>
		);
	}

	if (layout === 'drawer') {
		return (
			<DrawerContent
				{...(styles.DRAWER_END as any)}
				overflow='hidden'
				{...props}>
				{children}
			</DrawerContent>
		);
	}

	return (
		<Dialog.Content
			{...(styles.MODAL as any)}
			{...props}>
			{children}
		</Dialog.Content>
	);
};

export default MenuModalContent;
