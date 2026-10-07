import { ReactNode } from 'react';
import { Dialog } from '@chakra-ui/react';

const InsertModalHeader = ({ children, ...props }: { children: ReactNode; [key: string]: any }) => {
	return (
		<Dialog.Header
			px={{ base: 4, md: 6 }}
			pt={{ base: 4, md: 5 }}
			pb={{ base: 3, md: 4 }}
			pr={12}
			{...props}>
			<Dialog.Title fontSize='16px'>{children}</Dialog.Title>
		</Dialog.Header>
	);
};

export default InsertModalHeader;
