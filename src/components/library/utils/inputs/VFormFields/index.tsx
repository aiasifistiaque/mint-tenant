'use client';
import { useState, FC, useEffect } from 'react';
import {
	InputProps,
	Stack,
	Flex,
	Heading,
	Text,
	Tag,
	Grid,
	GridItem,
	Center,
} from '@chakra-ui/react';

import DeleteSection from '../section/DeleteSection';
import { Column, JsonView, SpaceBetween } from '../../../containers';
import { useGetByIdQuery, Label, radius, FormControl } from '../../..';
import FormSectionModal from './FormSectionModal';

type InputContainerProps = InputProps & {
	label: string;
	isRequired?: boolean;
	helper?: string;
	value: string[];
	placeholder?: any;
	lowercase?: boolean;
	section?: boolean;
	form: any;
};

const VFormFields: FC<InputContainerProps> = ({
	label,
	isRequired,
	placeholder,
	value,
	helper,
	form,
	lowercase = true,
	section = false,
	...props
}) => {
	const onChange = props.onChange;
	const [isJsonView, setIsJsonView] = useState(false);

	const [schema, setSchema] = useState<any>();

	useEffect(() => {
		if (form?.sch) {
			try {
				//const parsedSchema = JSON.parse(form.schema);
				setSchema(form?.sch);
			} catch (error) {
				console.error('Error parsing schema JSON:', error);
			}
		}
	}, [form?.sch]);

	const { data, isFetching, isError } = useGetByIdQuery(
		{ path: `model/${schema}`, id: 'keys' },
		{ skip: !schema }
	);

	const getAvailableFields = (index: number) =>
		data
			?.map((item: string) => ({
				label: item.charAt(0).toUpperCase() + item.slice(1),
				value: item,
			}))
			.filter((field: any) => {
				// Get all used field values from all sections in the value array
				const usedFields: string[] = [];

				value?.map((section: any, i: number) => {
					if (section?.fields) {
						if (index !== undefined && i === index) return; // Skip current section when editing

						// Collect fields from this section
						section.fields.forEach((fieldItem: any) => {
							if (Array.isArray(fieldItem)) {
								// Handle array fields like ['name', 'category']
								usedFields.push(...fieldItem.filter(f => f !== ''));
							} else if (fieldItem && fieldItem !== '') {
								// Handle single fields like 'description'
								usedFields.push(fieldItem);
							}
						});
					}
				});

				// Only include fields that haven't been used yet
				return !usedFields.includes(field.value);
			});

	return (
		<FormControl
			label={label}
			isRequired={isRequired}
			gap={4}>
			<Stack
				gap={2}
				w='full'>
				{/* <JsonView data={{ form }} /> */}
				{/* <VDataSelect
					value={model}
					onChange={(e: any) => setModel(e.target.value)}
					name='model'
					label='Model'
					labelKey='name'
					valueKey='name'
					placeholder='Select Model'
					model='mongoose/list'
					helper='Please Choose the model for fetching fields'
				/> */}
				<SpaceBetween>
					{/* <Label>{label}</Label> */}
					<TagButton onClick={() => setIsJsonView(!isJsonView)}>
						{isJsonView ? 'Form View' : 'Json View'}
					</TagButton>
				</SpaceBetween>

				<Column
					gap={2}
					py={2}>
					{value?.map((item: any, i: number) => (
						<SpaceBetween
							key={i}
							{...viewCardsCss}>
							{isJsonView ? (
								<JsonView data={{ data: item }} />
							) : (
								<Column
									gap={2}
									flex={1}>
									<Heading size='sm'>{item?.sectionTitle}</Heading>
									{item?.description && (
										<Text
											fontSize='sm'
											color='fg.muted'
											mb={2}>
											{item?.description}
										</Text>
									)}
									{item?.fields?.map((field: any, itemIndex: number) => (
										<Grid
											templateColumns='repeat(2, 1fr)'
											gap={4}
											w='full'
											key={itemIndex}>
											{Array.isArray(field) ? (
												field?.map((f, index) => (
													<GridItem
														w='full'
														key={index}>
														<TagButton>{f}</TagButton>
													</GridItem>
												))
											) : (
												<GridItem colSpan={2}>
													<TagButton>{field}</TagButton>
												</GridItem>
											)}
										</Grid>
									))}
								</Column>
							)}
							<Column gap={2}>
								<Flex gap={1}>
									<FormSectionModal
										type='edit'
										index={i}
										value={value}
										prevVal={item}
										handleDataChange={onChange}
										name={props?.name || 'fields'}
										availableFields={getAvailableFields(i)}
									/>
									<DeleteSection
										idx={i}
										handleDataChange={onChange}
										name={props?.name || 'fields'}
										value={value}
									/>
								</Flex>
							</Column>
						</SpaceBetween>
					))}
				</Column>

				{data ? (
					<FormSectionModal
						value={value}
						handleDataChange={onChange}
						name={props?.name || 'fields'}
						availableFields={getAvailableFields(-1)}
					/>
				) : (
					<Center
						flexDirection='column'
						py={10}>
						<Text>No Schema Selected</Text>
						<Text fontSize='sm'>{`Choose a schema to get started`}</Text>
					</Center>
				)}
			</Stack>
		</FormControl>
	);
};

const TagButton = ({ children, ...props }: any & { children: React.ReactNode }) => {
	return (
		<Tag.Root
			cursor='pointer'
			size='md'
			bg='transparent'
			borderWidth={1}
			{...props}>
			<Tag.Label>{children}</Tag.Label>
		</Tag.Root>
	);
};

const viewCardsCss: any = {
	borderWidth: 1,
	p: 4,
	rounded: radius?.MODAL,
	w: 'full',
	gap: 6,
	align: 'flex-start',
};

const titleCheckboxCss: any = {
	colorPalette: 'brand',
	size: 'md',
	fontSize: '16px',
	fontWeight: '500',
};

export default VFormFields;
