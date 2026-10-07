'use client';

import { FC, useState } from 'react';

import {
	FormMain,
	useCustomToast,
	useRedirect,
	CreateNav,
	CreateBody,
	usePostMutation,
	useFormData,
	FormSection,
	ColorMode,
} from '../..';
import { pagePath } from '../../config/lib/constants/panel';

type FormPageType = {
	data: any;
};

const AddItemPage: FC<FormPageType> = ({ data }) => {
	const { title, path, fields } = data;

	const [formData, setFormData] = useFormData(fields);

	const [trigger, result] = usePostMutation();

	const { isSuccess, isLoading, isError, error } = result;
	const [changedData, setChangedData] = useState({});

	useRedirect({ isSuccess, isLoading, path: pagePath(path) });
	useCustomToast({
		successText: 'Item added successfully',
		isSuccess,
		isError,
		isLoading: isLoading,
		error: error,
	});

	const handleSubmit = (e: any) => {
		e.preventDefault();
		trigger({ path, body: formData } as any);
	};

	return (
		<form onSubmit={handleSubmit}>
			<CreateNav
				isLoading={isLoading}
				title={title}
				path={path}
			/>
			<CreateBody>
				<FormSection>
					<FormMain
						formData={formData}
						fields={fields}
						setFormData={setFormData}
						setChangedData={setChangedData}
					/>
				</FormSection>
			</CreateBody>
			<ColorMode />
		</form>
	);
};

export default AddItemPage;
