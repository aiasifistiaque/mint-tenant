'use client';
import { useState, FC, useEffect } from 'react';
import { InputProps, Stack, Flex, Text, Center } from '@chakra-ui/react';
import DeleteSection from '../section/DeleteSection';
import { Column, JsonView, SpaceBetween } from '../../../containers';
import { useGetByIdQuery, radius, FormControl } from '../../..';
import SettingSectionModal from './SettingSectionModal';

type InputContainerProps = InputProps & {
	label: string;
	isRequired?: boolean;
	helper?: string;
	value: string[];
	placeholder?: any;
	lowercase?: boolean;
	section?: boolean;
	form: any;
};

const VFormFields: FC<InputContainerProps> = ({
	label,
	isRequired,
	placeholder,
	value,
	helper,
	form,
	lowercase = true,
	section = false,
	...props
}) => {
	const onChange = props.onChange;
	const [isJsonView, setIsJsonView] = useState(false);
	const [schema, setSchema] = useState<any>();

	useEffect(() => {
		if (form?.sch) {
			try {
				setSchema(form?.sch);
			} catch (error) {
				console.error('Error parsing schema JSON:', error);
			}
		}
	}, [form?.sch]);

	const { data, isFetching, isError } = useGetByIdQuery(
		{ path: `model/${schema}`, id: 'keys' },
		{ skip: !schema }
	);

	const fieldCheck = (val: string) => {
		return !!form?.fields?.[val];
	};

	return (
		<FormControl
			label={label}
			isRequired={isRequired}
			gap={4}>
			<Stack
				gap={2}
				w='full'>
				<Column
					gap={4}
					py={4}>
					{data &&
						data?.map((item: any, i: number) => (
							<SpaceBetween
								key={i}
								{...viewCardsCss}>
								{fieldCheck(item) ? (
									<Column gap={4}>
										<Text
											fontWeight='600'
											fontSize='sm'>{`• ${item}: `}</Text>
										<JsonView data={{ data: form.fields[item] }} />
									</Column>
								) : (
									<SpaceBetween gap={6}>
										<Text fontSize='sm'>{`• ${item}`}</Text>
										<SettingSectionModal
											value={value}
											type='add'
											handleDataChange={onChange}
											name={props?.name || 'fields'}
											sectionKey={item}
											availableFields={data || []}
										/>
									</SpaceBetween>
								)}
							</SpaceBetween>
						))}
					<JsonView data={{ data: form }} />
				</Column>

				{data ? (
					<></>
				) : (
					<Center
						flexDirection='column'
						py={10}>
						<Text>No Schema Selected</Text>
						<Text fontSize='sm'>{`Choose a schema to get started`}</Text>
					</Center>
				)}
			</Stack>
		</FormControl>
	);
};

const viewCardsCss: any = {
	borderWidth: 1,
	p: 4,
	rounded: radius?.MODAL,
	w: 'full',
	gap: 6,
	align: 'flex-start',
};

export default VFormFields;
