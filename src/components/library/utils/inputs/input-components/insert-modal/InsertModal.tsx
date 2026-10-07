import { FC, ReactNode } from 'react';
import { Dialog, Portal } from '@chakra-ui/react';

type InsertModalProps = {
	children: ReactNode;
	open?: boolean;
	onOpenChange?: (details: { open: boolean }) => void;
	// Legacy v2 props for compatibility
	isOpen?: boolean;
	onClose?: () => void;
	size?: 'sm' | 'md' | 'lg' | 'xl' | 'xs' | 'full' | 'cover';
	[key: string]: any;
};

/**
 * A portalled dialog: backdrop and positioner. Its children go in an
 * InsertModalContent — that's the one box, so it isn't drawn here too.
 */
const InsertModal: FC<InsertModalProps> = ({
	children,
	open,
	isOpen,
	onClose,
	onOpenChange,
	size = 'lg',
	...props
}) => {
	// Handle both v2 and v3 prop patterns
	const isDialogOpen = open ?? isOpen ?? false;
	const handleOpenChange = (details: { open: boolean }) => {
		if (onOpenChange) {
			onOpenChange(details);
		} else if (onClose && !details.open) {
			onClose();
		}
	};

	return (
		<Dialog.Root
			size={size as any}
			placement='center'
			scrollBehavior='inside'
			open={isDialogOpen}
			onOpenChange={handleOpenChange}
			{...props}>
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>{children}</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
};

export default InsertModal;
