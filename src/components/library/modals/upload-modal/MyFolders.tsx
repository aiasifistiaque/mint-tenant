'use client';
import { useState } from 'react';
import { Box, Flex, Grid, Skeleton, Text } from '@chakra-ui/react';
import { ChevronRight, Folder, FolderOpen, ImageOff } from 'lucide-react';
import { useGetAllQuery, useGetQuery } from '../..';
import MediaGrid, { MediaEmpty } from './MediaGrid';

/** The upload modal's "Folders" tab: pick a folder, then pick from what's in it. */
const MyFolders = ({
	handleSelect,
	type = 'image',
	multiple = false,
}: {
	handleSelect: any;
	type?: string;
	/** See `MyPhotos`'s `multiple` — same toggle-into-an-array behaviour. */
	multiple?: boolean;
}) => {
	const { data: folders, isFetching } = useGetQuery({ path: `files/get/distinct/folder` });
	const [folder, setFolder] = useState<string>('');
	const [selected, setSelected] = useState<any>(multiple ? [] : null);

	const toggleSelect = (url: string) => {
		if (!multiple) {
			setSelected(url);
			handleSelect(url);
			return;
		}
		// Worked out here, not in a setState updater: updaters run during render,
		// and telling the modal from inside one updates it mid-render.
		const prev: string[] = Array.isArray(selected) ? selected : [];
		const next = prev.includes(url) ? prev.filter(existing => existing !== url) : [...prev, url];
		setSelected(next);
		handleSelect(next);
	};

	const { data: imageData, isFetching: imageFetching } = useGetAllQuery(
		{
			path: `upload`,
			limit: '9999',
			type,
			page: 1,
			sort: '-createdAt',
			filters: { type: type || 'image', folder },
		},
		{ skip: !folder }
	);

	const list: string[] = (Array.isArray(folders) ? folders : []).filter(Boolean);

	return (
		<Flex
			direction='column'
			gap={3}>
			{/* Where you are: all folders › this one. */}
			<Flex
				align='center'
				gap={1}
				fontSize='13px'
				minH='24px'>
				<Text
					as={folder ? 'button' : 'span'}
					fontSize='13px'
					fontWeight={folder ? '500' : '600'}
					color={folder ? 'fg.muted' : 'fg'}
					cursor={folder ? 'pointer' : 'default'}
					_hover={folder ? { color: 'fg' } : undefined}
					onClick={() => setFolder('')}>
					All folders
				</Text>
				{folder && (
					<>
						<Box color='fg.subtle'>
							<ChevronRight size={14} />
						</Box>
						<Text
							fontSize='13px'
							fontWeight='600'
							textTransform='capitalize'
							truncate>
							{folder}
						</Text>
					</>
				)}
			</Flex>

			{!folder ? (
				isFetching && !list.length ? (
					<Grid
						templateColumns='repeat(auto-fill, minmax(170px, 1fr))'
						gap={2}>
						{Array.from({ length: 6 }, (_, i) => (
							<Skeleton
								key={i}
								h='48px'
								borderRadius='lg'
							/>
						))}
					</Grid>
				) : list.length ? (
					<Grid
						templateColumns='repeat(auto-fill, minmax(170px, 1fr))'
						gap={2}>
						{list.map(name => (
							<Flex
								key={name}
								as='button'
								// @ts-ignore — Flex as button
								type='button'
								onClick={() => setFolder(name)}
								align='center'
								gap={2.5}
								h='48px'
								px={3}
								borderRadius='lg'
								borderWidth='1px'
								borderColor='border.muted'
								bg='bg.panel'
								color='fg'
								textAlign='left'
								transition='background .12s ease, border-color .12s ease'
								_hover={{ bg: 'bg.muted', borderColor: 'border' }}>
								<Box
									color='fg.muted'
									flexShrink={0}>
									<Folder size={17} />
								</Box>
								<Text
									fontSize='13px'
									fontWeight='500'
									textTransform='capitalize'
									truncate>
									{name}
								</Text>
							</Flex>
						))}
					</Grid>
				) : (
					<MediaEmpty
						icon={<FolderOpen size={20} />}
						title='No folders yet'
						hint='Uploads are grouped by the page they were added from.'
					/>
				)
			) : (
				<MediaGrid
					items={imageData?.doc || []}
					type={type}
					selected={selected}
					onToggle={toggleSelect}
					loading={imageFetching && !imageData?.doc?.length}
					empty={
						<MediaEmpty
							icon={<ImageOff size={20} />}
							title='Nothing here of this type'
							hint='Pick another folder, or upload one.'
						/>
					}
				/>
			)}
		</Flex>
	);
};

export default MyFolders;
