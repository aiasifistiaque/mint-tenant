import React, { useEffect } from 'react';
import { Column, JsonView, radius, VInput, VSelect } from '../../../';
import { Grid, GridProps, Heading } from '@chakra-ui/react';
import { filterOptions, multiSelectFilterOptions } from './data';

type Options = { label: string; value: string };

export type FilterType = {
	name: string;
	type: 'multi-select' | 'range' | 'boolean' | 'date' | 'text' | 'select';
	label: string;
	title: string;
	options?: Options[];
	category?: 'model' | 'distinct';
	model?: string;
	key?: string;
	roles?: [string];
	field?: string;
};

const SettingsFilter = ({
	data,
	setData,
	sectionKey,
	availableFields,
}: {
	data: any;
	setData: any;
	sectionKey: string;
	availableFields: string[];
}) => {
	const [formData, setFormData] = React.useState<FilterType>({
		name: sectionKey || '',
		field: '',
		type: 'text',
		label: '',
		title: '',
		options: [],
		category: 'model',
		model: '',
		key: '',
	});

	useEffect(() => {
		setFormData({ ...data, name: sectionKey });
	}, [sectionKey]);

	const onChange = (e: any) => {
		const { name, value, type, checked } = e.target;
		const val = type === 'checkbox' ? checked : value;

		setFormData((prev: any) => ({
			...prev,
			[name]: val,
		}));
	};

	useEffect(() => {
		const fieldData = {
			title: formData.title,
			type: formData.type,
			label: formData.label,
			name: sectionKey,
			options: formData.options,
			...(formData?.type === 'multi-select' && { category: formData.category }),
			...(formData?.type === 'multi-select' &&
				formData?.category === 'model' && { model: formData.model }),
			...(formData?.type === 'multi-select' &&
				formData?.category === 'distinct' && { key: formData.key }),
			field: formData?.type == 'multi-select' ? `${sectionKey}_in` : sectionKey,
		};
		setData(fieldData);
	}, [formData]);

	return (
		<Column gap={4}>
			<Column
				p={4}
				gap={4}
				borderWidth={1}
				borderRadius={radius?.MODAL}>
				<Heading size='sm'>Filter Details</Heading>
				<JsonView data={formData} />
				<Grid {...gridRowDouble}>
					<VInput
						isRequired
						label='Filter Name'
						name='name'
						disabled
						value={formData.name}
						onChange={() => {}}
					/>
					<VSelect
						isRequired
						defaultEnabled
						name='type'
						value={formData.type}
						onChange={onChange}
						label='Filter Type'
						placeholder='Select an option'>
						{filterOptions?.map((option: any) => (
							<option
								key={option?.value}
								value={option?.value}>
								{option?.label}
							</option>
						))}
					</VSelect>
				</Grid>
				<Grid {...gridRowDouble}>
					<VInput
						isRequired
						label='Label'
						name='label'
						value={formData.label}
						onChange={onChange}
						helper='Label would appear on filter button'
					/>
					<VInput
						isRequired
						label='Title'
						name='title'
						value={formData.title}
						onChange={onChange}
						helper='Title would appear on filter popup'
					/>
				</Grid>
				{formData?.type == 'multi-select' && (
					<Column gap={4}>
						<Grid {...gridRowDouble}>
							<VSelect
								isRequired
								defaultEnabled
								name='category'
								value={formData?.category || ''}
								onChange={onChange}
								label='Multi Select Category'
								helper='distinct: for distinct values from a field, model: for fetching values from a model'
								placeholder='Select an option'>
								{multiSelectFilterOptions?.map((option: any) => (
									<option
										key={option?.value}
										value={option?.value}>
										{option?.label}
									</option>
								))}
							</VSelect>
							<VSelect
								isRequired
								defaultEnabled
								name='key'
								label={formData?.category == 'distinct' ? 'Filter Key' : 'Label Key'}
								value={formData.key || ''}
								onChange={onChange}
								helper={
									formData?.category == 'distinct'
										? 'Field key to fetch distinct values from'
										: 'Field key of label in the model'
								}>
								{availableFields?.map((option: any) => (
									<option
										key={option}
										value={option}>
										{option}
									</option>
								))}
							</VSelect>
						</Grid>

						{formData?.category == 'model' && (
							<Grid {...gridRowSingle}>
								<VInput
									isRequired
									label='Model Ref Name'
									name='model'
									value={formData.model}
									onChange={onChange}
									helper='Model reference name for the filter'
								/>
							</Grid>
						)}
					</Column>
				)}
			</Column>
		</Column>
	);
};

const gridRowDouble: GridProps = {
	gridTemplateColumns: { base: '1fr', md: '1fr 1fr' },
	gap: 4,
};

const gridRowSingle: GridProps = {
	gridTemplateColumns: '1fr',
	gap: 4,
};

export default SettingsFilter;
