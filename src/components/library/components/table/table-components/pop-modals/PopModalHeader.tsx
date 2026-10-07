import { FC, ReactNode } from 'react';
import { Drawer, Popover } from '@chakra-ui/react';

type PopModalHeaderProps = {
	children: ReactNode;
	isMobile: boolean;
};

/**
 * On mobile this is the same sheet header the sort and column-picker drawers
 * use, so a filter sheet doesn't announce itself differently from its
 * neighbours. On desktop the filter is a popover, which wants a smaller label.
 */
const PopModalHeader: FC<PopModalHeaderProps> = ({ children, isMobile }) => {
	if (isMobile) {
		return (
			<Drawer.Header
				px={4}
				pt={4}
				pb={3}
				gap={1}
				flexDir='column'
				alignItems='flex-start'
				border='none'>
				<Drawer.Title
					color='text.light'
					_dark={{ color: 'text.dark' }}
					fontWeight='600'
					fontSize='16px'
					letterSpacing='-0.01em'
					lineHeight='1.4'
					pr={8}>
					{children}
				</Drawer.Title>
			</Drawer.Header>
		);
	}

	return (
		<Popover.Header
			px={4}
			pt={4}
			pb={2}
			lineHeight={1.4}
			color='fg.muted'
			fontSize='11px'
			letterSpacing='0.06em'
			textTransform='uppercase'
			fontWeight='600'
			border='none'>
			{children}
		</Popover.Header>
	);
};

export default PopModalHeader;
