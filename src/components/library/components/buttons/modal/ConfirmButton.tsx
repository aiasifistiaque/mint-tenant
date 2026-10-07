import { FC, ReactNode } from 'react';
import { Button, ButtonProps } from '@chakra-ui/react';
import { radius, styles } from '../../../config';

type ConfirmButtonProps = ButtonProps & {
	children?: ReactNode;
	icon?: ReactNode;
};

/** A footer's primary action — the same size as the DiscardButton beside it. */
const ConfirmButton: FC<ConfirmButtonProps> = ({ children, icon, ...props }) => {
	return (
		<Button
			{...(styles.MODAL_BUTTON as ButtonProps)}
			borderRadius={radius.BUTTON}
			{...props}>
			{children || 'Confirm'}
		</Button>
	);
};

export default ConfirmButton;
