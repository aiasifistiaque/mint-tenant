import { FC, ReactNode } from 'react';
import { Flex } from '@chakra-ui/react';
import { useIsMobile } from '../../../';

type SidebarFooterProps = {
	children: ReactNode;
};

const SidebarFooter: FC<SidebarFooterProps> = ({ children }) => {
	const isMobile = useIsMobile();
	return <Flex mb={isMobile ? 12 : 0}>{children}</Flex>;
};

export default SidebarFooter;
