import { FC, ReactNode } from 'react';
import { Grid, GridProps } from '@chakra-ui/react';

type InputRowProps = GridProps & { children: ReactNode; cols?: string };

const InputRow: FC<InputRowProps> = ({ children, cols, ...props }) => (
	<Grid
		gridTemplateColumns={{ base: '1fr 1fr', md: cols || '1fr 1fr' }}
		gap={2}
		{...props}>
		{children}
	</Grid>
);

export default InputRow;
