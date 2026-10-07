import { FC, ReactNode } from 'react';
import { Button } from '@chakra-ui/react';

type PopModalFooterLinkProps = {
	children: ReactNode;
	onClick: () => void;
	disabled?: boolean;
};

/** Quiet secondary action for the left side of a split `PopModal` footer. */
const PopModalFooterLink: FC<PopModalFooterLinkProps> = ({ children, onClick, disabled }) => {
	return (
		<Button
			size='xs'
			h='28px'
			px={2}
			variant='ghost'
			color='fg'
			disabled={disabled}
			onClick={onClick}>
			{children}
		</Button>
	);
};

export default PopModalFooterLink;
