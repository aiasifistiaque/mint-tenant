'use client';
import { Button, Flex, FlexProps, Tabs, Text, useDisclosure } from '@chakra-ui/react';
import { FC, useState, ReactNode } from 'react';
import { FolderOpen, ImageIcon, Images, Link2, Upload } from 'lucide-react';

import { MyFolders, MyPhotos, UploadImage, InsertUrl } from '.';
import {
	AddImageButton,
	DeleteImageButton,
	EditImageButton,
	useAppSelector,
	Dialog,
	DialogHeader,
	DialogBody,
	DialogFooter,
	DialogCloseButton,
	DiscardButton,
} from '../..';
import { styles } from '../../config';

type UploadModalProps = {
	album?: string;
	trigger?: React.ReactNode;
	handleImage: any;
	type?: 'add' | 'edit' | 'delete';
	multiple?: boolean;
	/** Lets the Library/Folders grids pick several images before inserting,
	 *  instead of inserting on the first click. On insert, `handleImage` is
	 *  called once with the whole array and a second argument of `'add-many'`
	 *  — see `VImageArray`'s "add" tile, the only current caller. Unrelated to
	 *  `multiple`, which only changes what trigger button is rendered for the
	 *  `delete` type. */
	multiSelect?: boolean;
	handleDelete?: any;
	title?: string;
	fileType?: any;
	folder?: string;
	children?: ReactNode;
};

const TABS = [
	{ value: 'library', label: 'Library', icon: <Images size={15} /> },
	{ value: 'folders', label: 'Folders', icon: <FolderOpen size={15} /> },
	{ value: 'upload', label: 'Upload', icon: <Upload size={15} /> },
	{ value: 'url', label: 'From URL', icon: <Link2 size={15} /> },
];

const NOUN: Record<string, [string, string]> = {
	image: ['image', 'images'],
	video: ['video', 'videos'],
};

/**
 * Pick media for a field: from the library, a folder, a fresh upload or a web
 * address. The shared Dialog, so it's a centred dialog on desktop and a
 * bottom sheet (swipe down to close) on phones.
 */
const UploadModal: FC<UploadModalProps> = ({
	multiple,
	multiSelect = false,
	trigger,
	handleImage,
	folder,
	title = 'Insert Photo/File',
	handleDelete,
	children,
	fileType = 'image',
	type = 'add',
}) => {
	const { open: isOpen, onOpen, onClose } = useDisclosure();
	const emptySelection = multiSelect ? [] : null;
	const [img, setImg] = useState<any>(emptySelection);
	const [tab, setTab] = useState('library');
	const { currentPath } = useAppSelector(state => state.table);

	// A selection left over from a previous open must never carry into the
	// next one — reset it both when the modal opens and after it closes.
	const resetSelection = () => setImg(emptySelection);

	const handleClose = () => {
		onClose();
		resetSelection();
	};

	const handleOpen = () => {
		resetSelection();
		setTab('library');
		onOpen();
	};

	const selectionCount = multiSelect ? (Array.isArray(img) ? img.length : 0) : img ? 1 : 0;

	const handleInsert = () => {
		if (multiSelect) {
			if (Array.isArray(img) && img.length) handleImage(img, 'add-many');
		} else {
			handleImage(img);
		}
		handleClose();
	};

	const handleUploadComplete = (e: any) => {
		// Direct upload (the "Upload" tab) always inserts immediately, even in
		// multi-select mode — picking several existing images is what the grid
		// tabs are for; a freshly uploaded file is wanted right away.
		setImg(e);
		handleImage(e);
		handleClose();
	};

	const buttonTypes = {
		add: (
			<AddImageButton
				size='200px'
				title={title || 'Add Image'}
			/>
		),
		edit: <EditImageButton />,
		delete: <DeleteImageButton onClick={handleDelete} />,
	};

	const flexCss: FlexProps = type == 'add' ? { w: 'full', h: 'full' } : {};
	const triggerButton = (buttonTypes[type] as any) || trigger;

	const [one, many] = NOUN[fileType] || ['file', 'files'];
	const kind = fileType || 'image';

	return (
		<>
			{multiple && type == 'delete' ? (
				<DeleteImageButton onClick={handleDelete} />
			) : (
				<Flex
					onClick={handleOpen}
					{...flexCss}>
					{children || triggerButton}
				</Flex>
			)}
			<Dialog
				isOpen={isOpen}
				onClose={handleClose}
				size='xl'
				forceModal>
				<DialogHeader
					divider
					icon={<ImageIcon size={17} strokeWidth={1.75} />}
					description={
						multiSelect
							? `Pick one or more ${many}, upload a new one, or paste a link.`
							: `Pick from your ${many}, upload a new one, or paste a link.`
					}>
					Insert {one}
				</DialogHeader>
				<DialogCloseButton top={{ base: 4, md: 5 }} />
				{/* The tabs pad their own content; their underline is the divider. */}
				<DialogBody
					px={0}
					pt={0}
					pb={0}
					borderTopWidth={0}>
					<Tabs.Root
						value={tab}
						onValueChange={e => setTab(e.value)}
						variant='line'
						size='sm'
						display='flex'
						flexDirection='column'
						// One height for every tab, so the dialog doesn't jump as you switch.
						h={{ base: '62dvh', md: '540px' }}
						maxH='full'>
						<Tabs.List
							px={{ base: 2, md: 4 }}
							flexShrink={0}
							overflowX='auto'
							css={{ scrollbarWidth: 'none' }}>
							{TABS.map(t => (
								<Tabs.Trigger
									key={t.value}
									value={t.value}
									gap={1.5}
									px={{ base: 2.5, md: 3 }}
									fontSize='13px'
									whiteSpace='nowrap'>
									{t.icon}
									{t.label}
								</Tabs.Trigger>
							))}
						</Tabs.List>
						{TABS.map(t => (
							<Tabs.Content
								key={t.value}
								value={t.value}
								flex={1}
								minH={0}
								overflowY='auto'
								px={{ base: 4, md: 6 }}
								py={4}>
								{t.value === 'library' && (
									<MyPhotos
										handleSelect={setImg}
										type={kind}
										multiple={multiSelect}
										onUpload={() => setTab('upload')}
									/>
								)}
								{t.value === 'folders' && (
									<MyFolders
										handleSelect={setImg}
										type={kind}
										multiple={multiSelect}
									/>
								)}
								{t.value === 'upload' && (
									<UploadImage
										fileType={kind}
										handleSelect={handleUploadComplete}
										folder={folder || currentPath}
										active={tab === 'upload'}
									/>
								)}
								{t.value === 'url' && (
									<InsertUrl
										fileType={kind}
										handleSelect={setImg}
									/>
								)}
							</Tabs.Content>
						))}
					</Tabs.Root>
				</DialogBody>

				<DialogFooter>
					<Text
						mr='auto'
						fontSize='13px'
						color='fg.muted'>
						{selectionCount ? `${selectionCount} selected` : multiSelect ? `Select ${many}` : `Select ${one === 'image' ? 'an' : 'a'} ${one}`}
					</Text>
					<DiscardButton onClick={handleClose}>Cancel</DiscardButton>
					<Button
						{...(styles.MODAL_BUTTON as any)}
						disabled={!selectionCount}
						onClick={handleInsert}>
						{multiSelect && selectionCount > 1 ? `Insert ${selectionCount} ${many}` : 'Insert'}
					</Button>
				</DialogFooter>
			</Dialog>
		</>
	);
};

export default UploadModal;
