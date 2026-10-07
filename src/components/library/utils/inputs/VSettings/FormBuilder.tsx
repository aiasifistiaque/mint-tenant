import React from 'react';
import { FC, useState, useCallback } from 'react';
import { Box, Button, Separator as Divider, Flex, Heading, Text } from '@chakra-ui/react';
import { Column } from '../../..';
import FormFields from './SettingFields';

// Main Form Builder Component that manages multiple sections
interface FormBuilderProps {
	availableFields?: { label: string; value: string }[];
	onChange?: (
		sections: { sectionTitle: string; description: string; fields: (string | string[])[] }[]
	) => void;
	value?: { sectionTitle: string; description: string; fields: (string | string[])[] }[];
}

const FormBuilder: FC<FormBuilderProps> = ({ availableFields, onChange, value = [] }) => {
	const [sections, setSections] = useState(value);

	const updateSections = useCallback(
		(
			newSections: { sectionTitle: string; description: string; fields: (string | string[])[] }[]
		) => {
			setSections(newSections);
			if (onChange) {
				onChange(newSections);
			}
		},
		[onChange]
	);

	const addSection = () => {
		const newSection = {
			sectionTitle: '',
			description: '',
			fields: [] as (string | string[])[],
		};
		updateSections([...sections, newSection]);
	};

	const updateSection = (
		index: number,
		sectionData: { sectionTitle: string; description: string; fields: (string | string[])[] }
	) => {
		const newSections = [...sections];
		newSections[index] = sectionData;
		updateSections(newSections);
	};

	const removeSection = (index: number) => {
		const newSections = sections.filter((_, i) => i !== index);
		updateSections(newSections);
	};

	return (
		<Column gap={6}>
			<Flex
				justify='space-between'
				align='center'>
				<Heading size='md'>Dynamic Form Builder</Heading>
				<Button
					colorPalette='blue'
					size='sm'
					onClick={addSection}>
					+ Add Section
				</Button>
			</Flex>

			{sections.map((section, index) => (
				<Box key={index}>
					<Flex
						justify='space-between'
						align='center'
						mb={4}>
						<Heading
							size='sm'
							color='fg.muted'>
							Section {index + 1}
						</Heading>
						<Button
							colorPalette='red'
							size='xs'
							onClick={() => removeSection(index)}>
							Remove Section
						</Button>
					</Flex>

					<Box
						border='2px solid'
						borderColor='border'
						borderRadius='lg'
						p={6}>
						{/* <FormFields
							availableFields={availableFields}
							onFormChange={(data: any) => updateSection(index, data)}
							initialValue={section}
						/> */}
					</Box>

					{index < sections.length - 1 && <Divider my={6} />}
				</Box>
			))}

			{sections.length === 0 && (
				<Box
					textAlign='center'
					py={12}
					color='fg.muted'>
					<Text
						fontSize='lg'
						mb={2}>
						No sections created yet
					</Text>
					<Text>{`Click "Add Section" to start building your form`}</Text>
				</Box>
			)}

			{/* Final Output Preview */}
			{sections.length > 0 && (
				<Box
					mt={8}
					p={6}
					bg='bg.subtle'
					borderRadius='lg'>
					<Heading
						size='sm'
						mb={4}>
						Complete Form Structure
					</Heading>
					<Box
						as='pre'
						fontSize='xs'
						overflow='auto'
						maxH='400px'>
						{JSON.stringify(sections, null, 2)}
					</Box>
				</Box>
			)}
		</Column>
	);
};

export default FormBuilder;
