import { ButtonProps, Button } from '@chakra-ui/react';
import { FC, ReactNode } from 'react';

type DiscardButtonProps = ButtonProps & {
	children: ReactNode;
};

const DiscardButton: FC<DiscardButtonProps> = ({ children, ...props }) => {
	return (
		<Button
			variant='outline'
			px={3}
			size='sm'
			{...props}>
			{children}
		</Button>
	);
};

export default DiscardButton;
