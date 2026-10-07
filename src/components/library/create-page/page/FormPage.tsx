'use client';

import { FC, useState, useMemo } from 'react';

import {
	FormDivision,
	FormItem,
	FormInput,
	useCustomToast,
	useRedirect,
	FormSection,
	CreateNav,
	CreateBody,
	getOnChangeHandler as resolveOnChangeHandler,
	getFieldValue,
} from '../..';
import { withFormulaValues } from '../../functions/formula';
import { pagePath } from '../../config/lib/constants/panel';

type FormPageType = {
	formData: any;
	setFormData: any;
	trigger: any;
	result: any;
	path: string;
	data: any[];
	title: string;
	type?: 'add' | 'update';
	id?: string;
	useCommonApi?: boolean;
};

const FormPage: FC<FormPageType> = ({
	formData,
	setFormData,
	trigger,
	result,
	path,
	data,
	title,
	type,
	id,
	useCommonApi,
}) => {
	const { isSuccess, isLoading, isError, error } = result;
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

	// Formula inputs read the form with every formula calculated (one can use another).
	const calculated = useMemo(() => withFormulaValues(formData, data), [formData, data]);

	useRedirect({ isSuccess, isLoading, path: pagePath(path) });
	useCustomToast({
		successText: type == 'update' ? 'Information Updated Successfully' : 'Item added successfully',
		isSuccess,
		isError,
		isLoading: isLoading,
		error: error,
	});

	const handleSubmit = (e: any) => {
		e.preventDefault();
		if (type === 'update') {
			trigger({ path, id, body: changedData });
			return;
		} else {
			if (useCommonApi) {
				trigger({ path, body: formData });
			} else {
				trigger(formData);
			}
		}
	};

	// WO-12: was a smaller local copy of functions/getOnChangeHandler.ts, missing
	// image-array/nested-image/nested-string/nested-select/nested-data-menu/icon/
	// video — those types silently broke on this shell. Both shells now call the
	// one shared resolver.
	const getOnChangeHandler = (type: string, key?: string) =>
		resolveOnChangeHandler({ type, key, formData, setFormData, setChangedData });

	return (
		<form onSubmit={handleSubmit}>
			<CreateNav
				isLoading={isLoading}
				title={`${title}`}
				path={path}
			/>
			<CreateBody>
				<FormSection>
					{sections.map((section: any, i: number) => (
						<FormDivision key={i}>
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
											value={getFieldValue({ name: item?.name, formData })}
											onChange={getOnChangeHandler(item?.type, item?.name)}
											model={item?.model}
											placeholder={item?.placeholder}
											options={item?.options}
											dataModel={item?.dataModel}
											item={item}
											formData={item?.type === 'formula' ? calculated : formData}
										/>
									)}
								</FormItem>
							))}
						</FormDivision>
					))}
				</FormSection>
			</CreateBody>
		</form>
	);
};

export default FormPage;
