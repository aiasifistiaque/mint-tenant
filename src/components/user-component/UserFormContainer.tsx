import React, { FC } from 'react';
import { Center, Button, Heading, Image, FlexProps } from '@chakra-ui/react';

type LeaveProps = FlexProps & {
	children: React.ReactNode;
	handleSubmit: any;
	isLoading: boolean;
};

const UserFormContainer: FC<LeaveProps> = ({
	children,
	handleSubmit,
	isLoading,
	title: string,
	title,
	...props
}) => {
	return (
		<Center
			w='100vw'
			flex={1}
			my={16}
			gap={2}
			_dark={{ bg: 'container.dark' }}
			px={4}
			flexDirection='column'>
			<form
				onSubmit={handleSubmit}
				style={{ width: '100%' }}>
				<Center
					bg='bg.panel'
					_dark={{ bg: 'sidebar.dark' }}
					p={{ base: 4, md: 8 }}
					flexDir='column'
					gap={3}
					w={{ base: 'full', md: '600px' }}
					mx={{ md: 'auto' }}
					boxShadow='lg'
					borderRadius='24px'>
					<Center
						pb={{ base: 16, md: 8 }}
						flexDir='column'
						gap={4}>
						<Heading>{title}</Heading>

						<Image
							h='64px'
							w='64px'
							src='/logo.png'
							alt='logo'
						/>
					</Center>
					{children}
					<Button
						mt={6}
						w='full'
						borderRadius='full'
						loading={isLoading}
						size='sm'
						type='submit'>
						Submit
					</Button>
				</Center>
			</form>
		</Center>
	);
};

export default UserFormContainer;
