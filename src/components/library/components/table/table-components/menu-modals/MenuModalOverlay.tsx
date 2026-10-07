import { styles, useIsMobile } from '../../../..';
import { Drawer, Dialog } from '@chakra-ui/react';

// Note: In v3, Backdrop is automatically included in Dialog.Root/Drawer.Root
// This component is deprecated but kept for backward compatibility
const MenuModalOverlay = () => {
	const isMobile = useIsMobile();

	console.warn(
		'MenuModalOverlay is deprecated in Chakra v3. Backdrop is automatically included in Dialog.Root.'
	);

	if (isMobile) {
		return <Drawer.Backdrop />;
	}

	return (
		<Dialog.Backdrop
			_light={{
				bg: styles.color.MODAL_OVERLAY.LIGHT,
			}}
		/>
	);
};

export default MenuModalOverlay;
