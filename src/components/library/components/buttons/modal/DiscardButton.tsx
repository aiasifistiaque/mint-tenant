import { FC, ReactNode } from 'react';
import { Button, ButtonProps } from '@chakra-ui/react';
import { radius, styles } from '../../../config';

type DiscardButtonProps = ButtonProps & {
	children?: ReactNode;
};

/**
 * The secondary action in a drawer footer. Outlined rather than filled, so the
 * one filled button beside it is unambiguously the thing you came to do —
 * two solid buttons of equal weight make you stop and read both.
 */
const DiscardButton: FC<DiscardButtonProps> = ({ children, ...props }) => {
	return (
		<Button
			variant='outline'
			{...(styles.MODAL_BUTTON as ButtonProps)}
			borderRadius={radius.BUTTON}
			{...props}>
			{children || 'Discard'}
		</Button>
	);
};

export default DiscardButton;
