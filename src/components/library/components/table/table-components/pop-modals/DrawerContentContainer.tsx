import { FC, ReactNode } from 'react';
import { DrawerContentProps } from '@chakra-ui/react';
import { styles } from '../../../..';
import SheetContent from '../menu-modals/SheetContent';

type DrawerContentType = DrawerContentProps & {
	children: ReactNode;
};

/** Matches the sheet used by the sort and column-picker drawers; swipes down to close. */
const DrawerContentContainer: FC<DrawerContentType> = ({ children, ...props }) => {
	return (
		<SheetContent
			bg='menu.light'
			_dark={{ bg: 'menu.dark' }}
			boxShadow={styles.DRAWER.boxShadow}
			w='100%'
			h='auto'
			maxH='85dvh'
			minH='20vh'
			userSelect='none'
			overflow='hidden'
			borderTopRadius='20px'
			{...props}>
			{children}
		</SheetContent>
	);
};

export default DrawerContentContainer;
