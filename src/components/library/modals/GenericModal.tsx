'use client';

import { FC, ReactNode } from 'react';
import { Dialog, Portal } from '@chakra-ui/react';

export type GenericModalProps = any & {
	isOpen: boolean;
	onClose: () => void;
	children: ReactNode;
	size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'cover';
	closeOnOverlayClick?: boolean;
	closeOnEsc?: boolean;
	scrollBehavior?: 'inside' | 'outside';
	isCentered?: boolean;
	motionPreset?:
		| 'slide-in-bottom'
		| 'slide-in-top'
		| 'slide-in-left'
		| 'slide-in-right'
		| 'scale'
		| 'none';
	placement?: 'center' | 'top' | 'bottom';
	initialFocusRef?: React.RefObject<any>;
	finalFocusRef?: React.RefObject<any>;
	trapFocus?: boolean;
	blockScrollOnMount?: boolean;
	returnFocusOnClose?: boolean;
	preserveScrollBarGap?: boolean;
};

/**
 * GenericModal - A wrapper component for Chakra UI v3 Dialog
 *
 * This component provides a backward-compatible API similar to Chakra UI v2 Modal,
 * but uses the v3 Dialog components internally.
 *
 * Portalled, and its content is mounted only while open (`lazyMount` +
 * `unmountOnExit`), like ConfirmModal. Without that a closed modal still sat
 * in its parent's tree, hidden: every parent re-render re-rendered the whole
 * modal body (FormulaModal inside the settings editor, the publish prompt
 * inside RouteEditor), which is what made pages holding one feel slow. Keep
 * state that must survive a close in the component that renders GenericModal,
 * not inside its children.
 *
 * @example
 * ```tsx
 * <GenericModal isOpen={isOpen} onClose={onClose} size="xl">
 *   <ModalHeader>My Modal Title</ModalHeader>
 *   <ModalCloseButton />
 *   <ModalBody>
 *     Modal content goes here
 *   </ModalBody>
 *   <ModalFooter>
 *     <Button onClick={onClose}>Close</Button>
 *   </ModalFooter>
 * </GenericModal>
 * ```
 */
const GenericModal: FC<GenericModalProps> = ({
	isOpen,
	onClose,
	children,
	size = 'md',
	closeOnOverlayClick = true,
	closeOnEsc = true,
	scrollBehavior = 'inside',
	isCentered = true,
	motionPreset = 'scale',
	placement = 'center',
	initialFocusRef,
	finalFocusRef,
	trapFocus = true,
	blockScrollOnMount = true,
	returnFocusOnClose = true,
	preserveScrollBarGap = false,
	...props
}) => {
	const handleOpenChange = (details: { open: boolean }) => {
		if (!details.open) {
			onClose();
		}
	};

	return (
		<Dialog.Root
			open={isOpen}
			onOpenChange={handleOpenChange}
			size={size}
			scrollBehavior={scrollBehavior}
			placement={placement}
			motionPreset={motionPreset}
			closeOnInteractOutside={closeOnOverlayClick}
			closeOnEscape={closeOnEsc}
			initialFocusEl={initialFocusRef ? () => initialFocusRef.current : undefined}
			finalFocusEl={finalFocusRef ? () => finalFocusRef.current : undefined}
			trapFocus={trapFocus}
			preventScroll={blockScrollOnMount}
			restoreFocus={returnFocusOnClose}
			persistentElements={preserveScrollBarGap ? [() => document.body] : undefined}
			lazyMount
			unmountOnExit
			{...props}>
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>{children}</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
};

export default GenericModal;
