import { FC, ReactNode } from 'react';
import { Dialog } from '@chakra-ui/react';

type CustomDrawerHeaderProps = {
	children?: ReactNode;
	[key: string]: any;
};

const CustomDrawerHeader: FC<CustomDrawerHeaderProps> = ({ children, ...props }) => {
	return (
		<Dialog.Header
			bg='sidebar.light'
			borderColor='border.light'
			borderBottomWidth={1}
			_dark={{ bg: 'background.dark', borderColor: 'border.dark' }}
			borderTopRadius='2xl'
			fontWeight='bold'
			fontSize='.9rem'
			h='100px'
			{...props}>
			{children}
		</Dialog.Header>
	);
};

export default CustomDrawerHeader;
