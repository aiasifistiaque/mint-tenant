// import { FC } from 'react';

// import { FormControl, Stack, Flex, Text, Heading } from '@chakra-ui/react';
// import { HelperText, Label, Column, VInput, VSelect } from '../../../..';
// import AddSectionModal from '../AddSectionModal';
// import { options as items } from './options';

// type FormDataType = {
// 	value: any;
// 	onChange: any;
// 	isRequired?: boolean;
// 	label?: string;
// 	helper?: string;
// 	isDisabled?: boolean;
// 	name: any;
// 	hasImage?: boolean;
// 	limit?: number;
// 	section?: any;
// };

// const VTableMenu: FC<FormDataType> = ({
// 	value,
// 	onChange,
// 	isRequired = false,
// 	label,
// 	helper,
// 	isDisabled = false,
// 	name,
// 	hasImage,
// 	limit = 999,
// 	section,
// 	...props
// }) => {
// 	return (
// 		<FormControl isRequired={isRequired}>
// 			<Stack w='full'>
// 				<Label fontSize='22px'>{label}</Label>
// 				<Column
// 					gap={4}
// 					my={4}>
// 					..
// 				</Column>

// 				<Flex
// 					flexDir='column'
// 					p='128px'
// 					gap={4}>
// 					<VInput
// 						name='title'
// 						value='...'
// 						label='Title'
// 					/>
// 					<VSelect
// 						value={'...'}
// 						name='type'
// 						label='Type'>
// 						<option
// 							value=''
// 							disabled
// 							selected>
// 							Select option
// 						</option>
// 						{items?.map((item: any, i: number) => (
// 							<option
// 								key={i}
// 								value={item?.value}>
// 								{item?.label}
// 							</option>
// 						))}
// 					</VSelect>
// 					<AddSectionModal
// 						value={value}
// 						type='add'
// 						handleDataChange={onChange}
// 						multiple={true}
// 						name={name}
// 						hasImage={hasImage}
// 						section={section}
// 					/>
// 				</Flex>

// 				{helper && <HelperText>{helper}</HelperText>}
// 			</Stack>
// 		</FormControl>
// 	);
// };

// export default VTableMenu;

import React from 'react';

const VTableMenu = () => {
	return <div>VTableMenu</div>;
};

export default VTableMenu;
