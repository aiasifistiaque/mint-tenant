import React from 'react';
import { Dialog, DialogContentProps, Portal } from '@chakra-ui/react';

type AlertDialogContentProps = DialogContentProps & {
	children: React.ReactNode;
};

const AlertDialogContent = ({ children, ...props }: AlertDialogContentProps) => {
	return (
		<Dialog.Content
			px={4}
			boxShadow='lg'
			borderRadius='xl'
			bg='menu.light'
			_dark={{
				bg: 'menu.dark',
			}}
			{...props}>
			{children}
		</Dialog.Content>
	);
};

export default AlertDialogContent;
