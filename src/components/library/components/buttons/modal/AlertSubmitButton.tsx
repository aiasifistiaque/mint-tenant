import { FC, ReactNode } from 'react';
import { Button, ButtonProps } from '@chakra-ui/react';

type ModalSubmitButtonProps = ButtonProps & {
	isLoading?: boolean;
	children?: ReactNode;
};

const AlertSubmitButton: FC<ModalSubmitButtonProps> = ({ children, isLoading, loading, ...props }) => {
	return (
		<Button
			// `isLoading` is the v2 name callers still pass; Chakra v3 only knows `loading`.
			loading={isLoading || loading}
			loadingText='Processing'
			spinnerPlacement='start'
			type='submit'
			size='sm'
			minW='84px'
			px={4}
			{...props}>
			{children || 'Confirm'}
		</Button>
	);
};

export default AlertSubmitButton;
