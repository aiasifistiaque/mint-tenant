import { FC, ReactNode } from 'react';
import { Center, Button, Heading, Image, FlexProps } from '@chakra-ui/react';

type AuthFormProps = FlexProps & {
	children: ReactNode;
	handleSubmit: any;
	isLoading: boolean;
};

const AuthForm: FC<AuthFormProps> = ({
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
			h='100vh'
			gap={2}
			bg='sidebar.light'
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
					w={{ base: 'full', md: '400px' }}
					mx={{ md: 'auto' }}
					boxShadow='lg'
					borderRadius='24px'
					h={{ base: '80vh', md: '70vh' }}>
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

export default AuthForm;
