import { FC, ReactNode } from 'react';
import { Dialog } from '@chakra-ui/react';

type CustomModalHeaderProps = {
	children?: ReactNode;
	[key: string]: any;
};

const CustomModalHeader: FC<CustomModalHeaderProps> = ({ children, ...props }) => {
	return (
		<Dialog.Header
			px={{ base: 4, md: 6 }}
			pt={{ base: 4, md: 5 }}
			pb={{ base: 3, md: 4 }}
			fontWeight='600'
			fontSize='16px'
			letterSpacing='-0.01em'
			color='text.light'
			_dark={{ color: 'text.dark' }}
			{...props}>
			{children}
		</Dialog.Header>
	);
};

export default CustomModalHeader;
