'use client';

import { FC, ReactNode } from 'react';
import { Box, BoxProps, Flex, Text } from '@chakra-ui/react';
import { radius } from '../index';

type PanelProps = BoxProps & {
	title?: ReactNode;
	/** Small muted text under the title. */
	subtitle?: ReactNode;
	/** Buttons, filters, a count — anything that acts on the panel's contents. */
	actions?: ReactNode;
	children: ReactNode;
	/** For a table, which brings its own row padding. */
	flush?: boolean;
};

/**
 * The one container this feature uses.
 *
 * A 1px border and no shadow: stacked shadowed cards are the single fastest way
 * to make an admin look a decade old, and a rule separates two regions just as
 * well at a fraction of the visual weight.
 */
const Panel: FC<PanelProps> = ({ title, subtitle, actions, children, flush, ...props }) => (
	<Box
		borderWidth='1px'
		borderColor='border'
		borderRadius={radius.CONTAINER}
		bg='bg.panel'
		overflow='hidden'
		{...props}>
		{(title || actions) && (
			<Flex
				align='center'
				justify='space-between'
				gap={3}
				px={4}
				py={3}
				borderBottomWidth='1px'
				borderColor='border.muted'
				flexWrap='wrap'>
				<Box minW={0}>
					{title && (
						<Text
							fontSize='sm'
							fontWeight='600'
							lineHeight='1.3'>
							{title}
						</Text>
					)}
					{subtitle && (
						<Text
							fontSize='xs'
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
		)}

		<Box p={flush ? 0 : 4}>{children}</Box>
	</Box>
);

export default Panel;
