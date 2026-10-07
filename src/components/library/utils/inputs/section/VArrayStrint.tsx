import { FC } from 'react';

import { Stack, Flex, Text } from '@chakra-ui/react';
import { HelperText, Label, Column } from '../../..';
import DeleteSection from './DeleteSection';
import ArrayStringModal from './ArrayStringModal';

type FormDataType = {
	value: any;
	onChange: any;
	isRequired?: boolean;
	label?: string;
	helper?: string;
	isDisabled?: boolean;
	name: any;
};

const VArrayString: FC<FormDataType> = ({
	value,
	onChange,
	isRequired = false,
	label,
	helper,
	isDisabled = false,
	name,
	...props
}) => {
	return (
		<Stack>
			<Stack w='full'>
				<Label fontSize='22px'>
					{label}{' '}
					{isRequired && (
						<Text
							as='span'
							color='red.500'>
							*
						</Text>
					)}
				</Label>
				<Column
					gap={4}
					my={4}>
					{value?.map((item: any, i: number) => (
						<Column
							key={i}
							gap={4}>
							<Flex
								justify='space-between'
								align='center'>
								<Text>{item} </Text>
								<Flex gap={1}>
									<ArrayStringModal
										value={value}
										type='edit'
										handleDataChange={onChange}
										name={name}
										index={i}
										prevVal={item}
									/>
									<DeleteSection
										idx={i}
										handleDataChange={onChange}
										name={name}
										value={value}
									/>
								</Flex>
							</Flex>
						</Column>
					))}
				</Column>
				<Flex>
					<ArrayStringModal
						value={value}
						type='add'
						handleDataChange={onChange}
						multiple={true}
						name={name}
					/>
				</Flex>
				{helper && <HelperText>{helper}</HelperText>}
			</Stack>
		</Stack>
	);
};

export default VArrayString;
