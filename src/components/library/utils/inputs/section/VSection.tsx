import { FC } from 'react';

import { Box, Image, Stack, Flex, Text } from '@chakra-ui/react';
import { HelperText } from '../../..';
import AddSectionModal from './AddSectionModal';
import DeleteSection from './DeleteSection';

type FormDataType = {
	value: any;
	onChange: any;
	isRequired?: boolean;
	label?: string;
	helper?: string;
	isDisabled?: boolean;
	name: any;
	hasImage?: boolean;
	limit?: number;
	section?: any;
};

/**
 * A list of entries that each have a title and a description (and an image
 * with `hasImage`) — FAQs, custom sections. Each entry is edited in a modal.
 */
const VSection: FC<FormDataType> = ({
	value,
	onChange,
	isRequired = false,
	label,
	helper,
	isDisabled = false,
	name,
	hasImage,
	limit = 999,
	section,
}) => {
	const items: any[] = Array.isArray(value) ? value : [];

	return (
		<Stack
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
			{items.length > 0 && (
				<Stack
					gap={0}
					borderWidth='1px'
					borderRadius='md'
					overflow='hidden'>
					{items.map((item: any, i: number) => (
						<Flex
							key={i}
							gap={3}
							p={3}
							align='flex-start'
							borderTopWidth={i ? '1px' : 0}>
							{hasImage && item?.image && (
								<Image
									src={item.image}
									alt=''
									h='48px'
									w='48px'
									flexShrink={0}
									objectFit='cover'
									borderRadius='sm'
								/>
							)}
							<Box
								flex={1}
								minW={0}>
								<Text
									fontSize='sm'
									fontWeight='600'
									wordBreak='break-word'>
									{item?.title || 'Untitled'}
								</Text>
								{item?.description && (
									<Text
										fontSize='sm'
										color='fg.muted'
										whiteSpace='pre-line'
										wordBreak='break-word'
										lineClamp={3}>
										{item.description}
									</Text>
								)}
							</Box>
							{!isDisabled && (
								<Flex
									gap={1}
									flexShrink={0}>
									<AddSectionModal
										value={items}
										type='edit'
										handleDataChange={onChange}
										name={name}
										index={i}
										prevVal={item}
										hasImage={hasImage}
										section={section}
									/>
									<DeleteSection
										idx={i}
										handleDataChange={onChange}
										name={name}
										value={items}
									/>
								</Flex>
							)}
						</Flex>
					))}
				</Stack>
			)}
			{!isDisabled && items.length < limit && (
				<Flex>
					<AddSectionModal
						value={items}
						type='add'
						handleDataChange={onChange}
						multiple={true}
						name={name}
						hasImage={hasImage}
						section={section}
					/>
				</Flex>
			)}
			{helper && <HelperText>{helper}</HelperText>}
		</Stack>
	);
};

export default VSection;
