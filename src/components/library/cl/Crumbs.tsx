'use client';

import { FC, Fragment } from 'react';
import Link from 'next/link';
import { Box, Flex, Text } from '@chakra-ui/react';
import { ChevronRight as ChevronIcon } from 'lucide-react';

type Crumb = { href: string; title: string };

/**
 * A breadcrumb scoped to the Heroku console rather than a restyle of the shared
 * `Breadcrumbs` component, which several other pages render — changing that one
 * would quietly redesign screens nobody asked about.
 *
 * Three differences from the shared one that matter here:
 *
 * - **No `textTransform: capitalize`.** Every trail here ends in a Heroku app
 *   name, and those are lowercase identifiers. Capitalising turns `my-api` into
 *   `My-api`, which is not what the thing is called.
 * - **The last crumb is not a link.** It is the page you are already on, so it
 *   renders as plain text with `aria-current` instead of something clickable
 *   that goes nowhere.
 * - **Chevrons, not slashes**, and ancestors get a hover state so it reads as
 *   navigation rather than as a path string.
 */
const Crumbs: FC<{ data: Crumb[] }> = ({ data }) => (
	<Flex
		as='nav'
		aria-label='Breadcrumb'
		align='center'
		gap={1.5}
		flexWrap='wrap'
		minW={0}>
		{data.map((crumb, index) => {
			const isLast = index === data.length - 1;

			return (
				<Fragment key={crumb.href || index}>
					{isLast ? (
						<Text
							aria-current='page'
							fontSize='13px'
							fontWeight='500'
							color='fg'
							maxW={{ base: '160px', md: '320px' }}
							truncate
							title={crumb.title}>
							{crumb.title}
						</Text>
					) : (
						<Link href={crumb.href}>
							<Text
								fontSize='13px'
								fontWeight='400'
								color='fg.muted'
								transition='color 120ms'
								_hover={{ color: 'fg' }}
								maxW={{ base: '120px', md: '240px' }}
								truncate
								title={crumb.title}>
								{crumb.title}
							</Text>
						</Link>
					)}

					{!isLast && (
						<Box
							color='fg.subtle'
							lineHeight={0}
							flexShrink={0}
							aria-hidden>
							<ChevronIcon size={13} />
						</Box>
					)}
				</Fragment>
			);
		})}
	</Flex>
);

export default Crumbs;
