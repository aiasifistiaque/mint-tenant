import { Dialog as ChakraDialog, Portal, Drawer } from '@chakra-ui/react';
import { FC, ReactNode } from 'react';

import { styles, useIsMobile, useModalLayout } from '../../../..';
import { ModalLayoutProvider } from './ModalLayoutContext';
import SheetContent from './SheetContent';

type MenuModalProps = {
	children: ReactNode;
	open?: boolean;
	onOpenChange?: (details: { open: boolean }) => void;
	// Legacy v2 props for compatibility
	isOpen?: boolean;
	onClose?: () => void;
	// Smaller utility modals (preferences, export field pickers) stay a
	// centered dialog on desktop regardless of the admin's drawer
	// preference — that preference is meant for the bigger view/create/edit
	// forms, not these. Mobile still gets the bottom sheet either way.
	forceModal?: boolean;
	[key: string]: any;
};

const MenuModal: FC<MenuModalProps> = ({
	children,
	open,
	isOpen,
	onClose,
	onOpenChange,
	forceModal,
	...props
}) => {
	const isMobile = useIsMobile();
	const layoutPreference = useModalLayout();
	const layout = forceModal ? 'modal' : layoutPreference;
	const drawerStyleProps: any = styles.DRAWER;
	const rightDrawerStyleProps: any = styles.DRAWER_END;

	// Handle both v2 and v3 prop patterns
	const isDialogOpen = open ?? isOpen ?? false;
	const handleOpenChange = (details: { open: boolean }) => {
		if (onOpenChange) {
			onOpenChange(details);
		} else if (onClose && !details.open) {
			onClose();
		}
	};

	if (isMobile) {
		// Still use Drawer for mobile - Chakra v3 Drawer
		return (
			<Drawer.Root
				lazyMount
				unmountOnExit
				preventScroll
				placement='bottom'
				size='full'
				open={isDialogOpen}
				onOpenChange={handleOpenChange}
				{...props}>
				<Portal>
					<Drawer.Backdrop />
					<Drawer.Positioner>
						<SheetContent {...drawerStyleProps}>
							<ModalLayoutProvider value='drawer'>{children}</ModalLayoutProvider>
						</SheetContent>
					</Drawer.Positioner>
				</Portal>
			</Drawer.Root>
		);
	}

	if (layout === 'drawer') {
		return (
			<Drawer.Root
				lazyMount
				unmountOnExit
				preventScroll
				placement='end'
				size='xl'
				open={isDialogOpen}
				onOpenChange={handleOpenChange}
				{...props}>
				<Portal>
					<Drawer.Backdrop />
					<Drawer.Positioner>
						<Drawer.Content {...rightDrawerStyleProps}>
							<ModalLayoutProvider value='drawer'>{children}</ModalLayoutProvider>
						</Drawer.Content>
					</Drawer.Positioner>
				</Portal>
			</Drawer.Root>
		);
	}

	return (
		<ChakraDialog.Root
			preventScroll={true}
			open={isDialogOpen}
			onOpenChange={handleOpenChange}
			{...props}>
			<Portal>
				<ChakraDialog.Backdrop
					_light={{ bg: styles?.color?.MODAL_OVERLAY?.LIGHT }}
					_dark={{ bg: styles?.color?.MODAL_OVERLAY?.DARK }}
				/>
				<ChakraDialog.Positioner>
					<ChakraDialog.Content {...styles?.MODAL}>
						<ModalLayoutProvider value='modal'>{children}</ModalLayoutProvider>
					</ChakraDialog.Content>
				</ChakraDialog.Positioner>
			</Portal>
		</ChakraDialog.Root>
	);
};

export default MenuModal;
