import React, { FC } from 'react';
import { Flex, Text } from '@chakra-ui/react';
import { SpaceBetween } from '../../../containers';
import { TagButton } from '../../..';

interface SingleFieldButtonsProps {
	i: number;
	addToArray: any;
	addField: any;
	removeField: any;
}

const SingleFieldButtons: FC<SingleFieldButtonsProps> = ({
	i,
	addToArray,
	addField,
	removeField,
}) => {
	return (
		<SpaceBetween mb={2}>
			<Text
				fontSize='sm'
				color='fg.muted'>
				Field {i + 1}
			</Text>
			<Flex gap={1}>
				<TagButton
					onClick={addToArray}
					title='Convert to row (horizontal group)'>
					→
				</TagButton>
				<TagButton
					onClick={addField}
					title='Add field below'>
					↓
				</TagButton>
				<TagButton
					colorPalette='red'
					onClick={removeField}
					_hover={{ bg: 'red.500' }}>
					×
				</TagButton>
			</Flex>
		</SpaceBetween>
	);
};

export default SingleFieldButtons;
