'use client';

import { FC, useState, useMemo } from 'react';

import { FormInput, FormItem, FormDivision } from '../..';

type FormPageType = {
	formData: any;
	setFormData: any;
	trigger?: any;
	result?: any;
	path?: string;
	data: any[];
	title?: string;
	type?: 'add' | 'update';
	id?: string;
	onSubmit?: any;
};

const FormContent: FC<FormPageType> = ({
	formData,
	setFormData,
	trigger,
	result,
	path,
	data,
	type,
	id,
	onSubmit,
}) => {
	//const { isSuccess, isLoading, isError, error } = result;
	const [changedData, setChangedData] = useState({});

	const sections = useMemo(() => {
		let section: any[] = [];
		let sections: any[][] = [];

		data.forEach((field: any, i: number) => {
			section.push(field);
			if (field.endOfSection || i === data.length - 1) {
				sections.push(section);
				section = [];
			}
		});

		return sections;
	}, [data]);

	// useCustomToast({
	// 	successText: type == 'update' ? 'Information Updated Successfully' : 'Item added successfully',
	// 	isSuccess,
	// 	isError,
	// 	isLoading: isLoading,
	// 	error: error,
	// });

	const handleChange = (e: any) => {
		if (e.target.name.includes('.')) {
			const [parent, child] = e.target.name.split('.');
			setFormData((prevState: any) => ({
				...prevState,
				[parent]: {
					...prevState[parent],
					[child]: e.target.value,
				},
			}));
			setChangedData((prevState: any) => ({
				...prevState,
				[parent]: {
					...formData[parent],
					[child]: e.target.value,
				},
			}));
		} else {
			setFormData({ ...formData, [e.target.name]: e.target.value });
			setChangedData(prevState => ({ ...prevState, [e.target.name]: e.target.value }));
		}
	};

	const handleSwitch = (e: any) => {
		setFormData({ ...formData, [e.target.name]: e.target.checked });
		setChangedData(prevState => ({ ...prevState, [e.target.name]: e.target.checked }));
	};

	const handleImage = (e: any) => {
		setChangedData(prevState => ({ ...prevState, image: e }));
		setFormData({ ...formData, image: e });
	};

	// const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
	// 	e.preventDefault();

	// 	if (type === 'update') {
	// 		trigger({ path, id, body: changedData });
	// 		return;
	// 	} else {
	// 		trigger(formData);
	// 	}
	// };

	const getFieldValue = (name: string) => {
		const parentProperty = name?.split('.')[0];
		const childProperty = name?.split('.')[1];
		const value =
			name?.includes('.') && formData[parentProperty]
				? formData[parentProperty][childProperty]
				: formData[name];

		return value;
	};

	const getOnChangeHandler = (type: string) => {
		switch (type) {
			case 'image':
				return handleImage;
			case 'switch':
				return handleSwitch;
			case 'checkbox':
				return handleSwitch;
			default:
				return handleChange;
		}
	};

	return sections.map((section: any, i: number) => (
		<FormDivision
			key={i}
			borderWidth={0}
			p={0}
			bg='transparent'
			_dark={{ bg: 'transparent' }}>
			{section?.map((item: any, i: number) => (
				<FormItem
					item={item}
					key={i}>
					{(!item?.renderCondition || item?.renderCondition(formData)) && (
						<FormInput
							isRequired={item?.isRequired || false}
							name={item?.name}
							label={item?.label}
							type={item?.type}
							value={getFieldValue(item?.name)}
							onChange={getOnChangeHandler(item?.type)}
							model={item?.model}
							placeholder={item?.placeholder}
							options={item?.options}
						/>
					)}
				</FormItem>
			))}
		</FormDivision>
	));
};

export default FormContent;
