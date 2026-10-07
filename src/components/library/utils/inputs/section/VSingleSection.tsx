import { FC, useState } from 'react';

import { Center, Image, Stack, InputProps, GridProps, Flex, Text, Heading } from '@chakra-ui/react';
import { HelperText, Label, ImageContainer, Column } from '../../..';
import AddSectionModal from './AddSectionModal';

type FormDataType = {
	value: any;
	onChange: any;
	isRequired?: boolean;
	label?: string;
	helper?: string;
	isDisabled?: boolean;
	name: any;
};

const VSection: FC<FormDataType> = ({
	value,
	onChange,
	isRequired = false,
	label,
	helper,
	isDisabled = false,
	name,
	...props
}) => {
	const type = value ? 'edit' : 'add';

	const imageComponent = (
		<ImageContainer>
			<Image
				h='100%'
				w='100%'
				objectFit='contain'
				src={value}
			/>
		</ImageContainer>
	);

	if (isDisabled) return imageComponent;
	return (
		<Stack>
			<Stack w='full'>
				<Label>
					{label}{' '}
					{isRequired && (
						<Text
							as='span'
							color='red.500'>
							*
						</Text>
					)}
				</Label>
				<Flex>
					<AddSectionModal
						value={value}
						type={type}
						handleDataChange={onChange}
						multiple={true}
						name={name}
					/>
					{value && imageComponent}
				</Flex>
				{helper && <HelperText>{helper}</HelperText>}
			</Stack>
			<Column>
				{value?.map((item: any, i: number) => (
					<Column
						key={i}
						gap={2}>
						<Heading size='sm'>{item?.title} </Heading>
						<Text>{item?.description} </Text>
					</Column>
				))}
			</Column>
		</Stack>
	);
};

export default VSection;
