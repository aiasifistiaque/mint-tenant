import {
	Button,
	Flex,
	FlexProps,
	useDisclosure,
	Grid,
	Tooltip,
	Input,
	GridProps,
} from '@chakra-ui/react';
import { FC, useState, ReactNode } from 'react';
import { DynamicIcon } from 'lucide-react/dynamic';
import ICON_LIST from './iconNames';

import { styles, MFooter } from '.';
import { AddImageButton, DeleteImageButton, EditImageButton } from '../..';
import {
	GenericModal,
	GenericModalHeader,
	GenericModalCloseButton,
	GenericModalBody,
	GenericModalContent,
} from '../..';

type UploadModalProps = {
	album?: string;
	trigger?: React.ReactNode;
	handleImage: any;
	type?: 'add' | 'edit' | 'delete';
	multiple?: boolean;
	handleDelete?: any;
	title?: string;
	fileType?: any;
	folder?: string;
	children?: ReactNode;
};

const IconModal: FC<UploadModalProps> = ({
	multiple,
	trigger,
	handleImage,
	title = 'Insert Photo/File',
	handleDelete,
	children,
	type = 'add',
}) => {
	const { open: isOpen, onOpen, onClose } = useDisclosure();
	const [img, setImg] = useState<string | null>(null);
	const [list, setList] = useState<string[]>(ICON_LIST);

	const handleImageSelect = (iconName: string) => setImg(iconName);

	const onModalClose = () => {
		setImg(null);
		setList(ICON_LIST);
		onClose();
	};

	const handleInsert = () => {
		handleImage(img);
		onModalClose();
	};

	const onSearch = (e: any) => {
		const searchTerm = e.target.value.toLowerCase();
		// Convert search term to kebab-case format
		const kebabSearchTerm = searchTerm
			.replace(/\s+/g, '-') // Replace spaces with dashes
			.replace(/([A-Z])/g, '-$1') // Add dash before uppercase letters
			.replace(/([0-9])/g, '-$1') // Add dash before numbers
			.toLowerCase()
			.replace(/^-/, ''); // Remove leading dash

		const filteredIcons = ICON_LIST.filter(
			(icon: string) =>
				icon.toLowerCase().includes(kebabSearchTerm) || icon.toLowerCase().includes(searchTerm)
		);
		setList(filteredIcons);
	};

	const buttonTypes = {
		add: <Button variant='outline'>Choose Icon</Button>,
		edit: <Button variant='outline'>Chance Icon</Button>,
		delete: <DeleteImageButton onClick={handleDelete} />,
	};

	const flexCss: FlexProps =
		type == 'add'
			? {
					w: 'full',
					h: 'full',
			  }
			: {};

	let triggerButton = (buttonTypes[type] as any) || trigger;

	return (
		<>
			{multiple && type == 'delete' ? (
				<DeleteImageButton onClick={handleDelete} />
			) : (
				<Flex
					onClick={onOpen}
					{...flexCss}>
					{children || triggerButton}
				</Flex>
			)}
			<GenericModal
				isOpen={isOpen}
				onClose={onModalClose}
				size='full'
				isCentered>
				<GenericModalContent {...styles.modalContentCss}>
					<GenericModalHeader
						pb={2}
						pt={4}>
						Select Icon
					</GenericModalHeader>
					<GenericModalCloseButton />
					<GenericModalBody
						minH='70vh'
						px={0}>
						<Flex px={4}>
							<Input
								placeholder='Search Icons...'
								onChange={onSearch}
							/>
						</Flex>

						<Flex
							h={{ base: '50vh', md: '70vh' }}
							w='full'>
							<Grid {...gridCss}>
								{list.map((icon: string) => {
									return (
										<Tooltip.Root
											lazyMount
											key={icon}
											positioning={{ placement: 'bottom' }}
											openDelay={200}>
											<Tooltip.Trigger asChild>
												<Flex
													{...iconCss}
													bg={img === icon ? 'accent.subtle' : 'bg.panel'}
													borderColor={img === icon ? 'accent.solid' : 'transparent'}
													onClick={() => handleImageSelect(icon)}>
													<span>
														<DynamicIcon
															name={icon as any}
															size={26}
														/>
													</span>
												</Flex>
											</Tooltip.Trigger>
											<Tooltip.Positioner>
												<Tooltip.Content>{icon}</Tooltip.Content>
											</Tooltip.Positioner>
										</Tooltip.Root>
									);
								})}
							</Grid>
						</Flex>
					</GenericModalBody>

					<MFooter>
						<Button
							variant='outline'
							onClick={onModalClose}>
							Cancel
						</Button>
						<Button
							size='sm'
							disabled={!img}
							onClick={handleInsert}>
							Insert Icon
						</Button>
					</MFooter>
				</GenericModalContent>
			</GenericModal>
		</>
	);
};

const gridCss: GridProps = {
	gridTemplateColumns: { base: 'repeat(5, 1fr)', md: 'repeat(18, 1fr)' },
	gap: 3,
	p: 4,
	overflowY: 'scroll',
	maxH: '70vh',
	w: 'full',
};

const iconCss: FlexProps = {
	direction: 'column',
	align: 'center',
	justify: 'center',
	p: 2,
	border: '1px solid',
	borderColor: 'border',
	borderRadius: '6px',
	cursor: 'pointer',
	bg: 'bg.panel',
	_hover: { bg: 'bg.subtle' },

	w: '56x',
	h: '56px',
};

export default IconModal;
