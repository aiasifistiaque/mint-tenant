import { Stat } from '@chakra-ui/react';
import { ReactNode } from 'react';

const StatLabel = ({ children, ...props }: any & { children: ReactNode }) => {
	return (
		<Stat.Label
			color='text.light'
			_dark={{ color: 'text.dark' }}
			w='full'
			fontSize='1.15rem'
			{...props}>
			{children}
		</Stat.Label>
	);
};

export default StatLabel;
