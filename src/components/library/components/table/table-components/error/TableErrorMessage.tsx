import { ReactNode } from 'react';
import { Flex, Text, FlexProps, Center } from '@chakra-ui/react';
import { SearchX } from 'lucide-react';

/**
 * Shown in place of rows when a query comes back empty or fails. It gets an
 * icon and a type hierarchy so an empty table reads as a deliberate state
 * rather than a table that failed to paint.
 */
const TableErrorMessage = ({
	title,
	children,
	...props
}: FlexProps & { title: string; children: ReactNode }) => {
	return (
		<Flex
			align='center'
			justify='center'
			flexDir='column'
			textAlign='center'
			gap={1}
			px={6}
			py={{ base: 12, md: 14 }}
			{...props}>
			<Center
				boxSize='40px'
				mb={3}
				borderRadius='full'
				bg='bg.muted'
				color='fg.subtle'>
				<SearchX size={20} />
			</Center>
			<Text
				fontSize='15px'
				fontWeight='600'
				color='fg'>
				{title}
			</Text>
			<Text
				fontSize='13px'
				maxW='340px'
				lineHeight='1.5'
				color='fg.muted'>
				{children}
			</Text>
		</Flex>
	);
};

export default TableErrorMessage;
