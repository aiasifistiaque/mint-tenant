import { FC, ReactNode } from 'react';
import { Flex, FlexProps } from '@chakra-ui/react';
import { sizes, styles } from '../../..';

type SidebarLogoProps = FlexProps & {
	children: ReactNode;
};

const SidebarLogo: FC<SidebarLogoProps> = ({ children, ...props }) => {
	return (
		<Flex
			position='fixed'
			top={0}
			left={0}
			px={5}
			{...styles.SIDEBAR_NAV}
			// Continues the sidebar's right border up through the header, so the
			// column reads as one edge instead of a rule that starts below the
			// logo. Set here rather than on `styles.SIDEBAR_NAV` because the
			// mobile SideDrawer spreads that same object and has no column to
			// divide. Same token and width as the navbar's bottom border and as
			// SidebarContainer's `bodyCss` — all three have to agree or the
			// corner where they meet shows a seam.
			borderRightWidth={1}
			borderRightColor={{ base: 'navbar.border.light', _dark: 'navbar.border.dark' }}
			userSelect={'none'}
			w={{ base: '320px', md: sizes.SIDEBAR_WIDTH }}
			{...props}>
			{children}
		</Flex>
	);
};

export default SidebarLogo;
