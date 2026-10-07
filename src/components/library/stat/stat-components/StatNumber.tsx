import { ReactNode } from 'react';
import { Stat } from '@chakra-ui/react';

const StatNumber = ({ children, ...props }: any & { children: ReactNode }) => {
	return (
		<Stat.ValueText
			color='fg'
			fontSize='1.4rem'
			{...props}>
			{children}
		</Stat.ValueText>
	);
};

export default StatNumber;
