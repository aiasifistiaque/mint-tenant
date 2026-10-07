'use client';
import { ReactNode } from 'react';
import { useDisclosure, Drawer, Portal } from '@chakra-ui/react';
import { useColorMode } from '@/components/ui/color-mode';
import { IconButton } from '..';

const CartDrawer = ({ footer, cart }: { footer: ReactNode; cart: ReactNode }) => {
	const { open: isOpen, onOpen, onClose } = useDisclosure();
	const { colorMode } = useColorMode();

	return (
		<>
			<IconButton
				w='44px'
				h='44px'
				aria-label='Open Cart'
				iconName='cart'
				onClick={onOpen}>
				Open
			</IconButton>
			<Drawer.Root
				lazyMount
				unmountOnExit
				open={isOpen}
				placement='end'
				onOpenChange={e => (e.open ? onOpen() : onClose())}>
				<Portal>
					<Drawer.Backdrop />
					<Drawer.Positioner>
						<Drawer.Content bg={colorMode === 'dark' ? 'sidebar.dark' : 'sidebar.light'}>
							<Drawer.Header h='52px'>
								<Drawer.Title>Cart</Drawer.Title>
								<Drawer.CloseTrigger />
							</Drawer.Header>
							<Drawer.Body p={0}>{cart}</Drawer.Body>
							<Drawer.Footer
								h='52px'
								p={0}>
								{footer}
							</Drawer.Footer>
						</Drawer.Content>
					</Drawer.Positioner>
				</Portal>
			</Drawer.Root>
		</>
	);
};

export default CartDrawer;
