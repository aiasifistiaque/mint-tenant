import { Grid, Flex, Text, Heading, GridProps } from '@chakra-ui/react';
import { sizes } from '../config';

const TabularDetail = ({
	heading,
	children,
	...props
}: GridProps & { heading: string; children: string }) => {
	return (
		<Grid
			minH='54px'
			alignItems='center'
			_first={{ borderTopRadius: sizes.RADIUS_MENU }}
			_last={{ borderBottomRadius: 'lg' }}
			px={2}
			gridTemplateColumns='1fr 1fr'
			borderWidth={1}
			h='full'
			_notLast={{ borderBottomWidth: 0 }}
			{...props}>
			<Flex
				align='center'
				px={4}
				w='full'
				h='full'
				borderRightWidth={1}
				flex={1}>
				<Heading size='sm'>{heading}</Heading>
			</Flex>

			<Flex
				w='full'
				align='center'
				px={4}
				flex={1}>
				<Text>{children}</Text>
			</Flex>
		</Grid>
	);
};

export default TabularDetail;
