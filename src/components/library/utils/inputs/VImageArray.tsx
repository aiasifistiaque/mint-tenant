import { FC, useState, useRef } from 'react';

import {
	Center,
	Image,
	Stack,
	InputProps,
	GridProps,
	FlexProps,
	ImageProps,
	Wrap,
	Box,
} from '@chakra-ui/react';

import { UploadModal, HelperText, Label, ImageContainer, FormControl } from '../..';

type FormDataType = InputProps &
	GridProps & {
		value: string[] | undefined;
		onChange: any;
		isRequired?: boolean;
		label?: string;
		helper?: string;
		isDisabled?: boolean;
		limit?: number;
		folder?: string;
	};

const VImageArray: FC<FormDataType> = ({
	value,
	onChange,
	isRequired = false,
	label,
	helper,
	isDisabled = false,
	folder,
	limit = 999,
}) => {
	const type = value ? 'edit' : 'add';
	const length = value?.length || 0;

	// Drag and drop state
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
	const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
	const dragRef = useRef<HTMLDivElement>(null);

	// Handle drag start
	const handleDragStart = (e: React.DragEvent, index: number) => {
		setDraggedIndex(index);
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/html', (e.currentTarget as HTMLElement).outerHTML);
		(e.currentTarget as HTMLElement).style.opacity = '0.5';
	};

	// Handle drag over
	const handleDragOver = (e: React.DragEvent, index: number) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
		setDragOverIndex(index);
	};

	// Handle drag end
	const handleDragEnd = (e: React.DragEvent) => {
		(e.currentTarget as HTMLElement).style.opacity = '1';
		setDraggedIndex(null);
		setDragOverIndex(null);
	};

	// Handle drop
	const handleDrop = (e: React.DragEvent, dropIndex: number) => {
		e.preventDefault();

		if (draggedIndex === null || !value) return;

		// Don't do anything if dropped on same position
		if (draggedIndex === dropIndex) return;

		// Create new array with reordered items
		const newArray = [...value];
		const draggedItem = newArray[draggedIndex];

		// Remove the dragged item
		newArray.splice(draggedIndex, 1);

		// Insert at new position
		newArray.splice(dropIndex, 0, draggedItem);

		// Update the array through onChange
		onChange(newArray, 'reorder');

		setDraggedIndex(null);
		setDragOverIndex(null);
	};

	// Handle drag leave
	const handleDragLeave = () => {
		setDragOverIndex(null);
	};

	return (
		<FormControl isRequired={isRequired}>
			<Stack w='full'>
				<Label>{label}</Label>
				<Wrap gap={2}>
					{value?.map((image: string, i: number) => (
						<Box
							key={i}
							draggable={!isDisabled}
							onDragStart={e => handleDragStart(e, i)}
							onDragOver={e => handleDragOver(e, i)}
							onDragEnd={handleDragEnd}
							onDrop={e => handleDrop(e, i)}
							onDragLeave={handleDragLeave}
							cursor={isDisabled ? 'default' : 'grab'}
							_active={{ cursor: isDisabled ? 'default' : 'grabbing' }}
							transform={draggedIndex === i ? 'scale(0.95)' : 'scale(1)'}
							transition='all 0.2s ease'
							position='relative'
							outline={dragOverIndex === i && draggedIndex !== i ? '2px dashed' : 'none'}
							outlineColor='blue.400'
							outlineOffset='2px'>
							<Center
								{...containerCSS}
								bg={dragOverIndex === i && draggedIndex !== i ? 'blue.50' : 'transparent'}
								borderRadius='md'
								position='relative'>
								<UploadModal
									folder={folder}
									type='delete'
									handleImage={onChange}
									handleDelete={() => onChange(image, 'delete')}
									multiple={true}
								/>
								<ImageContainer>
									<Image
										{...imageCss}
										src={image}
										pointerEvents='none' // Prevent image from interfering with drag
									/>
								</ImageContainer>

								{/* Drag indicator */}
								{!isDisabled && (
									<Box
										position='absolute'
										top='2'
										left='2'
										bg='bg.panel'
										borderRadius='md'
										p='1'
										boxShadow='sm'
										fontSize='xs'
										color='fg.muted'
										opacity='0.8'
										pointerEvents='none'>
										⋮⋮
									</Box>
								)}
							</Center>
						</Box>
					))}
					{value && value?.length >= limit ? null : (
						<Center {...containerCSS}>
							<UploadModal
								type='add'
								handleImage={onChange}
								multiple={true}
								// Adding new images is the one place a picker makes
								// sense to multi-select from — per-image tiles above
								// only ever browse to replace/delete that one image.
								multiSelect={true}
							/>
						</Center>
					)}
				</Wrap>

				{helper && <HelperText>{helper}</HelperText>}
			</Stack>
		</FormControl>
	);
};

const containerCSS: any = {
	h: '200px',
	w: '200px',
	bg: 'transparent',
	position: 'relative',
};

const imageCss: ImageProps = {
	h: '100%',
	w: '100%',
	objectFit: 'contain',
};

export default VImageArray;
