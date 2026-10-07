import { sizes, radius, shadow } from '../../../..';
import { Popover, PopoverContentProps } from '@chakra-ui/react';
import { FC, ReactNode } from 'react';

type PopoverContentContainerProps = PopoverContentProps & {
	children: ReactNode;
};

/**
 * Padding lives on the header / body / footer inside, not here — the old `p={4}`
 * stacked on top of Popover's own slot padding, so nothing in a filter popup
 * shared a left edge.
 */
const PopoverContentContainer: FC<PopoverContentContainerProps> = ({ children, ...props }) => {
	return (
		<Popover.Content
			p={0}
			borderRadius={radius.MENU}
			bg='menu.light'
			borderWidth={1}
			borderColor='border.muted'
			boxShadow={shadow.MENU}
			_dark={{
				bg: 'menu.dark',
				borderColor: 'border',
			}}
			_focusVisible={{ outline: 'none' }}
			w={sizes.POPOVER_WIDTH}
			maxW={sizes.POPOVER_WIDTH}
			{...props}>
			{children}
		</Popover.Content>
	);
};

export default PopoverContentContainer;
