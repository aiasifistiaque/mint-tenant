import { Dialog } from '@chakra-ui/react';
import { FC, ReactNode } from 'react';
import { radius } from '../../../..';

type InsertModalContentProps = {
	children: ReactNode;
	[key: string]: any;
};

/** The dialog's box, inside an InsertModal. */
const InsertModalContent: FC<InsertModalContentProps> = ({ children, ...props }) => (
	<Dialog.Content
		borderRadius={radius.MODAL}
		bg='bg.panel'
		borderWidth='1px'
		borderColor='border'
		{...props}>
		{children}
	</Dialog.Content>
);

export default InsertModalContent;
