import React, { FC } from 'react';
import { Center, Button, Heading, Image, FlexProps } from '@chakra-ui/react';

type SuccessProps = FlexProps & {
	children: React.ReactNode;
	title: string;
};

const Success: FC<SuccessProps> = ({ children, title, ...props }) => {
	return (
		<Center
			w='100vw'
			flex={1}
			h='100vh'
			gap={2}
			_dark={{ bg: 'container.dark' }}
			px={4}
			flexDirection='column'>
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
			</Center>
		</Center>
	);
};

export default Success;
