import { FC, ReactNode } from 'react';
import { Button, ButtonProps } from '@chakra-ui/react';
import { radius, styles } from '../../../config';

type ModalSubmitButtonProps = ButtonProps & {
	isLoading: boolean;
	children?: ReactNode;
};

/** The drawer's one primary action. Matches DiscardButton's metrics exactly. */
const ModalSubmitButton: FC<ModalSubmitButtonProps> = ({ children, isLoading, loading, ...props }) => {
	return (
		<Button
			// `isLoading` is the v2 name callers still pass; Chakra v3 only knows `loading`.
			loading={isLoading || loading}
			loadingText='Processing'
			spinnerPlacement='start'
			{...(styles.MODAL_BUTTON as ButtonProps)}
			borderRadius={radius.BUTTON}
			type='submit'
			{...props}>
			{children || 'Confirm'}
		</Button>
	);
};

export default ModalSubmitButton;
