'use client';

import { FC, ReactNode } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';

/**
 * A heading row over a grid of cards, straight on the page. Cards already
 * carry their own border, so wrapping them in a Panel stacks two look-alike
 * boxes — no hierarchy on desktop, a box inside a box on a phone.
 */
const CardSection: FC<{ title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; children: ReactNode }> = ({ title, subtitle, actions, children }) => (
	<Box as='section'>
		<Flex
			align={{ base: 'flex-start', sm: 'flex-end' }}
			justify='space-between'
			gap={3}
			mb={3}
			flexWrap='wrap'>
			<Box minW={0}>
				<Text
					as='h2'
					fontSize='16px'
					fontWeight='600'
					lineHeight='1.3'>
					{title}
				</Text>
				{subtitle && (
					<Text
						fontSize='13px'
						color='fg.muted'
						mt={0.5}>
						{subtitle}
					</Text>
				)}
			</Box>
			{actions && (
				<Flex
					align='center'
					gap={2}
					flexWrap='wrap'>
					{actions}
				</Flex>
			)}
		</Flex>
		{children}
	</Box>
);

export default CardSection;
