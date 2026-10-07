'use client';

import { FC, ReactNode, useEffect } from 'react';
import { Flex, FlexProps } from '@chakra-ui/react';
import { refresh, navigate } from '..';
import { AuthWrapper, padding, useAppDispatch, ColorMode, Body, Column, LayoutWrapper } from '..';

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
};

const Layout: FC<LayoutProps> = ({
	children,
	title,
	path = '/pos',
	hideColorMode = false,
	...props
}) => {
	const dispatch = useAppDispatch();
	dispatch(navigate({ selected: path || '/pos' }));

	useEffect(() => {
		dispatch(refresh());
	}, []);

	return (
		<AuthWrapper>
			<LayoutWrapper
				maxH='100vh'
				overflow='hidden'>
				<Body overflow='hidden'>
					<Flex
						flexDir='column'
						w='full'>
						<Flex
							flex={1}
							w='full'>
							<Flex
								overflowY='hidden'
								bg='pos.light'
								_dark={{ bg: 'pos.dark' }}
								w='full'>
								<Column
									w='full'
									gap={4}>
									{children}
								</Column>
							</Flex>
						</Flex>
					</Flex>
				</Body>
				{/* {!hideColorMode && <ColorMode />} */}
			</LayoutWrapper>
		</AuthWrapper>
	);
};

export default Layout;
