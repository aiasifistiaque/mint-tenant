import { FC, ReactNode } from 'react';
import { Button, Flex, FlexProps, Heading } from '@chakra-ui/react';
import { EditContentModal } from '../..';

type ViewContentContainerType = FlexProps & {
	children: ReactNode;
	title?: string;
	dataModel: any;
	data: any;
	edit?: boolean;
	path?: string;
	type?: 'basic' | 'content';
};

const ViewContentContainer: FC<ViewContentContainerType> = ({
	title,
	children,
	dataModel,
	data,
	edit = true,
	path,
	type = 'content',
	...props
}) => {
	return (
		<Container>
			<Header title={title}>
				{edit && (
					<EditContentModal
						path={path}
						data={data}
						contentType={type}
						dataModel={dataModel}>
						<Button
							colorPalette='gray'
							size='sm'>
							Edit
						</Button>
					</EditContentModal>
				)}
			</Header>
			<Body {...props}>{children}</Body>
		</Container>
	);
};

const Container = ({ children }: { children: ReactNode }) => (
	<Flex
		flexDir='column'
		border='1px dashed'
		borderRadius='12px'>
		{children}
	</Flex>
);

const Header = ({ title, children }: { title?: string; children: ReactNode }) => (
	<Flex
		align='center'
		justify='space-between'
		p={6}
		py={2}
		flex={1}
		borderBottom='1px dashed'>
		<Heading size='sm'>{title || '--'}</Heading>
		{children}
	</Flex>
);

const Body = ({ children, ...props }: FlexProps & { children: ReactNode }) => (
	<Flex
		flexDir='column'
		gap={4}
		p={6}
		py={4}
		{...props}>
		{children}
	</Flex>
);

export default ViewContentContainer;
