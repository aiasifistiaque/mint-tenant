'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { CloseButton, Drawer, Flex, IconButton, Portal } from '@chakra-ui/react';
import { Menu } from 'lucide-react';

import { useGetSelfQuery } from '../../';
import MobileSidebar from './MobileSidebar';
import SidebarBrand from './sidebar-components/SidebarBrand';

/**
 * The navbar's menu button on phones, and the drawer it opens: a panel from
 * the left, narrower than the screen so the page stays in view and a tap
 * beside it closes it. It closes itself once a page is picked.
 */
const SideDrawer = () => {
	const [open, setOpen] = useState(false);
	const pathname = usePathname();
	const { data } = useGetSelfQuery({});

	const title = data?.organization?.name || data?.shop?.name || process.env.NEXT_PUBLIC_STORE_NAME || 'Admin';

	// A link to the page already open doesn't change the path; one that does
	// (or the back button) closes the drawer either way.
	useEffect(() => setOpen(false), [pathname]);

	return (
		<Drawer.Root
			lazyMount
			unmountOnExit
			open={open}
			placement='start'
			onOpenChange={e => setOpen(e.open)}>
			<Drawer.Trigger asChild>
				<IconButton
					aria-label='Open menu'
					variant='ghost'
					size='md'
					ml={-2}
					mr={1}
					flexShrink={0}
					color='inherit'
					css={{ WebkitTapHighlightColor: 'transparent' }}>
					<Menu
						size={22}
						strokeWidth={2}
					/>
				</IconButton>
			</Drawer.Trigger>
			<Portal>
				<Drawer.Backdrop />
				<Drawer.Positioner>
					<Drawer.Content
						w='min(86vw, 340px)'
						maxW='340px'
						h='100dvh'
						display='flex'
						flexDir='column'
						bg='sidebar.light'
						borderRightWidth='1px'
						borderColor='sidebar.borderBottom.light'
						_dark={{ bg: 'sidebar.dark', borderColor: 'sidebar.borderBottom.dark' }}
						boxShadow='xl'>
						<Flex
							align='center'
							justify='space-between'
							gap={2}
							flexShrink={0}
							h='calc(56px + env(safe-area-inset-top))'
							pt='env(safe-area-inset-top)'
							pl={5}
							pr={2}
							borderBottomWidth='1px'
							borderColor='sidebar.borderBottom.light'
							_dark={{ borderColor: 'sidebar.borderBottom.dark' }}>
							<Drawer.Title
								minW={0}
								textTransform='none'>
								<SidebarBrand title={title} />
							</Drawer.Title>
							<Drawer.CloseTrigger
								asChild
								position='static'>
								<CloseButton
									size='md'
									aria-label='Close menu'
								/>
							</Drawer.CloseTrigger>
						</Flex>
						<MobileSidebar onNavigate={() => setOpen(false)} />
					</Drawer.Content>
				</Drawer.Positioner>
			</Portal>
		</Drawer.Root>
	);
};

export default SideDrawer;
