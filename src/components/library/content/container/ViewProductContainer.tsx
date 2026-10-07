import { FC, ReactNode } from 'react';
import { Button, Flex, FlexProps, Heading } from '@chakra-ui/react';
import { Align, Column, EditContentModal } from '../..';

type ViewContentContainerType = FlexProps & {
	children: ReactNode;
	title?: string;
	dataModel: any;
	data: any;
	edit?: boolean;
	path: string;
};

const ViewProductContainer: FC<ViewContentContainerType> = ({
	title,
	children,
	dataModel,
	data,
	path,
	edit = true,
	...props
}) => {
	return (
		<Column
			gap={4}
			{...props}>
			<Align
				py={4}
				flex={1}
				justify='space-between'>
				<Heading size='lg'>{title || '--'}</Heading>
				{edit && (
					<EditContentModal
						data={data}
						path={path}
						dataModel={dataModel}>
						<Button
							colorPalette='gray'
							size='sm'>
							Edit
						</Button>
					</EditContentModal>
				)}
			</Align>
			<Column gap={6}>{children}</Column>
		</Column>
	);
};
export default ViewProductContainer;
