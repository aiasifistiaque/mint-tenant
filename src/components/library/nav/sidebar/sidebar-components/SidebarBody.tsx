'use client';
import { FC, ReactNode, useLayoutEffect, useRef } from 'react';
import { Flex, FlexProps } from '@chakra-ui/react';
import { padding, sizes } from '../../..';

type SidebarBodyProps = FlexProps & {
	children: ReactNode;
};

/**
 * Where the list was scrolled to. Every page renders its own Layout, so the
 * sidebar remounts on each navigation and would jump back to the top; this
 * lives outside the component so it survives that remount (and a reload
 * doesn't need it, so no storage).
 */
let savedScrollTop = 0;

const SidebarBody: FC<SidebarBodyProps> = ({ children, ...props }) => {
	const ref = useRef<HTMLDivElement>(null);

	// Before paint, so the list never flashes at the top first.
	useLayoutEffect(() => {
		if (ref.current) ref.current.scrollTop = savedScrollTop;
	}, []);

	return (
		<Flex
			ref={ref}
			onScroll={e => {
				savedScrollTop = e.currentTarget.scrollTop;
			}}
			flexDir='column'
			pr={sizes.SIDEBAR_PX}
			pb={{ base: 28, md: 8 }}
			pt={padding.BODY_TOP}
			h='100vh'
			overflowY='scroll'
			zIndex={9999}
			gap={{ base: 0, md: 0.4 }}
			{...props}>
			{children}
		</Flex>
	);
};

export default SidebarBody;
