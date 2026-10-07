'use client';

import { FC, useEffect, ReactNode } from 'react';
import { Flex, useMediaQuery, FlexProps } from '@chakra-ui/react';

import {
	useIsMobile,
	AuthWrapper,
	padding,
	sizes,
	useAppDispatch,
	ColorMode,
	Body,
	Column,
	LayoutWrapper,
	THEME,
	refresh,
	navigate,
} from '..';

const PX = { base: padding.BASE, md: padding.MD, lg: padding.LG };

export type FlexPropsType = FlexProps & {
	children?: ReactNode;
};

type LayoutProps = FlexPropsType & {
	children: ReactNode;
	title: string;
	path?: string;
	type?: 'default' | 'pos';
	hideColorMode?: boolean;
	isLoading?: boolean;
};

const Layout: FC<LayoutProps> = ({
	children,
	title,
	path = '/dashboard',
	hideColorMode = false,
	isLoading,
	...props
}) => {
	const dispatch = useAppDispatch();
	dispatch(navigate({ selected: path }));

	useEffect(() => {
		dispatch(refresh());
	}, []);

	const [isLargerThan800] = useMediaQuery(['(min-width: 800px)']);

	const type = isLargerThan800 ? (props?.type == 'pos' ? 'pos' : 'default') : 'pos';

	const isMobile = useIsMobile();
	const showMenu = isMobile || props?.type == 'pos';

	return (
		<AuthWrapper>
			<LayoutWrapper>
				{/* <Navbar
					showMenu={showMenu}
					px={PX}
					w={showMenu ? 'full' : sizes.HOME_NAV_MAX_WIDTH}
					left={showMenu ? 0 : sizes.HOME_NAV_LEFT}>
					<SpaceBetween>
						<Heading
							color={THEME == 'basic' ? 'inherit' : 'white'}
							size='md'
							fontFamily='inherit'
							fontSize='12px'
							fontWeight='300'
							letterSpacing='0.16em'
							textTransform='uppercase'>
							{title}
						</Heading>
					</SpaceBetween>
					<Align gap={4}>
						<ColorMode
							size='20px'
							position='navbar'
						/>
						<SelfMenu />
						<CreateMenu />
					</Align>
				</Navbar> */}
				<Body>
					{/* {type == 'default' && <Sidebar />} */}
					<Flex
						flexDir='column'
						w='full'
						// pl={type !== 'default' ? 0 : sizes.HOME_NAV_LEFT}
						{...props}>
						<Flex
							pt={props?.type == 'pos' ? 0 : type == 'pos' ? 12 : sizes.NAV_HEIGHT}
							flex={1}
							w='full'>
							<Main>{!isLoading && children}</Main>
						</Flex>
					</Flex>
				</Body>
				{!hideColorMode && <ColorMode />}
			</LayoutWrapper>
		</AuthWrapper>
	);
};

const Main = ({ children }: { children: ReactNode }) => (
	<Flex
		overflowY='hidden'
		h={`calc(100vh - ${sizes.NAV_HEIGHT})`}
		borderTopRightRadius={{ base: `0`, md: THEME == 'basic' ? 0 : 'xl' }}
		bg={{ base: 'background.light', md: 'background.light' }}
		_dark={{ bg: 'background.dark', borderTopRightRadius: 0 }}
		px={PX}
		pt={{ base: 4, md: 1 }}
		pb='32px'
		w='full'>
		<Column
			pl={{ base: 0, md: 0 }}
			w='full'
			gap={4}>
			{children}
		</Column>
	</Flex>
);

export default Layout;
