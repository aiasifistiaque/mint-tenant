import { FC, ReactNode } from 'react';
import { Dialog } from '@chakra-ui/react';

type InsertModalBodyProps = {
	children: ReactNode;
	[key: string]: any;
};

const InsertModalBody: FC<InsertModalBodyProps> = ({ children, ...props }) => {
	return (
		<Dialog.Body
			px={{ base: 4, md: 6 }}
			pt={0}
			pb={{ base: 4, md: 5 }}
			{...props}>
			{children}
		</Dialog.Body>
	);
};

export default InsertModalBody;
