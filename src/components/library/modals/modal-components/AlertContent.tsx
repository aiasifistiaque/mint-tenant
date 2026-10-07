import { FC, ReactNode } from 'react';
import { Dialog } from '@chakra-ui/react';
import { styles } from '../../config';

type AlertContentProps = {
	children: ReactNode;
	[key: string]: any;
};

const AlertContent: FC<AlertContentProps> = ({ children, ...props }) => {
	return (
		<Dialog.Content
			{...(styles.MODAL as any)}
			{...props}>
			{children}
		</Dialog.Content>
	);
};

export default AlertContent;
