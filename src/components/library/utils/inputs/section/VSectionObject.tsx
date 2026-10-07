'use client';

import { FC, useRef } from 'react';
import { Box, Flex, Grid, Text } from '@chakra-ui/react';
import FormInput from '../../../create-page/inputs/form-input/FormInput';
import getOnChangeHandler from '../../../functions/getOnChangeHandler';
import { HelperText } from '../../..';

/**
 * A single section (model builder "Section" kind): its own fields, filled in
 * inline and stored as one object under the field's key — `address: { street,
 * city, zip }`. The fields come from `dataModel`, as the builder generated
 * them. Each change hands the whole object up, as any other input's value.
 */

type Props = {
	name: string;
	label?: string;
	value: any;
	onChange: (e: any) => void;
	isRequired?: boolean;
	helper?: string;
	dataModel?: any[];
};

const VSectionObject: FC<Props> = ({ name, label, value, onChange, isRequired, helper, dataModel = [] }) => {
	// The latest object, so two changes in one tick both land.
	const latest = useRef<any>(value || {});
	latest.current = value && typeof value === 'object' ? value : {};

	const setFormData = (u: any) => {
		const next = typeof u === 'function' ? u(latest.current) : u;
		latest.current = next;
		onChange({ target: { name, value: next } });
	};
	const setChangedData = () => {};

	return (
		<Flex
			direction='column'
			gap={2}
			w='full'>
			{label && (
				<Text
					fontSize='sm'
					fontWeight='600'>
					{label}
					{isRequired && (
						<Text
							as='span'
							color='red.500'>
							{' '}
							*
						</Text>
					)}
				</Text>
			)}
			<Box
				borderWidth='1px'
				borderRadius='md'
				p={3}>
				<Grid
					templateColumns={{ base: '1fr', md: 'repeat(2, minmax(0, 1fr))' }}
					gap={3}>
					{dataModel.map((item: any) => (
						<Box
							key={item.name}
							gridColumn={['textarea', 'image', 'file'].includes(item.type) ? { md: 'span 2' } : undefined}>
							<FormInput
								formData={latest.current}
								setFormData={setFormData}
								setChangedData={setChangedData}
								isRequired={item.isRequired || false}
								name={item.name}
								label={item.label}
								type={item.type}
								value={latest.current?.[item.name] ?? (item.type === 'checkbox' ? false : '')}
								onChange={getOnChangeHandler({
									type: item.type,
									key: item.name,
									formData: latest.current,
									setFormData,
									setChangedData,
								})}
								options={item.options}
								item={item}
							/>
						</Box>
					))}
				</Grid>
			</Box>
			{helper && <HelperText>{helper}</HelperText>}
		</Flex>
	);
};

export default VSectionObject;
