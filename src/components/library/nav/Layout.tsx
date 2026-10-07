'use client';

import { FC, memo, useEffect, ReactNode } from 'react';
import { Flex, Heading, useMediaQuery, FlexProps, HeadingProps } from '@chakra-ui/react';

import { SelfMenu, SearchMenu, NotificationMenu } from '../menu';
import { AuthWrapper } from '../wrappers';
import ColorMode from '../components/color-mode/ColorMode';
import { LayoutWrapper, Navbar, Sidebar, Body, MainBody } from '../nav';
import { Align, SpaceBetween } from '../containers';
import { useIsMobile, useAppDispatch } from '../hooks';
import { unselectAll, useGetQuery, navigate } from '../store';
import { padding, sizes } from '../config';
import Footer from './Footer';
import { IS_TENANT_PANEL } from '../config/lib/constants/panel';
import WorkspaceSwitcher from '../tenant/WorkspaceSwitcher';
import { CAPS } from '@/theme/tones';

const PX = { base: padding.BASE, md: padding.MD, lg: padding.LG };
const ICON_SIZE = 17;

/*
 * Every page renders inside Layout and keeps its own state above it, so each
 * change on a page (a keystroke in the route builder, a toggle) re-rendered
 * the whole sidebar and the navbar menus with it. Memoized, they re-render
 * only on their own state — the sidebar data, the signed-in admin.
 */
const MemoSidebar = memo(Sidebar);

const NavActions = memo(function NavActions({ sidebarData }: { sidebarData: any }) {
	return (
		<Align gap={1}>
			{/* Dark mode is a switch in the account menu (SelfMenu), under Themes. */}
			{/* <ColorMode
				size={ICON_SIZE}
				position='navbar'
			/> */}
			{/* The tenant panel: which project/organization, and switching. */}
			{IS_TENANT_PANEL && <WorkspaceSwitcher />}
			{sidebarData && (
				<SearchMenu
					sidebarData={sidebarData}
					iconSize={ICON_SIZE}
				/>
			)}
			{/* Notifications come from per-record access, which tenant projects don't have yet. */}
			<NotificationMenu iconSize={ICON_SIZE} />
			<SelfMenu iconSize={ICON_SIZE} />
			{/* <CreateMenu /> */}
		</Align>
	);
});

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
	/** The site footer under the page. Table pages turn it off: they page and scroll on their own. */
	showFooter?: boolean;
	/** The page fills the window under the navbar with no padding (and no footer) — full-screen tools. */
	fullBleed?: boolean;
};

const Layout: FC<LayoutProps> = ({
	children,
	title,
	path = '/dashboard',
	hideColorMode = false,
	isLoading,
	showFooter: footer = true,
	fullBleed = false,
	...props
}) => {
	const showFooter = footer && !fullBleed;
	const dispatch = useAppDispatch();

	useEffect(() => {
		dispatch(navigate({ selected: path }));
		// Not `refresh()` — that reset page/search/sort/filters back to
		// defaults on every single page mount, which was clobbering the
		// table's own URL-driven state (see useTableUrlSync) a moment after
		// it hydrated. Row selection is still page-local and stale from a
		// previous table, so that part still gets cleared.
		dispatch(unselectAll());
	}, []);

	// Chakra UI v3: useMediaQuery expects an array and returns an array of booleans
	const [isLargerThan800] = useMediaQuery(['(min-width: 800px)']);

	const type = isLargerThan800 ? (props?.type == 'pos' ? 'pos' : 'default') : 'pos';
	const isMobile = useIsMobile();
	const showMenu = isMobile || props?.type == 'pos';

	const sidebarType = process.env.NEXT_PUBLIC_SIDEBAR_TYPE || 'generic';

	const { data, isFetching, isError } = useGetQuery({ path: `/sidebar/crm/${sidebarType}` });

	return (
		<AuthWrapper>
			<LayoutWrapper>
				<Navbar
					showMenu={showMenu}
					px={PX}
					w={showMenu ? 'full' : sizes.HOME_NAV_MAX_WIDTH}
					left={showMenu ? 0 : sizes.HOME_NAV_LEFT}>
					<SpaceBetween>
						<Heading {...titleCss}>{title}</Heading>
					</SpaceBetween>
					<NavActions sidebarData={data} />
				</Navbar>
				<Body>
					{type == 'default' && <MemoSidebar />}
					<Flex
						{...mainContainer}
						pl={type !== 'default' ? 0 : sizes.HOME_NAV_LEFT}
						// With a footer: at least a screen tall, the body taking the
						// spare room, so a short or loading page keeps the footer at
						// the bottom of the window rather than below the fold.
						{...(showFooter && { minH: '100vh' })}
						{...props}>
						<MainBody
							grow={showFooter}
							bare={fullBleed}>
							{!isLoading && children}
						</MainBody>
						{showFooter && <Footer />}
					</Flex>
				</Body>
				{!hideColorMode && <ColorMode size={ICON_SIZE} />}
			</LayoutWrapper>
		</AuthWrapper>
	);
};

// The page's name in the navbar: the website's header caps.
const titleCss: HeadingProps = {
	as: 'p',
	color: 'inherit',
	_dark: {
		color: 'inherit',
	},
	...CAPS,
	fontSize: '12px',
};

const mainContainer: FlexProps = {
	bg: 'background.light',
	_dark: { bg: 'background.dark' },
	flexDir: 'column',
	w: 'full',
	pt: sizes.NAV_HEIGHT,
};

export default Layout;
