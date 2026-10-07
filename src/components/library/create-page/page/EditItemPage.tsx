'use client';

import { FC, useState } from 'react';

import {
	FormMain,
	useCustomToast,
	useRedirect,
	CreateNav,
	CreateBody,
	useFormData,
	FormSection,
	useUpdateByIdMutation,
	useGetByIdToEditQuery,
} from '../..';
import { useParams } from 'next/navigation';
import { pagePath } from '../../config/lib/constants/panel';

type FormPageType = {
	data: any;
};

const EditItemPage: FC<FormPageType> = ({ data: dataFields }) => {
	const { title, path, fields } = dataFields;
	const { id } = useParams<{ id: string }>();

	const { data } = useGetByIdToEditQuery({ path: path, id: id }, { skip: !id });

	const [formData, setFormData] = useFormData<any>(fields, data);
	const [changedData, setChangedData] = useState({});

	const [trigger, result] = useUpdateByIdMutation();
	const { isSuccess, isLoading, isError, error } = result;

	useRedirect({ isSuccess, isLoading, path: pagePath(path) });
	useCustomToast({
		successText: 'Item Updated successfully',
		isSuccess,
		isError,
		isLoading: isLoading,
		error: error,
	});

	const handleSubmit = (e: any) => {
		e.preventDefault();
		trigger({ path, id, body: changedData });
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
		</form>
	);
};

export default EditItemPage;
