import { FC, ReactNode } from 'react';
import { Dialog } from '@chakra-ui/react';

type AlertDialogHeaderProps = {
	children?: ReactNode;
	[key: string]: any;
};

// Note: Chakra v3 uses Dialog components for both Modal and AlertDialog
const AlertDialogHeader: FC<AlertDialogHeaderProps> = ({ children, ...props }) => {
	return (
		<Dialog.Header
			p={3}
			px={4}
			bg='sidebar.light'
			borderColor='border.light'
			borderBottomWidth={1}
			_dark={{ bg: 'background.dark', borderColor: 'border.dark', borderWidth: 0 }}
			borderTopRadius='2xl'
			fontWeight='bold'
			fontSize='.9rem'
			maxH='54px'
			{...props}>
			<Dialog.Title
				color='text.light'
				_dark={{ color: 'text.dark' }}>
				{children}
			</Dialog.Title>
		</Dialog.Header>
	);
};

export default AlertDialogHeader;
