'use client';

import {
	Toaster as ChakraToaster,
	Portal,
	Spinner,
	Stack,
	Toast,
	createToaster,
} from '@chakra-ui/react';

export const toaster = createToaster({
	placement: 'bottom-end',
	pauseOnPageIdle: true,
});

export const Toaster = () => {
	return (
		<Portal>
			<ChakraToaster
				toaster={toaster}
				insetInline={{ mdDown: '4' }}>
				{toast => (
					<Toast.Root
						width={{ md: 'sm' }}
						borderRadius={10}
						boxShadow='lg'
						ps={4}
						pe={9}
						py={3.5}
						gap={3}>
						{toast.type === 'loading' ? (
							<Spinner
								size='sm'
								color='blue.solid'
								mt='1px'
							/>
						) : (
							<Toast.Indicator mt='1px' />
						)}
						<Stack
							gap='1'
							flex='1'
							maxWidth='100%'>
							{toast.title && (
								<Toast.Title
									fontWeight='600'
									fontSize='.9rem'>
									{toast.title}
								</Toast.Title>
							)}
							{toast.description && (
								<Toast.Description fontSize='.8rem'>{toast.description}</Toast.Description>
							)}
						</Stack>
						{toast.action && <Toast.ActionTrigger>{toast.action.label}</Toast.ActionTrigger>}
						<Toast.CloseTrigger
							top={2}
							insetEnd={2}
							borderRadius='full'
						/>
					</Toast.Root>
				)}
			</ChakraToaster>
		</Portal>
	);
};
