'use client';
import { useEffect, useState } from 'react';
import { Button, Flex, Input, InputGroup } from '@chakra-ui/react';
import { ImageOff, Search, Upload } from 'lucide-react';
import { useGetAllQuery } from '../..';
import MediaGrid, { MediaEmpty } from './MediaGrid';

/** The upload modal's "Library" tab: every upload of this type, newest first, searchable. */
const MyPhotos = ({
	handleSelect,
	type = 'image',
	multiple = false,
	onUpload,
}: {
	handleSelect: any;
	type?: string;
	/** Lets several images be picked before "Insert" is pressed — each
	 *  click toggles that image in/out of the selection instead of replacing
	 *  it, and `handleSelect` is called with the whole array so far. */
	multiple?: boolean;
	/** Switches the modal to its Upload tab (the empty state's button). */
	onUpload?: () => void;
}) => {
	const [page, setPage] = useState<number>(1);
	const [viewData, setViewData] = useState<any>([]);
	const [search, setSearch] = useState<string>('');
	const { data, isFetching } = useGetAllQuery({
		path: `upload`,
		limit: '24',
		search,
		type,
		page,
		sort: '-createdAt',
		filters: { type: type || 'image' },
	});
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

	useEffect(() => {
		if (isFetching || !data?.doc) return;
		setViewData((prev: any) => (page === 1 ? data.doc : [...prev, ...data.doc]));
	}, [data, isFetching, page]);

	const hasMore = page < (data?.totalPages || 0);
	const noun = type === 'video' ? 'videos' : type === 'image' ? 'images' : 'files';

	return (
		<Flex
			direction='column'
			gap={3}>
			<InputGroup startElement={<Search size={15} />}>
				<Input
					value={search}
					size='sm'
					onChange={e => {
						setSearch(e.target.value);
						setPage(1);
					}}
					placeholder={`Search ${noun}…`}
				/>
			</InputGroup>

			<MediaGrid
				items={viewData}
				type={type}
				selected={selected}
				onToggle={toggleSelect}
				loading={isFetching && page === 1 && !viewData.length}
				empty={
					search ? (
						<MediaEmpty
							icon={<ImageOff size={20} />}
							title={`No ${noun} match “${search}”`}
							hint='Try another name, or upload it.'
						/>
					) : (
						<MediaEmpty
							icon={<ImageOff size={20} />}
							title={`No ${noun} yet`}
							hint={`Upload one and it will show here, ready to use anywhere.`}
							action={
								onUpload && (
									<Button
										size='sm'
										variant='outline'
										onClick={onUpload}>
										<Upload size={14} />
										Upload
									</Button>
								)
							}
						/>
					)
				}
			/>

			{hasMore && (
				<Flex justify='center'>
					<Button
						size='sm'
						variant='ghost'
						color='fg.muted'
						loading={isFetching}
						loadingText='Loading'
						onClick={() => setPage(p => p + 1)}>
						Load more
					</Button>
				</Flex>
			)}
		</Flex>
	);
};

export default MyPhotos;
