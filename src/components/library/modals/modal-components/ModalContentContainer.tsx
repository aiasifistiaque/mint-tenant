import { Dialog } from '@chakra-ui/react';
import { FC, ReactNode } from 'react';
import { styles } from '../../config';

type ModalContentContainerProps = {
	children: ReactNode;
	[key: string]: any;
};

const ModalContentContainer: FC<ModalContentContainerProps> = ({ children, ...props }) => {
	return (
		<Dialog.Content
			{...styles.MODAL}
			{...props}>
			{children}
		</Dialog.Content>
	);
};

export default ModalContentContainer;
