import { Flex, Input, Text, InputProps } from '@chakra-ui/react';

type EditablePriceItemProps = InputProps & {
	title: string;
};

const EditablePriceItem = ({ title, ...props }: EditablePriceItemProps) => {
	return (
		<Flex
			justify='space-between'
			gap={2}>
			<Text
				fontSize='.8rem'
				fontWeight='600'>
				{title}
			</Text>
			<Input
				w='54px'
				size='xs'
				borderRadius='md'
				type='number'
				bg='bg.panel'
				_dark={{
					bg: 'background.dark',
				}}
				{...props}
			/>
		</Flex>
	);
};

export default EditablePriceItem;
