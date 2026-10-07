'use client';

import { FC, ReactNode } from 'react';
import { Flex, Text } from '@chakra-ui/react';
import Crumbs from './Crumbs';

type PageHeaderProps = {
	breadcrumbs: { href: string; title: string }[];
	title: ReactNode;
	/** A StatusDot, a maintenance pill — sits inline with the title. */
	badge?: ReactNode;
	/** One muted line: identity, scale, freshness. */
	meta?: ReactNode;
	actions?: ReactNode;
};

const PageHeader: FC<PageHeaderProps> = ({ breadcrumbs, title, badge, meta, actions }) => (
	<Flex
		direction='column'
		gap={3}>
		<Crumbs data={breadcrumbs} />

		<Flex
			align='flex-start'
			justify='space-between'
			gap={4}
			flexWrap='wrap'>
			<Flex
				direction='column'
				gap={1}
				minW={0}>
				<Flex
					align='center'
					gap={3}
					minW={0}>
					<Text
						as='h1'
						fontFamily='display'
						fontSize='24px !important'
						fontWeight='display'
						textTransform='uppercase'
						letterSpacing='-0.012em'
						lineHeight='1.2'
						truncate>
						{title}
					</Text>
					{badge}
				</Flex>
				{meta && (
					<Text
						fontSize='xs'
						color='fg.muted'>
						{meta}
					</Text>
				)}
			</Flex>

			{actions && (
				<Flex
					align='center'
					gap={2}
					flexWrap='wrap'>
					{actions}
				</Flex>
			)}
		</Flex>
	</Flex>
);

export default PageHeader;
