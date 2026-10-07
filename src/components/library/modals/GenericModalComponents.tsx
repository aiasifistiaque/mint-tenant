'use client';

import { FC, ReactNode } from 'react';
import { Dialog, IconButton } from '@chakra-ui/react';
import { Icon } from '../icon';

/**
 * ModalHeader - Generic modal header component
 */
export const ModalHeader: FC<{ children: ReactNode } & any> = ({ children, ...props }) => {
	return (
		<Dialog.Header
			px={{ base: 4, md: 6 }}
			pt={{ base: 4, md: 5 }}
			pb={{ base: 3, md: 4 }}
			fontSize='16px'
			fontWeight='600'
			letterSpacing='-0.01em'
			color={{ _light: 'text.light', _dark: 'text.dark' }}
			{...props}>
			{children}
		</Dialog.Header>
	);
};

/**
 * ModalBody - Generic modal body component
 */
export const ModalBody: FC<{ children: ReactNode } & any> = ({ children, ...props }) => {
	return (
		<Dialog.Body
			px={{ base: 4, md: 6 }}
			pt={0}
			pb={{ base: 4, md: 5 }}
			overflowY='auto'
			{...props}>
			{children}
		</Dialog.Body>
	);
};

/** ModalFooter - the shared modal footer (modal-components/CustomModalFooter). */
export { default as ModalFooter } from './modal-components/CustomModalFooter';

/**
 * ModalCloseButton - Generic modal close button
 */
export const ModalCloseButton: FC<any> = props => {
	return (
		<Dialog.CloseTrigger asChild>
			<IconButton
				variant='ghost'
				size='sm'
				position='absolute'
				insetEnd={3}
				top={3}
				borderRadius='full'
				color='fg.muted'
				_hover={{ bg: 'bg.muted', color: 'fg' }}
				aria-label='Close modal'
				{...props}>
				<Icon
					name='close'
					size={18}
				/>
			</IconButton>
		</Dialog.CloseTrigger>
	);
};

/**
 * ModalOverlay - For backward compatibility (handled by GenericModal)
 * This is a no-op component since GenericModal handles the backdrop
 */
export const ModalOverlay: FC<any> = () => null;

/**
 * ModalContent - Generic modal content wrapper
 * Use this when you need custom styling for the modal content container
 */
export const ModalContent: FC<{ children: ReactNode } & any> = ({ children, ...props }) => {
	return <Dialog.Content {...props}>{children}</Dialog.Content>;
};
