import { Flex, Heading, Text } from '@chakra-ui/react';

const ColorInput = ({ value, title }: { value: string; title: string }) => (
	<Flex
		flexDir='column'
		gap={2}>
		<Heading size='sm'>{title}</Heading>
		<Flex
			align='center'
			gap={2}>
			<Flex
				border='1px solid'
				h='32px'
				w='32px'
				borderRadius='8px'
				bg={value}
			/>
			<Text fontWeight='600'>{value}</Text>
		</Flex>
	</Flex>
);

export default ColorInput;
