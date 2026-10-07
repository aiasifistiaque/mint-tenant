import { FC, ReactNode } from 'react';
import { Drawer, Flex, Popover } from '@chakra-ui/react';

type PopModalBodyProps = {
	children: ReactNode;
	isMobile: boolean;
};

const PopModalBody: FC<PopModalBodyProps> = ({ children, isMobile }) => {
	if (isMobile) {
		return (
			<Drawer.Body
				px={4}
				pt={0}
				pb={4}
				overflowY='auto'>
				<Flex
					flex={1}
					flexDir='column'
					gap={3}>
					{children}
				</Flex>
			</Drawer.Body>
		);
	}

	return (
		<Popover.Body
			px={4}
			py={0}>
			<Flex
				flexDir='column'
				gap={3}>
				{children}
			</Flex>
		</Popover.Body>
	);
};

export default PopModalBody;
