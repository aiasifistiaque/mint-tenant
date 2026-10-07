import React from 'react';
import { FC, useState, useEffect, useCallback } from 'react';
import { Stack, Grid, Tag, TagLabel, Box, Flex, Text, GridItem } from '@chakra-ui/react';

import { VInput, VSelect, VTextarea } from '..';
import { Align, Column, JsonView, SpaceBetween } from '../../../containers';
import { Label } from '../../..';

interface FormFieldsProps {
	availableFields?: any[];

	onFormChange?: (data: {
		sectionTitle: string;
		description: string;
		fields: (string | string[])[];
	}) => void;
	initialValue?: {
		sectionTitle: string;
		description: string;
		fields: (string | string[])[];
	} | null;
}

const FormFields: FC<FormFieldsProps> = ({
	availableFields,
	onFormChange,
	initialValue = null,
}) => {
	const [sectionTitle, setSectionTitle] = useState(initialValue?.sectionTitle || '');
	const [description, setDescription] = useState(initialValue?.description || '');
	const [fields, setFields] = useState(initialValue?.fields || []);

	const [currentField, setCurrentField] = useState(availableFields);

	useEffect(() => {
		// Get all selected field values from the fields array
		const selectedValues: string[] = [];

		fields.forEach(field => {
			if (Array.isArray(field)) {
				// Handle array fields like ['name', 'category']
				field.forEach(item => {
					if (item && item !== '') {
						selectedValues.push(item);
					}
				});
			} else if (field && field !== '') {
				// Handle single fields like 'description'
				selectedValues.push(field);
			}
		});

		// Filter availableFields to exclude already selected values
		const filteredFields =
			availableFields?.filter(option => !selectedValues.includes(option.value)) || [];

		setCurrentField(filteredFields);
	}, [availableFields, fields]);

	const updateForm = useCallback(() => {
		const formData = {
			sectionTitle,
			description,
			fields,
		};

		if (onFormChange) {
			onFormChange(formData);
		}
	}, [sectionTitle, description, fields, onFormChange]);

	// Call updateForm whenever form data changes
	useEffect(() => {
		updateForm();
	}, [sectionTitle, description, fields, updateForm]);

	// Add a new field (can be string or array)
	const addField = (type = 'single') => {
		if (type === 'single') setFields([...fields, '']); // Add single field
		else setFields([...fields, ['']]); // Add array field
	};

	// Remove a field
	const removeField = (index: number) => {
		const newFields = fields.filter((_, i) => i !== index);
		setFields(newFields);
	};

	// Update a field value
	const updateField = (index: number, value: string, subIndex: number | null = null) => {
		const newFields = [...fields];
		if (subIndex !== null) {
			// Updating array field
			if (!Array.isArray(newFields[index])) {
				newFields[index] = [value];
			} else {
				// Type assertion to ensure we can modify the array
				(newFields[index] as string[])[subIndex] = value;
			}
		} else {
			// Updating single field
			newFields[index] = value;
		}
		setFields(newFields);
	};

	// Add item to an array field (create horizontal grouping)
	const addToArray = (index: number) => {
		const newFields = [...fields];
		if (Array.isArray(newFields[index])) {
			(newFields[index] as string[]).push('');
		} else {
			// Convert single field to array
			newFields[index] = [newFields[index] as string, ''];
		}
		setFields(newFields);
	};

	// Remove item from array field
	const removeFromArray = (fieldIndex: number, itemIndex: number) => {
		const newFields = [...fields];
		if (Array.isArray(newFields[fieldIndex])) {
			(newFields[fieldIndex] as string[]).splice(itemIndex, 1);
			// If only one item left, convert back to single field
			if ((newFields[fieldIndex] as string[]).length === 1) {
				newFields[fieldIndex] = (newFields[fieldIndex] as string[])[0];
			}
		}
		setFields(newFields);
	};

	return (
		<Column gap={6}>
			{/* Section Title */}
			<VInput
				label='Section Title'
				name='sectionTitle'
				isRequired
				value={sectionTitle}
				onChange={(e: any) => setSectionTitle(e.target.value)}
				placeholder='Enter section title'
			/>

			{/* Description */}
			<VTextarea
				label='Description'
				name='description'
				value={description}
				onChange={(e: any) => setDescription(e.target.value)}
				placeholder='Enter section description'
			/>
			{/* <JsonView data={{ availableFields }} />
			<JsonView data={{ fields }} />
			<JsonView data={{ currentField }} /> */}

			{/* Fields Section */}
			<Box>
				<SpaceBetween mb={4}>
					<Label>Fields</Label>
					<Flex gap={2}>
						<TagButton onClick={() => addField('single')}>+ Add Field</TagButton>
					</Flex>
				</SpaceBetween>

				{/* Render Fields */}
				<Stack gap={3}>
					{fields?.map((field: any, i: number) => (
						<Box
							key={i}
							{...cardContainerCss}>
							{Array.isArray(field) ? (
								// Array field (horizontal group)
								<Box>
									<SpaceBetween mb={2}>
										<Text
											fontSize='sm'
											color='fg.muted'>
											Row {i + 1}
										</Text>
										<Flex gap={1}>
											{field?.length < 2 && <TagButton onClick={() => addToArray(i)}>+</TagButton>}
											<TagButton
												onClick={() => addField('single')}
												title='Add field below'>
												↓
											</TagButton>
											<TagButton onClick={() => removeField(i)}>×</TagButton>
										</Flex>
									</SpaceBetween>
									<Grid
										gridTemplateColumns='1fr 1fr'
										gap={2}>
										{field?.map((item, itemIndex) => (
											<GridItem
												key={itemIndex}
												colSpan={field?.length === 1 ? 2 : 1}>
												<Align
													w='full'
													gap={1}>
													<VSelect
														isRequired
														value={item}
														onChange={(e: any) => updateField(i, e.target.value, itemIndex)}
														name={`field_${i}_${itemIndex}`}
														placeholder='Select field'
														label='Select Field'>
														<option
															value=''
															// disabled
															selected>
															Select option
														</option>
														{availableFields?.map((opt: any, index: number) => {
															// Check if this option is already selected in any field
															const isSelected = fields.some(fieldItem => {
																if (Array.isArray(fieldItem)) {
																	return fieldItem.includes(opt?.value);
																} else {
																	return fieldItem === opt?.value;
																}
															});

															// Don't disable if it's the current field being edited
															const isCurrentField = field === opt?.value;

															return (
																<option
																	disabled={isSelected && !isCurrentField}
																	key={index}
																	value={opt?.value}>
																	{opt?.label}
																</option>
															);
														})}
													</VSelect>

													{field?.length > 1 && (
														<Flex gap={1}>
															<TagButton
																onClick={() => removeFromArray(i, itemIndex)}
																_hover={{ bg: 'red.500' }}>
																×
															</TagButton>
														</Flex>
													)}
												</Align>
											</GridItem>
										))}
									</Grid>
								</Box>
							) : (
								// Single field
								<Box>
									<SpaceBetween mb={2}>
										<Text
											fontSize='sm'
											color='fg.muted'>
											Field {i + 1}
										</Text>
										<Flex gap={1}>
											<TagButton
												onClick={() => addToArray(i)}
												title='Convert to row (horizontal group)'>
												→
											</TagButton>
											<TagButton
												onClick={() => addField('single')}
												title='Add field below'>
												↓
											</TagButton>
											<TagButton
												colorPalette='red'
												onClick={() => removeField(i)}
												_hover={{ bg: 'red.500' }}>
												×
											</TagButton>
										</Flex>
									</SpaceBetween>

									<VSelect
										isRequired
										value={field as string}
										onChange={(e: any) => updateField(i, e.target.value)}
										name={`field_${i}`}
										placeholder='Select field'
										label='Select Field'>
										<option
											value=''
											// disabled
											selected>
											Select option
										</option>
										{availableFields?.map((opt: any, index: number) => {
											// Check if this option is already selected in any field
											const isSelected = fields.some(fieldItem => {
												if (Array.isArray(fieldItem)) {
													return fieldItem.includes(opt?.value);
												} else {
													return fieldItem === opt?.value;
												}
											});

											// Don't disable if it's the current field being edited
											const isCurrentField = field === opt?.value;

											return (
												<option
													disabled={isSelected && !isCurrentField}
													key={index}
													value={opt?.value}>
													{opt?.label}
												</option>
											);
										})}
									</VSelect>
								</Box>
							)}
						</Box>
					))}
				</Stack>

				{fields?.length === 0 && (
					<Box
						textAlign='center'
						py={8}
						color='fg.muted'>
						<Text>No fields added yet</Text>
						<Text fontSize='sm'>{`Click "Add Field" or "Add Row" to get started`}</Text>
					</Box>
				)}
			</Box>

			{/* Preview */}
			<Box {...previewBoxCss}>
				<Label mb={2}>Preview</Label>
				<JsonView data={{ sectionTitle, description, fields }} />
			</Box>
		</Column>
	);
};

const TagButton = ({ children, ...props }: any & { children: React.ReactNode }) => {
	return (
		<Tag.Root
			size='md'
			bg='transparent'
			borderWidth={1}
			cursor='pointer'
			{...props}>
			<Tag.Label>{children}</Tag.Label>
		</Tag.Root>
	);
};

const cardContainerCss = {
	p: 4,
	border: '1px solid',
	borderColor: 'border',
	borderRadius: 'md',
};

const previewBoxCss = {
	p: 4,
	bg: 'bg.subtle',
	borderRadius: 'md',
	mt: 6,
};

export default FormFields;
