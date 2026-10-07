'use client';
import { Drawer, Dialog as ChakraDialog, Portal } from '@chakra-ui/react';
import { styles, useIsMobile, useModalLayout } from '../../../..';
import { FC, ReactNode } from 'react';
import { ModalLayoutProvider } from './ModalLayoutContext';
import SheetContent from './SheetContent';

type DialogProps = {
	children: ReactNode;
	open?: boolean;
	onOpenChange?: (details: { open: boolean }) => void;
	// Legacy v2 props for compatibility
	isOpen?: boolean;
	onClose?: () => void;
	size?: 'xl' | 'sm' | 'md' | 'lg' | 'xs' | 'full' | 'cover';
	/**
	 * Accepted and ignored.
	 *
	 * This component picks its own placement from the viewport and the admin's
	 * layout preference — bottom sheet on mobile, end drawer or centred dialog
	 * on desktop. It used to spread `props` after its own `placement`, so a
	 * leftover Chakra v2 `placement='center'` on a caller silently overrode
	 * that and left the mobile sheet floating in the middle of the screen.
	 * Swallowing the prop here means that can't happen again, and it also keeps
	 * an unknown attribute off the DOM.
	 */
	placement?: never;
	// Smaller utility/confirmation dialogs stay a centered dialog on desktop
	// regardless of the admin's drawer preference — see MenuModal's same prop.
	forceModal?: boolean;
	[key: string]: any;
};

/**
 * Most dialogs here wrap their header, body and footer in a single <form>, which
 * would otherwise sit between the content's flex column and the slots that rely
 * on it — leaving the body unable to scroll and its overflow clipped, so tall
 * forms were cut off with no way to reach the rest. Making the form the flex
 * column restores the usual header / scrolling body / pinned footer.
 */
const formLayoutCss = {
	'& > form': {
		display: 'flex',
		flexDirection: 'column',
		flex: 1,
		minHeight: 0,
		overflow: 'hidden',
	},
};

const Dialog: FC<DialogProps> = ({
	children,
	open,
	isOpen,
	onClose,
	onOpenChange,
	size = 'xl',
	forceModal,
	placement: _ignoredPlacement,
	...props
}) => {
	const isMobile = useIsMobile();
	const layoutPreference = useModalLayout();
	const layout = forceModal ? 'modal' : layoutPreference;

	// Handle both v2 and v3 prop patterns
	const isDialogOpen = open ?? isOpen ?? false;
	const handleOpenChange = (details: { open: boolean }) => {
		if (onOpenChange) {
			onOpenChange(details);
		} else if (onClose && !details.open) {
			onClose();
		}
	};

	if (!isMobile && layout === 'drawer') {
		return (
			<Drawer.Root
				lazyMount
				unmountOnExit
				preventScroll
				placement='end'
				size='xl'
				open={isDialogOpen}
				onOpenChange={handleOpenChange}
				closeOnInteractOutside={false}
				{...props}>
				<Portal>
					<Drawer.Backdrop />
					<Drawer.Positioner>
						<Drawer.Content
							onClick={(e: any) => e.stopPropagation()}
							css={formLayoutCss}
							{...styles.DRAWER_END}
							overflow='hidden'>
							<ModalLayoutProvider value='drawer'>{children}</ModalLayoutProvider>
						</Drawer.Content>
					</Drawer.Positioner>
				</Portal>
			</Drawer.Root>
		);
	}

	if (isMobile) {
		return (
			<Drawer.Root
				lazyMount
				unmountOnExit
				preventScroll={true}
				placement='bottom'
				size='full'
				open={isDialogOpen}
				onOpenChange={handleOpenChange}
				closeOnInteractOutside={false}
				{...props}>
				<Portal>
					<Drawer.Backdrop />
					<Drawer.Positioner>
						<SheetContent
							onClick={(e: any) => e.stopPropagation()}
							css={formLayoutCss}
							bg='container.newLight'
							_dark={{ bg: 'menu.dark' }}
							boxShadow={styles.DRAWER.boxShadow}
							w='100%'
							// Content height, up to 85% of the visible screen (see styles.DRAWER).
							h='auto'
							maxH='85dvh'
							minH='20vh'
							userSelect='none'
							overflow='hidden'
							borderTopRadius='20px'>
							<ModalLayoutProvider value='drawer'>{children}</ModalLayoutProvider>
						</SheetContent>
					</Drawer.Positioner>
				</Portal>
			</Drawer.Root>
		);
	}

	return (
		<ChakraDialog.Root
			open={isDialogOpen}
			onOpenChange={handleOpenChange}
			size={size}
			scrollBehavior='inside'
			closeOnInteractOutside={false}
			{...props}>
			<Portal>
				<ChakraDialog.Backdrop
					_light={{ bg: styles.color.MODAL_OVERLAY.LIGHT }}
					_dark={{ bg: styles.color.MODAL_OVERLAY.DARK }}
				/>
				<ChakraDialog.Positioner>
					<ChakraDialog.Content
						onClick={(e: any) => e.stopPropagation()}
						{...styles.MODAL}
						css={formLayoutCss}>
						<ModalLayoutProvider value='modal'>{children}</ModalLayoutProvider>
					</ChakraDialog.Content>
				</ChakraDialog.Positioner>
			</Portal>
		</ChakraDialog.Root>
	);
};

export default Dialog;
