import { ContainerProps, Flex } from '@chakra-ui/react';
import { FC, ReactNode } from 'react';

type FormContainerProps = any & {
	children: ReactNode;
};

const W_BASE = '100%';
const W_MD = '80%';
const W_LG = '70%';

const PADDING = 8;

const FormContainer: FC<FormContainerProps> = ({ children, ...props }) => {
	return (
		<Flex
			css={styles.container}
			{...props}>
			{children}
		</Flex>
	);
};

const styles = {
	container: {
		h: 'fit-content',
		p: PADDING,
		bg: 'bg.panel',
		_dark: { bg: 'sidebar.dark' },
		flexDirection: 'column',
		mx: 'auto',
		borderRadius: 'lg',
		w: { base: W_BASE, md: W_MD, lg: W_LG },
		borderWidth: 2,
	},
};

export default FormContainer;
