'use client';

import { Flex, useDisclosure, ButtonProps } from '@chakra-ui/react';
import { useEffect, FC, ReactNode } from 'react';

import { MenuItem, PromptType } from '../../../..';
import PromptDialog from '../../../../modals/modal-components/PromptDialog';

type ConfirmModalProps = {
	title?: string;
	icon?: string;
	prompt?: PromptType;
	isLoading?: boolean;
	isSuccess?: boolean;
	colorPalette?: ButtonProps['colorPalette'];
	onConfirm: (e: any) => void;
	onClose?: () => void;
	children?: ReactNode;
	// Controlled mode: when `open` is passed, the dialog's open state is driven
	// by the caller instead of an internal useDisclosure, and no trigger is
	// rendered — used by TableMenu so the dialog lives outside the dropdown
	// menu's own mount lifecycle.
	open?: boolean;
};

/**
 * A generic "are you sure?" confirmation dialog for menu actions that aren't a
 * delete (disable/enable, resend, renew, etc). Mirrors DeleteItemModal's dialog
 * chrome so every confirm prompt in a table's row menu looks and behaves the same.
 */
const ConfirmModal: FC<ConfirmModalProps> = ({
	title,
	icon,
	prompt,
	isLoading,
	isSuccess,
	colorPalette = 'blackAlpha',
	onConfirm,
	onClose,
	children,
	open: controlledOpen,
}) => {
	const isControlled = controlledOpen !== undefined;
	const { open: internalOpen, onOpen, onClose: close } = useDisclosure();
	const isOpen = isControlled ? controlledOpen : internalOpen;

	const closeItem = () => {
		onClose?.();
		if (!isControlled) close();
	};

	useEffect(() => {
		if (isSuccess && !isLoading) {
			closeItem();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isSuccess]);

	const titleText = prompt?.title || 'Confirm action';
	const bodyText = prompt?.body || 'Are you sure you want to proceed?';

	return (
		<>
			{isControlled ? null : children ? (
				<Flex onClick={onOpen}>{children}</Flex>
			) : (
				<MenuItem
					icon={icon}
					onClick={onOpen}>
					{title || 'Confirm'}
				</MenuItem>
			)}
			<PromptDialog
				open={isOpen}
				onClose={closeItem}
				onConfirm={() => onConfirm({ preventDefault() {} })}
				// A red button means a destructive action; anything else is a plain confirm.
				tone={colorPalette === 'red' ? 'danger' : 'default'}
				title={titleText}
				description={bodyText}
				confirmLabel={prompt?.btnText || 'Proceed'}
				loading={isLoading}
				loadingText='Processing'
			/>
		</>
	);
};

export default ConfirmModal;
