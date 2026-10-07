import { Column, sizes, THEME } from '../../..';
import { StackProps } from '@chakra-ui/react';
import { FC, ReactNode } from 'react';

type SidebarContainerProps = StackProps & {
	children: ReactNode;
};

const SidebarContent: FC<SidebarContainerProps> = ({ children, ...props }) => {
	return (
		<Column
			flex={1}
			bg='sidebar.light'
			_dark={{ bg: 'sidebar.dark' }}
			backdropFilter='blur(10px)'
			borderTopRadius={{ base: '0', md: THEME == 'basic' ? 0 : 'xl' }}
			w='full'
			pl={sizes.SIDEBAR_PX}
			mx={THEME == 'basic' ? 0 : 4}
			zIndex='9999'
			{...props}>
			{children}
		</Column>
	);
};

export default SidebarContent;
