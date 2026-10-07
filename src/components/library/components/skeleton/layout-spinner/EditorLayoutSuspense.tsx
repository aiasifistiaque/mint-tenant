import { FC, ReactNode } from 'react';
import { Center, Spinner, FlexProps, Flex } from '@chakra-ui/react';
import { EditorLayout, EditorLayoutFetching as Layout, useAppSelector } from '../../..';

type LayoutSpinnerProps = FlexProps & {
	isLoading: boolean;
	children: ReactNode;
	path: string;
	title: string;
	isError?: boolean;
	errorMessage?: string;
	data?: any;
	sidebarData?: any;
	dataPath?: string;
};

const EditorLayoutSuspense: FC<LayoutSpinnerProps> = ({
	children,
	path,
	title,
	isLoading,
	isError,
	errorMessage,
	data,
	sidebarData,
	dataPath = 'hongo',
	...props
}) => {
	const { display } = useAppSelector(state => state.builder);
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
			<EditorLayout
				dataPath={dataPath}
				sidebarData={sidebarData}
				path={path}
				data={data}
				title={title}>
				<Flex
					mx='auto'
					maxW={display == 'lg' ? '100%' : '400px'}
					{...(display == 'sm' && { boxShadow: '0 10px 20px rgba(0,0,0,.3)' })}
					flexDir='column'
					{...props}>
					{children}
				</Flex>
			</EditorLayout>
		);
};

export default EditorLayoutSuspense;
