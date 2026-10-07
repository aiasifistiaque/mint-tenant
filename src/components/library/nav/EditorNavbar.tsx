'use client';

import { Flex, FlexProps } from '@chakra-ui/react';
import { FC, ReactNode } from 'react';
import { sizes, zIndex, padding, EditorSideDrawer, styles } from '..';

type FlexPropsType = FlexProps & {
	children: ReactNode;
	showMenu?: boolean;
	sidebarData?: any;
	doc?: any;
};

const PX = { base: padding.BASE, md: padding.MD, lg: padding.LG };

const EditorNavbar: FC<FlexPropsType> = ({ children, showMenu, sidebarData, doc, ...props }) => {
	return (
		<Flex
			{...container}
			{...props}
			position='fixed'>
			{showMenu && (
				<EditorSideDrawer
					doc={doc}
					sidebarData={sidebarData}
				/>
			)}
			{children}
		</Flex>
	);
};

const container: FlexProps = {
	top: 0,
	_light: {
		borderBottomColor: 'container.borderLight',
	},
	px: PX,
	w: '100vw',
	...styles.NAVBAR,
};

export default EditorNavbar;
