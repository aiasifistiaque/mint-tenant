import { FC, ReactNode } from 'react';
import { Center, Spinner, FlexProps, Flex } from '@chakra-ui/react';
import { Layout } from '../../..';

type LayoutSpinnerProps = FlexProps & {
	isLoading: boolean;
	children: ReactNode;
	path: string;
	title: string;
	isError?: boolean;
	errorMessage?: string;
	data?: any;
};

const LayoutSuspense: FC<LayoutSpinnerProps> = ({
	children,
	path,
	title,
	isLoading,
	isError,
	errorMessage,
	data,
	...props
}) => {
	if (isLoading)
		return (
			<Layout
				path={path}
				title={title}>
				<Center
					h='100vh'
					w='100%'>
					<Spinner />
				</Center>
			</Layout>
		);
	else
		return (
			<Layout
				path={path}
				title={title}>
				<Flex
					flexDir='column'
					{...props}>
					{children}
				</Flex>
			</Layout>
		);
};

export default LayoutSuspense;
