import { FC } from 'react';
import { Button, Flex, Heading } from '@chakra-ui/react';
import { Column, Icon } from '../..';

type HeadingMenuProps = {
	editing: boolean;
	close: any;
	open: any;
	isLoading: boolean;
	title: string;
	children: any;
};

const HeadingMenu: FC<HeadingMenuProps> = ({
	editing,
	close,
	open,
	isLoading,
	title,
	children,
}) => {
	return (
		<Column>
			<Flex
				justify='space-between'
				borderBottomWidth={1}
				align='center'
				py={5}>
				<Heading size='md'>{title}</Heading>
				{editing ? (
					<Flex align='center'>
						<Button
							mr={2}
							size='xs'
							colorPalette='gray'
							onClick={close}>
							Discard
						</Button>
						<Button
							size='xs'
							loading={isLoading}
							type='submit'>
							Confirm
						</Button>
					</Flex>
				) : (
					<Button
						size='xs'
						// rightIcon={<Icon name='edit' />}
						onClick={open}>
						Edit
					</Button>
				)}
			</Flex>
			<Column
				py={8}
				gap={1}>
				{children}
			</Column>
		</Column>
	);
};

export default HeadingMenu;
