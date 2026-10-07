import { sizes, THEME } from '../../../';
import { FlexProps, Flex } from '@chakra-ui/react';
import { FC, ReactNode } from 'react';

const SidebarContainer: FC<FlexProps & { children: ReactNode }> = ({ children, ...props }) => {
	return (
		<Flex {...containerCss}>
			<Flex
				{...bodyCss}
				{...props}>
				{children}
			</Flex>
		</Flex>
	);
};

const containerCss: FlexProps = {
	h: '100vh',
	position: 'fixed',
	overflow: 'none',
	w: { base: 'full', md: sizes.SIDEBAR_WIDTH },
	minW: sizes.SIDEBAR_WIDTH,
	bg: 'sidebar.light',
	_dark: { bg: 'sidebar.dark' },
};

const bodyCss: FlexProps = {
	flexDir: 'column',
	flex: 1,
	bg: 'sidebar.light',
	w: 'full',
	_dark: { bg: 'sidebar.dark' },
	borderTopRadius: { base: '0', md: THEME == 'basic' ? 0 : 'xl' },
	pl: sizes.SIDEBAR_PX,
	mx: THEME == 'basic' ? 0 : 4,
	zIndex: '9999',
	// Separates the nav column from the page. Same width and colour as the
	// navbar's bottom border (`styles.NAVBAR`) so the two rules read as one
	// frame where they meet — `container.border*` is a shade darker (#e4e4e4
	// vs #ebebeb) and showed as a mismatch at the corner. The header above
	// carries this same border; see SidebarLogo.
	borderRightWidth: 1,
	borderRightColor: { base: 'navbar.border.light', _dark: 'navbar.border.dark' },
};

export default SidebarContainer;
