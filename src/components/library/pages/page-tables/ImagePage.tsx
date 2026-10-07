'use client';

import React, { FC, useEffect, useRef, useState } from 'react';

// Direct imports instead of barrel export
import { useAppDispatch, useAppSelector } from '../../hooks';
import { Layout } from '../../nav';
import Toast from '../../components/toast/Toast';

import {
	useGetAllQuery,
	useGetConfigQuery,
	useGetRouteQuery,
	selectAll,
	setFields,
} from '../../store';
import { Column } from '../../containers';
import ServerPageHeading from '../../components/table/ServerPageHeading';
import ImageGridData from './components/ImageGridData';
import { CloseButton, Flex, Text } from '@chakra-ui/react';
import {
	FilterContainer,
	ImagePageHeading,
	ResultContainer,
	SelectedItemsContainer,
	SelectedMenu,
	TableErrorMessage,
	TableRefresh,
	TableSearch,
	TableSearchContainer,
	TableSettingsMenuContainer,
	TableSort,
} from '../../components/table';
import DynamicFilters from '../../dynamic-filters/DynamicFilters';
import FolderGrid from './components/FolderGrid';
import { MediaUploadModal } from '../../modals/upload-modal';
import { useDisclosure } from '@chakra-ui/react';

type TableProps = {
	route: string;
	title?: string;
	folder?: string;
};

const menu = [
	{
		title: 'Move To Folder',
		type: 'edit-data-select',
		dataPath: 'folders',
		key: 'fileFolder',
		prompt: {
			title: 'Move to Folder',
			body: 'Select a folder to move the selected items to.',
		},
	},
];

// Define the PageTable component
const ImagePage: FC<TableProps> = ({ route, title, folder }) => {
	const path = route;
	const { page, limit, search, sort, filters, selectedItems }: any = useAppSelector(
		(state: any) => state.table
	);

	const [schema, setSchema] = useState<any>(null);
	const { data: table, isFetching: routeLoading } = useGetRouteQuery(route);
	const { data: schemaData, isFetching: schemaLoading } = useGetConfigQuery(route);

	const dispatch = useAppDispatch();

	useEffect(() => {
		if (schemaData) {
			const tableFields = schemaData?.table;
			setSchema(tableFields);
			const defaultFields = tableFields
				? tableFields?.filter((item: any) => item.type !== 'menu').map((item: any) => item?.dataKey)
				: [];
			dispatch(setFields(defaultFields));
		}
	}, [schemaData, schemaLoading]);

	const tableFilters = table?.filters !== undefined ? table?.filters : true;
	const onUnselect = () => dispatch(selectAll({ ids: [], isSelected: false }));

	// Page-level drag-to-upload. dragCounter survives nested enter/leave flicker
	// across child elements (a plain boolean flag would flash off on every
	// child boundary crossed while dragging over the grid).
	const dragCounter = useRef(0);
	const [dragActive, setDragActive] = useState(false);
	const [dropFiles, setDropFiles] = useState<File[] | null>(null);
	const { open: isDropModalOpen, onOpen: onDropModalOpen, onClose: onDropModalClose } =
		useDisclosure();

	const hasFiles = (e: React.DragEvent) => Array.from(e.dataTransfer.types).includes('Files');

	const onDragEnter = (e: React.DragEvent) => {
		e.preventDefault();
		if (!hasFiles(e)) return;
		dragCounter.current += 1;
		setDragActive(true);
	};
	const onDragOver = (e: React.DragEvent) => {
		if (hasFiles(e)) e.preventDefault();
	};
	const onDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		dragCounter.current = Math.max(0, dragCounter.current - 1);
		if (dragCounter.current === 0) setDragActive(false);
	};
	const onDrop = (e: React.DragEvent) => {
		e.preventDefault();
		dragCounter.current = 0;
		setDragActive(false);
		const dropped = e.dataTransfer.files;
		if (!dropped?.length) return;
		setDropFiles(Array.from(dropped));
		onDropModalOpen();
	};
	// Get the table state from the redux store
	const { data, isLoading, isError, error, isSuccess, isUninitialized } = useGetAllQuery(
		{
			page,
			limit: table?.limit || limit,
			search,
			sort,
			filters:
				table?.preFilters ??
				(tableFilters
					? {
							...(folder ? { fileFolder: folder } : {}),
							...filters,
					  }
					: null),
			path: route,
		},
		{ skip: !table }
	);

	// Return the layout, page heading, table, and toast components
	return (
		<>
			<Layout
				pb='32px'
				showFooter={false}
				title={title || table?.title}
				path={route}>
				<Column
					gap={2}
					position='relative'
					onDragEnter={onDragEnter}
					onDragOver={onDragOver}
					onDragLeave={onDragLeave}
					onDrop={onDrop}>
					{dragActive && (
						<Flex
							position='absolute'
							inset={0}
							zIndex={10}
							align='center'
							justify='center'
							borderRadius='md'
							border='2px dashed'
							borderColor='accent.solid'
							backgroundColor='accent.subtle'
							pointerEvents='none'>
							<Text fontSize='lg'>Drop images to upload</Text>
						</Flex>
					)}
					<ImagePageHeading
						folder={folder}
						isLoading={!table}
						data={schemaData?.form}
						table={table}
						title={title || table?.title} //Heading of the page
						button={table?.button?.title} //Button Title
						href={table?.button?.path} //Page where button would redirect to
						isModal={table?.button?.isModal || table?.isModal} //If create page should be modal
						path={table?.path} //Path of the table
						export={table?.export} //If export button should be displayed
					/>
					{selectedItems?.length > 0 ? (
						<SelectedItemsContainer>
							<Flex
								align='center'
								gap={2}>
								<CloseButton
									size='md'
									borderRadius='full'
									onClick={onUnselect}
								/>
								<Text>{selectedItems?.length} Items Selected</Text>
							</Flex>

							<SelectedMenu
								items={selectedItems}
								hide={false}
								path={path}
								data={menu}
							/>
						</SelectedItemsContainer>
					) : (
						<TableSettingsMenuContainer>
							<FilterContainer>
								<DynamicFilters path={path} />
							</FilterContainer>

							<TableSearchContainer>
								<TableSort
									show={true}
									tableData={schema}
								/>

								<TableSearch />
								<TableRefresh />
							</TableSearchContainer>
						</TableSettingsMenuContainer>
					)}

					<FolderGrid
						parent={folder}
						path='folders'
					/>

					<ImageGridData
						// isLoading={true}
						isLoading={isLoading || isUninitialized}
						data={data?.doc}
					/>

					{data?.docsInPage == 0 && (
						<TableErrorMessage title='No results found.'>
							There {`aren't`} any results for that query. Try using different filters.
						</TableErrorMessage>
					)}
				</Column>
				<ResultContainer data={data} />
			</Layout>

			<MediaUploadModal
				isOpen={isDropModalOpen}
				onClose={() => {
					setDropFiles(null);
					onDropModalClose();
				}}
				initialFiles={dropFiles}
				folder={folder}
			/>

			{/* Toast component to display error */}
			<Toast
				error={error}
				isError={isError}
			/>
		</>
	);
};

export default ImagePage;
