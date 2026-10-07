'use client';

import { useDisclosure, Flex, Heading, IconButton } from '@chakra-ui/react';
import { DrawerRoot, DrawerBackdrop, DrawerContent, DrawerCloseTrigger } from '@chakra-ui/react';
import Sidebar from './Sidebar';

import { EditorSidebar, Icon, useGetSelfQuery } from '../..';

const EditorSideDrawer = ({ sidebarData, doc }: { sidebarData: any; doc: any }) => {
	const { open: isOpen, onOpen, onClose } = useDisclosure();

	const { data } = useGetSelfQuery({});

	return (
		<>
			<Flex
				css={styles.container}
				onClick={onOpen}>
				<IconButton
					aria-label='menu'
					size='xs'
					variant='ghost'>
					<Icon
						name='menu'
						size={20}
					/>
				</IconButton>
				<Heading size='md'>{data?.store?.name}</Heading>
			</Flex>

			<DrawerRoot
				open={isOpen}
				placement='start'
				onOpenChange={(e: any) => (e.open ? onOpen() : onClose())}>
				<DrawerBackdrop />
				<DrawerContent>
					<DrawerCloseTrigger />
					<EditorSidebar
						doc={doc}
						data={sidebarData}
					/>
				</DrawerContent>
			</DrawerRoot>
		</>
	);
};

const styles = {
	container: {
		gap: 2,
		zIndex: 999,
		alignItems: 'center',
		h: '64px',
		px: 0,
		mr: 2,
	},
};

export default EditorSideDrawer;
