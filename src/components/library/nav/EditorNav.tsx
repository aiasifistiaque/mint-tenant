'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

import { Button, Center, CloseButton, Separator, Flex, Heading } from '@chakra-ui/react';
import { DecisionAlert, Navbar, THEME, useIsMobile } from '../index';
import { pagePath } from '../config/lib/constants/panel';

type CreateNavProps = {
	title: string;
	path: string;
	isLoading: boolean;
	isDisabled?: boolean;
};

const EditorNav: React.FC<CreateNavProps> = ({ title, path, isDisabled, isLoading }) => {
	const router = useRouter();
	const handleBackClick = () => router.replace(pagePath(path));
	const isMobile = useIsMobile();
	const truncate = (str: string, n: number) => (str.length > n ? str.slice(0, n) + '...' : str);

	const headings = (
		<>
			<DecisionAlert
				handler={handleBackClick}
				prompt={{
					title: 'Exit?',
					body: 'Are you sure you want to exit? you may have unsaved changes!',
					btnText: 'Exit',
				}}>
				<CloseButton
					colorPalette='brand'
					color='accent.contrast'
				/>
			</DecisionAlert>

			<Separator
				h={6}
				orientation='vertical'
			/>
			<Heading
				fontWeight='400'
				color='accent.contrast'
				size='sm'>
				{truncate(title, isMobile ? 25 : 100)}
			</Heading>
		</>
	);

	const buttons = (
		<>
			<Button
				disabled={isDisabled}
				type='submit'
				size={{ base: 'sm', md: 'sm' }}
				colorPalette='gray'
				spinnerPlacement='start'
				loadingText='Saving...'
				loading={isLoading}>
				Save
			</Button>
		</>
	);

	return (
		<Navbar
			bg={THEME == 'basic' ? 'accent.solid' : 'navbar.light'}
			px={4}
			gap={2}
			justify='space-between'>
			<Flex
				gap={2}
				align='center'
				flex={1}>
				{headings}
			</Flex>
			<Center
				justifyContent='flex-end'
				gap={2}>
				{buttons}
			</Center>
		</Navbar>
	);
};

export default EditorNav;
