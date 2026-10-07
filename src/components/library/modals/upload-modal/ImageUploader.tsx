'use client';
import { Button, Flex, Tabs } from '@chakra-ui/react';
import { FC, useState, ReactNode } from 'react';

import InsertUrl from './InsertUrl';
import MyPhotos from './MyPhotos';
import UploadImage from './UploadImage';
import { styles } from '.';
import {
	GenericModal,
	GenericModalHeader,
	GenericModalCloseButton,
	GenericModalBody,
	GenericModalFooter,
	GenericModalContent,
} from '../..';

type UploadModalProps = {
	album?: string;
	trigger?: ReactNode;
	handleImage: any;
	type?: 'add' | 'edit' | 'delete';
	multiple?: boolean;
	handleDelete?: any;
	isOpen: boolean;
	onClose: any;
	onOpen: any;
	prompt?: {
		title?: string;
		body?: string;
		btnText?: string;
	};
};

const tabs = ['Photos', 'Upload', 'Web Address (URL)'];

const ImageUploader: FC<UploadModalProps> = ({
	album,
	multiple,
	trigger,
	handleImage,
	handleDelete,
	type = 'add',
	isOpen,
	onClose,
	onOpen,
	prompt,
}) => {
	// const {open: isOpen, onOpen, onClose } = useDisclosure();

	const [img, setImg] = useState(null);
	const handleImageSelect = (e: any) => setImg(e);

	const handleInsert = () => {
		handleImage(img);
		onClose();
	};

	const handleUploadComplete = (e: any) => {
		setImg(e);
		handleImage(e);
		onClose();
	};

	return (
		<>
			<GenericModal
				isOpen={isOpen}
				onClose={onClose}
				size='full'
				isCentered>
				<GenericModalContent {...styles.modalContentCss}>
					<GenericModalHeader>{prompt?.title || 'Insert Photo/File'}</GenericModalHeader>
					<GenericModalCloseButton />
					<GenericModalBody minH='70vh'>
						<Tabs.Root {...styles.tabsCss}>
							<Tabs.List>
								{tabs.map((label: string, i: number) => (
									<Tabs.Trigger
										key={i}
										value={String(i)}>
										{label}
									</Tabs.Trigger>
								))}
							</Tabs.List>
							<Tabs.Content value='0'>
								<MyPhotos handleSelect={handleImageSelect} />
							</Tabs.Content>
							<Tabs.Content value='1'>
								<UploadImage handleSelect={handleUploadComplete} />
							</Tabs.Content>
							<Tabs.Content value='2'>
								<InsertUrl handleSelect={handleImageSelect} />
							</Tabs.Content>
						</Tabs.Root>
					</GenericModalBody>

					<GenericModalFooter>
						<Flex
							gap={2}
							flex={1}>
							<Button
								size='sm'
								disabled={!img}
								onClick={handleInsert}>
								{prompt?.btnText || 'Insert'}
							</Button>
							<Button
								{...styles.cancelBtnCss}
								onClick={onClose}>
								Cancel
							</Button>
						</Flex>
					</GenericModalFooter>
				</GenericModalContent>
			</GenericModal>
		</>
	);
};

export default ImageUploader;
