import { Flex, FlexProps } from '@chakra-ui/react';
import { FC, ReactNode } from 'react';

import { Icon, radius } from '../..';

type FilterProps = FlexProps & {
	children: ReactNode;
	isActive?: boolean;
	onCancel?: any;
};

const Filter: FC<FilterProps> = ({ children, isActive = false, onCancel, ...props }) => {
	return (
		<Flex
			userSelect='none'
			cursor='pointer'
			bg='transparent'
			borderRadius='full'
			border='1px dashed'
			mr={0.5}
			mb={0.5}
			borderColor='text.secondary.dark'
			color='fg.muted'
			fontWeight='600'
			_dark={{
				borderColor: 'border.dark',
				color: 'text.secondary.dark',
				bg: 'table.row.dark',
			}}
			fontSize='sm'
			pl={1}
			py={1}
			alignItems='center'
			display='inline-flex'
			{...props}>
			{!isActive && (
				<Icon
					name='add-tag'
					size={16}
				/>
			)}
			<Flex mx={1}>{children}</Flex>
			{isActive && (
				<Flex onClick={onCancel}>
					<Icon
						name='close'
						size={16}
					/>
				</Flex>
			)}
		</Flex>
	);
};

export default Filter;
