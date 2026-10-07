import { Flex, FlexProps, Heading, Text } from '@chakra-ui/react';
import { FC, ReactNode } from 'react';

type HeadingSectionProps = FlexProps & {
	title?: string;
	children: ReactNode;
};

const HeadingSection: FC<HeadingSectionProps> = ({ title, children, ...props }) => {
	return (
		<Flex
			flexDir='column'
			gap={2}
			{...props}>
			<Heading size='md'>{title}</Heading>
			<Text>{children}</Text>
		</Flex>
	);
};

export default HeadingSection;
