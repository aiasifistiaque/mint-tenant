'use client';

import { FC, useState } from 'react';
import { Input, Flex, Box } from '@chakra-ui/react';
import { useColorMode } from '@/components/ui/color-mode';
import { useAppDispatch, Icon, updateSearch, SideDrawer, Sidebar, Align } from '../';

const PosSearch: FC = () => {
	const [value, setValue] = useState<string>('');
	const dispatch = useAppDispatch();
	const { colorMode } = useColorMode();

	const handleSearch = (e: any) => {
		setValue(e.target.value);
		dispatch(updateSearch(e.target.value || ''));
	};

	return (
		<Align w='100%'>
			<SideDrawer />
			<Flex
				align='center'
				w='full'>
				<Box
					bg={colorMode === 'light' ? 'bg.emphasized' : 'background.dark'}
					px={3}
					py={2}
					borderLeftRadius='lg'
					display='flex'
					alignItems='center'>
					<Icon name='barcode' />
				</Box>
				<Input
					bg={colorMode === 'light' ? 'bg.panel' : 'sidebar.dark'}
					borderLeftRadius={0}
					borderRadius='lg'
					placeholder='Search By Barcode/Product Name'
					value={value}
					onChange={handleSearch}
				/>
			</Flex>
		</Align>
	);
};

export default PosSearch;
