import { Dialog, useDisclosure, Flex, Image, Portal, CloseButton } from '@chakra-ui/react';

/**
 * A picture shown full screen on a click. Closes with the × in the corner, a
 * tap on the dark area around the picture, or Escape.
 *
 * The × is a real button inside `Dialog.CloseTrigger asChild`: an empty
 * CloseTrigger (as this had) renders nothing in Chakra v3, which left phones
 * with no way out of the viewer at all.
 */
const FullScreenImage = ({ src, children, ...props }: any) => {
	const { open: isOpen, onOpen, onClose } = useDisclosure();
	return (
		<>
			<Flex
				onClick={onOpen}
				cursor='zoom-in'
				{...props}>
				{children}
			</Flex>

			<Dialog.Root
				lazyMount
				unmountOnExit
				open={isOpen}
				onOpenChange={e => !e.open && onClose()}
				size='full'
				placement='center'>
				<Portal>
					<Dialog.Backdrop bg='blackAlpha.900' />
					<Dialog.Positioner>
						<Dialog.Content
							bg='transparent'
							boxShadow='none'
							onClick={onClose}>
							<Dialog.CloseTrigger
								asChild
								position='fixed'
								top='max(12px, env(safe-area-inset-top))'
								right='12px'
								zIndex={2}>
								<CloseButton
									size='md'
									aria-label='Close image'
									borderRadius='full'
									bg='blackAlpha.600'
									color='white'
									borderWidth='1px'
									borderColor='whiteAlpha.300'
									_hover={{ bg: 'blackAlpha.800' }}
									onClick={e => {
										e.stopPropagation();
										onClose();
									}}
								/>
							</Dialog.CloseTrigger>
							<Flex
								flex={1}
								w='full'
								h='100dvh'
								align='center'
								justify='center'
								p={{ base: 3, md: 10 }}>
								<Image
									maxW='full'
									maxH='full'
									objectFit='contain'
									borderRadius='md'
									src={src}
									alt=''
									cursor='default'
									// A tap on the picture itself keeps it open; around it closes.
									onClick={e => e.stopPropagation()}
								/>
							</Flex>
						</Dialog.Content>
					</Dialog.Positioner>
				</Portal>
			</Dialog.Root>
		</>
	);
};

export default FullScreenImage;
