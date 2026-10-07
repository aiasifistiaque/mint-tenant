import { FC } from 'react';

import { Image, Stack, Flex, Text } from '@chakra-ui/react';
import { HelperText, Column, SpaceBetween } from '../../..';
import DeleteSection from './DeleteSection';
import AddSectionDataModal from './AddSectionDataModal';
import { SectionRows } from '../../../components/view/utils/render-view-item/SectionValues';

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

const VSectionDataArray: FC<FormDataType> = ({
	value,
	onChange,
	isRequired = false,
	label,
	helper,
	isDisabled = false,
	name,
	limit = 999,
	section,
	...props
}) => {
	return (
		<Stack>
			<Stack
				w='full'
				gap={2}>
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
				{/* A model builder list: its rows as a table, number columns added up. */}
				{section?.table && Array.isArray(value) && value.length > 0 && (
					<SectionRows
						rows={value}
						dataModel={section?.dataModel || []}
						actions={
							isDisabled
								? undefined
								: i => (
										<Flex gap={1}>
											<AddSectionDataModal
												value={value}
												type='edit'
												handleDataChange={onChange}
												name={name}
												index={i}
												prevVal={value[i]}
												section={section}
												dataModel={section?.dataModel}
											/>
											<DeleteSection
												idx={i}
												handleDataChange={onChange}
												name={name}
												value={value}
											/>
										</Flex>
								  )
						}
					/>
				)}
				<Column
					gap={4}
					my={section?.table ? 0 : 4}
					display={section?.table ? 'none' : undefined}>
					{value?.map((item: any, i: number) => (
						<Flex
							key={i}
							w='full'
							align='center'
							gap={6}>
							{section?.display?.image && (
								<Image
									objectFit='contain'
									src={item?.[section?.display?.image]}
									h='64px'
									w='64px'
								/>
							)}
							<Column
								gap={4}
								w='full'>
								<SpaceBetween>
									<Text
										fontSize='sm'
										fontWeight='600'>
										{item?.[section?.display?.title]}
									</Text>
									<Flex
										gap={1}
										display={isDisabled ? 'none' : undefined}>
										<AddSectionDataModal
											value={value}
											type='edit'
											handleDataChange={onChange}
											name={name}
											index={i}
											prevVal={item}
											section={section}
											dataModel={section?.dataModel}
										/>
										<DeleteSection
											idx={i}
											handleDataChange={onChange}
											name={name}
											value={value}
										/>
									</Flex>
								</SpaceBetween>

								<Text lineClamp={6}>{item?.[section?.display?.description]}</Text>
							</Column>
						</Flex>
					))}
				</Column>
				{isDisabled || (value && value?.length >= limit) ? null : (
					<Flex>
						<AddSectionDataModal
							value={value}
							type='add'
							handleDataChange={onChange}
							multiple={true}
							name={name}
							section={section}
							dataModel={section?.dataModel}
						/>
					</Flex>
				)}
				{helper && <HelperText>{helper}</HelperText>}
			</Stack>
		</Stack>
	);
};

export default VSectionDataArray;
