import React, { useRef } from 'react';
import { Flex, Grid, Text, Menu } from '@chakra-ui/react';
import { useColorMode } from '@/components/ui/color-mode';
import { useGetAllQuery } from '../../../store';
import { Icon } from '../../../icon';
import Link from 'next/link';
import { TableMenu } from '../../../components/table';
import { useRouter } from 'next/navigation';

const menu = [
	{
		type: 'update-key',
		title: 'Edit Name',
		keyType: 'string',
		key: 'name',
		prompt: {
			title: 'Update Name',
			body: 'Enter the new name for this item.',
		},
	},
	{
		type: 'update-key',
		title: 'Move To Folder',
		keyType: 'data-menu',
		dataPath: 'folders',
		key: 'parent',
		path: 'folders',
	},
];

const FolderGrid = ({ path, parent }: { path: string; parent?: string }) => {
	const { data, isFetching } = useGetAllQuery({ path: path, limit: '9999', filters: { parent } });
	const menuRef = useRef(null);
	const router = useRouter();
	const { colorMode } = useColorMode();
	const handleClick = ({ id }: any) => {
		router.push(`/folders/f/${id}`);
	};
	return (
		<Grid
			mb={data?.docsInPage > 0 ? 4 : 0}
			gridTemplateColumns={{ base: '1fr 1fr', md: 'repeat(4, 1fr)' }}
			gap={2}>
			{data?.doc?.map((item: any, i: number) => (
				// <Link
				// 	key={i}
				// 	href={`/images/f/${item._id}`}>
				<Flex
					key={i}
					justify='space-between'
					borderRadius='8px'
					align='center'
					h='50px'
					border='1px solid'
					borderColor='border.light'
					bg={colorMode === 'dark' ? 'background.cardDark' : 'background.cardLight'}
					_dark={{ borderColor: 'border.dark', bg: 'container.dark' }}
					gap={0.5}>
					<Link href={`/images/f/${item._id}`}>
						<Flex
							h='full'
							pl={4}
							flex={1}
							align='center'
							gap={3}>
							<Icon
								name='folder'
								size={26}
							/>
							<Text
								fontSize={{
									base: '14px',
									md: '16px',
								}}
								fontWeight={{ base: '600', md: '600' }}>
								{item?.name}
							</Text>
						</Flex>
					</Link>

					<Flex onClick={(e: any) => e.stopPropagation()}>
						<TableMenu
							data={menu}
							doc={item}
							id={item?._id}
							path={path}>
							<Flex
								h='full'
								cursor='pointer'
								p={2}
								borderRadius='full'>
								<Icon
									name='vertical-dots'
									size={18}
								/>
							</Flex>
						</TableMenu>
					</Flex>
				</Flex>
				// </Link>
			))}
		</Grid>
	);
};

export default FolderGrid;
