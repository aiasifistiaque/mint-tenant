import { Drawer, CloseButton } from '@chakra-ui/react';

const PopModalCloseButton = ({ isMobile }: { isMobile: boolean }) => {
	if (isMobile) {
		return (
			// Was rendering an empty trigger with no button inside it, so filter
			// sheets had no visible way out but the backdrop.
			<Drawer.CloseTrigger asChild>
				<CloseButton
					size='sm'
					position='absolute'
					top='3'
					insetEnd='3'
					borderRadius='full'
					color='fg.muted'
					_hover={{ bg: 'bg.muted', color: 'fg' }}
				/>
			</Drawer.CloseTrigger>
		);
	}

	return null;
};

export default PopModalCloseButton;
