import React from 'react';
import { FC } from 'react';
import { Grid, Box, GridProps } from '@chakra-ui/react';
import { VCheckbox, VInput, VSelect } from '..';
import { Column, JsonView } from '../../../containers';
import { Label } from '../../..';
import { typeOptions } from './data';
import SettingsFilter from './SettingsFilter';

interface SettingFieldsProps {
	formData: any;
	onChange: (e: any) => void;
	sectionKey: string;
	availableFields: string[];
}

const SettingFields: FC<SettingFieldsProps> = ({
	formData,
	onChange,
	sectionKey,
	availableFields,
}) => {
	return (
		<Column gap={6}>
			<Grid {...gridRowDouble}>
				<VInput
					label='Title'
					name='title'
					isRequired
					value={formData.title}
					onChange={onChange}
					placeholder='Enter Title'
				/>
				<VSelect
					label='Type'
					name='type'
					value={formData.type}
					onChange={onChange}
					defaultEnabled
					placeholder='Select Type'>
					{typeOptions?.map((option: any) => (
						<option
							key={option?.value}
							value={option?.value}>
							{option?.label}
						</option>
					))}
				</VSelect>
			</Grid>
			<Grid {...gridRowDouble}>
				<VCheckbox
					label='Is required'
					name='required'
					value={formData.required}
					onChange={onChange}
				/>
				<VCheckbox
					label='Editable'
					name='edit'
					value={formData.edit}
					onChange={onChange}
				/>
			</Grid>
			<Grid {...gridRowDouble}>
				<VCheckbox
					label='Is Unique'
					name='unique'
					value={formData.unique}
					onChange={onChange}
				/>
				<VCheckbox
					label='Is Filter Allowed'
					name='sort'
					value={formData.sort}
					onChange={onChange}
				/>
			</Grid>
			{(formData?.type == 'string' || formData?.type == 'email') && (
				<Grid {...gridRowDouble}>
					<VCheckbox
						label='Is Searchable'
						name='search'
						value={formData.search}
						onChange={onChange}
					/>
					<VCheckbox
						label='Trim String value'
						name='trim'
						value={formData.trim}
						onChange={onChange}
					/>
				</Grid>
			)}
			{formData?.type == 'number' && (
				<Grid {...gridRowDouble}>
					<VInput
						type='number'
						label='Min value'
						name='min'
						value={formData.min}
						onChange={onChange}
					/>
					<VInput
						type='number'
						label='Max value'
						name='max'
						value={formData.max}
						onChange={onChange}
					/>
				</Grid>
			)}

			{formData?.sort && (
				<SettingsFilter
					availableFields={availableFields}
					data={formData?.filter || {}}
					setData={(data: any) => onChange({ target: { name: 'filter', value: data } })}
					sectionKey={sectionKey}
				/>
			)}

			{/* Preview */}
			<Box {...previewBoxCss}>
				<Label mb={2}>Preview</Label>
				<JsonView data={formData} />
			</Box>
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

export default SettingFields;

// {
//     "dimensions": {
//         "length": 0,
//         "width": 0,
//         "height": 0
//     },
//     "_id": "68e041fb65742aa630e42132",
//     "name": "Demo Product",
//     "isActive": true,
//     "images": [],
//     "category": "68dd83c249eedcca271f680a",
//     "collection": [],
//     "brand": "68d6b258189a271bfcad3815",
//     "isFeatured": false,
//     "cost": 200,
//     "price": 100,
//     "isDiscount": false,
//     "discount": 0,
//     "weight": 0,
//     "tags": [],
//     "allowStock": true,
//     "stock": 0,
//     "damage": 0,
//     "lowStockAlert": 0,
//     "variations": [
//         {
//             "name": "xl-blue",
//             "price": 100,
//             "cost": 200,
//             "stock": 10,
//             "attributes": [
//                 {
//                     "label": "color",
//                     "value": "red",
//                     "_id": "68e041fb65742aa630e42134",
//                     "id": "68e041fb65742aa630e42134"
//                 },
//                 {
//                     "label": "size",
//                     "value": "2xl",
//                     "_id": "68e042a165742aa630e42177",
//                     "id": "68e042a165742aa630e42177"
//                 }
//             ],
//             "images": [],
//             "_id": "68e041fb65742aa630e42133"
//         }
//     ],
//     "status": "draft",
//     "vat": 0,
//     "isVisible": true,
//     "metaKeywords": [],
//     "customAttributes": [],
//     "customSections": [],
//     "inventory": [],
//     "faq": [],
//     "createdAt": "2025-10-03T21:36:59.760Z",
//     "updatedAt": "2025-10-03T21:39:45.819Z",
//     "slug": "demo-product",
//     "__v": 1,
//     "inStock": false,
//     "totalStock": 0,
//     "totalInventorySellValue": 0,
//     "stockInTransit": 0,
//     "inventoryCostPrice": 0,
//     "inventorySellPrice": 0,
//     "id": "68e041fb65742aa630e42132"
// }
