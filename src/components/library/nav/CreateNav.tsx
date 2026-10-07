'use client';
import { FC } from 'react';
import { useRouter } from 'next/navigation';

import { Button, Center, CloseButton, Separator, Flex, Heading } from '@chakra-ui/react';
import { Navbar, THEME } from '../index';
import { pagePath } from '../config/lib/constants/panel';

type CreateNavProps = {
	title: string;
	path: string;
	isLoading: boolean;
};

const CreateNav: FC<CreateNavProps> = ({ title, path, isLoading }) => {
	const router = useRouter();
	const handleBackClick = () => {
		router.replace(pagePath(path));
	};

	const headings = (
		<>
			<CloseButton
				colorPalette='brand'
				color='accent.contrast'
				onClick={handleBackClick}
			/>
			<Separator
				h={6}
				orientation='vertical'
			/>
			<Heading
				color='accent.contrast'
				size='xs'>
				{title}
			</Heading>
		</>
	);

	const buttons = (
		<>
			<Button
				onClick={handleBackClick}
				size='sm'
				loading={isLoading}
				colorPalette='gray'>
				Discard
			</Button>
			<Button
				type='submit'
				size='sm'
				loading={isLoading}>
				Save
			</Button>
		</>
	);

	return (
		<Navbar
			bg={THEME == 'basic' ? 'accent.solid' : 'navbar.light'}
			px={6}
			justify='space-between'>
			<Flex
				gap={3}
				align='center'
				flex={1}>
				{headings}
			</Flex>
			<Center
				flex={1}
				justifyContent='flex-end'
				gap={2}>
				{buttons}
			</Center>
		</Navbar>
	);
};

export default CreateNav;
