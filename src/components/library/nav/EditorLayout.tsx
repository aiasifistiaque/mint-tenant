'use client';

import { FC, useEffect, ReactNode } from 'react';
import { Flex, useMediaQuery, FlexProps, Button, IconButton } from '@chakra-ui/react';

import {
	useIsMobile,
	AuthWrapper,
	SpaceBetween,
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
	Align,
	Icon,
	EditorSidebar,
	useAppSelector,
	undo,
	redo,
	setDisplay,
} from '..';
import EditorNavbar from './EditorNavbar';
import { useUpdateContentMutation } from '../store/services/contentApi';

const PX = { base: padding.BASE, md: padding.MD, lg: padding.LG };
const navbarStyleProps = {
	px: PX,
	w: { base: 'full', md: sizes.HOME_NAV_MAX_WIDTH },
	left: { base: 0, md: sizes.HOME_NAV_LEFT },
};

export type FlexPropsType = FlexProps & {
	children?: ReactNode;
};

type LayoutProps = FlexPropsType & {
	children: ReactNode;
	title: string;
	path?: string;
	type?: 'default' | 'pos';
	hideColorMode?: boolean;
	sidebarData?: any;
	data: any;
	dataPath: string;
};

const EditorLayout: FC<LayoutProps> = ({
	children,
	title,
	data,
	path = '/dashboard',
	hideColorMode = false,
	sidebarData,
	dataPath,
	...props
}) => {
	const dispatch = useAppDispatch();
	dispatch(navigate({ selected: path }));
	const [trigger, result] = useUpdateContentMutation();

	useEffect(() => {
		dispatch(refresh());
		dispatch(setDisplay('lg'));
	}, []);

	const { history, next, display } = useAppSelector(state => state.builder);
	const [isLargerThan800] = useMediaQuery(['(min-width: 800px)']);
	const type = isLargerThan800 ? (props?.type == 'pos' ? 'pos' : 'default') : 'pos';

	const isMobile = useIsMobile();
	const showMenu = isMobile || props?.type == 'pos';
	const navbarDataProps = { doc: data, sidebarData, showMenu };

	const handleUndo = () => {
		const formData = history[history?.length - 1];
		trigger({
			body: formData,
			path: dataPath,
			type: 'all',
		});
		dispatch(undo());
	};

	const largeDisplay = () => dispatch(setDisplay('lg'));
	const smallDisplay = () => dispatch(setDisplay('sm'));

	const handleRedo = () => {
		const formData = next[next?.length - 1];
		trigger({
			body: formData,
			path: 'hongo',
			type: 'all',
		});
		dispatch(redo());
	};

	const iconContainer = {
		borderRadius: 4,
		p: '2px',
		bg: 'bg.muted',
		h: '36px',
		align: 'center',
	};

	const iconStyle = {
		borderColor: 'transparent',
		colorPalette: 'white',
		h: '32px',
		w: '44px',
		// size: 'lg',
		borderRadius: 4,
		_hover: { bg: 'bg.panel' },
		_dark: {
			bg: 'navbar.dark',
			_hover: { bg: 'bg.muted' },
		},
	};

	return (
		<AuthWrapper>
			<LayoutWrapper>
				<EditorNavbar
					{...navbarStyleProps}
					{...navbarDataProps}>
					<SpaceBetween gap={4}>
						<Flex
							gap={2}
							align='center'>
							<Button
								loading={result.isLoading}
								onClick={handleUndo}
								disabled={history?.length < 1}
								colorPalette='white'
								// leftIcon={<Icon name='undo' />}
							>
								Undo
							</Button>
							<Flex {...iconContainer}>
								<IconButton
									{...iconStyle}
									aria-label='large display'
									onClick={largeDisplay}
									bg={display == 'lg' ? 'bg.panel' : 'bg.muted'}
									borderRightRadius={0}>
									<Icon name='desktop' />
								</IconButton>
								<IconButton
									{...iconStyle}
									aria-label='small display'
									onClick={smallDisplay}
									bg={display == 'sm' ? 'bg.panel' : 'bg.muted'}
									borderLeftRadius={0}>
									<Icon name='mobile' />
								</IconButton>
							</Flex>

							{/* <Button

								isLoading={result.isLoading}
								onClick={handleRedo}
								isDisabled={next.length < 1}
								variant='white'
								rightIcon={<Icon name='redo' />}>
								Redo
							</Button> */}
						</Flex>

						<Align gap={4}>
							<ColorMode
								size='20px'
								position='navbar'
							/>
						</Align>
					</SpaceBetween>
				</EditorNavbar>
				<Body
					_light={{
						bg: 'bg.panel',
					}}>
					{type == 'default' && (
						<EditorSidebar
							h='80vh'
							doc={data}
							data={sidebarData}
						/>
					)}
					<Flex
						flexDir='column'
						w='full'
						pl={type !== 'default' ? 0 : sizes.HOME_NAV_LEFT}
						{...props}>
						<Flex
							pt={props?.type == 'pos' ? 0 : type == 'pos' ? 12 : sizes.NAV_HEIGHT}
							flex={1}
							w='full'>
							<Main>{children}</Main>
						</Flex>
					</Flex>
				</Body>
				{!hideColorMode && <ColorMode />}
			</LayoutWrapper>
		</AuthWrapper>
	);
};

const Main = ({ children }: { children: ReactNode }) => (
	<Flex {...mainProps}>
		<Column
			pl={{ base: 0, md: 0 }}
			w='full'
			gap={4}>
			{children}
		</Column>
	</Flex>
);

const mainProps: FlexProps = {
	overflowY: 'hidden',
	h: `calc(100vh - ${sizes.NAV_HEIGHT})`,
	borderTopRightRadius: { base: `0`, md: THEME == 'basic' ? 0 : 'xl' },
	bg: 'bg.panel',
	_dark: { bg: 'background.dark', borderTopRightRadius: 0 },
	pb: '32px',
	w: 'full',
};

export default EditorLayout;
