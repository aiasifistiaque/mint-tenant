'use client';

import { FC, useEffect, useState } from 'react';

import {
	useCustomToast,
	useFormData,
	useUpdateByIdMutation,
	useGetByIdToEditQuery,
	EditorForm,
	EditorNav,
	Column,
} from '../..';
import { useParams } from 'next/navigation';
import { Flex } from '@chakra-ui/react';

type FormPageType = {
	data: any;
};

const ContentEditorPage: FC<FormPageType> = ({ data: dataFields }) => {
	const { title, path, fields, key } = dataFields;
	const { id } = useParams<{ id: string }>();

	const { data, refetch } = useGetByIdToEditQuery({ path: path, id: id }, { skip: !id });

	const [formData, setFormData] = useFormData<any>(fields, data);
	const [changedData, setChangedData] = useState<any>({});

	const [trigger, result] = useUpdateByIdMutation();
	const { isSuccess, isLoading, isError, error } = result;

	const handleSubmit = (e: any) => {
		e.preventDefault();
		trigger({ path, id, body: changedData });
	};

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if ((event.ctrlKey || event.metaKey) && event.key === 's') {
				event.preventDefault();
				// Ensure changedData is not empty and not loading before submitting
				if (Object.keys(changedData).length > 0 && !isLoading) {
					handleSubmit(event);
				}
			}
		};

		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [changedData, isLoading, handleSubmit]); // Add dependencies

	useEffect(() => {
		if (!isLoading && isSuccess) {
			refetch();
			setChangedData({});
		}
	}, [result]);

	useCustomToast({
		successText: 'Content Saved Successfully',
		isSuccess,
		isError,
		isLoading: isLoading,
		error: error,
	});

	return (
		<Column
			onSubmit={handleSubmit}
			as={'form'}
			maxH='100vh'
			overflowY='hidden'
			w='100%'>
			<EditorNav
				isDisabled={isLoading}
				isLoading={isLoading}
				title={data?.[title] || 'Document'}
				path={path}
			/>
			<Flex
				mt='44px'
				w='full'>
				<EditorForm
					formData={formData}
					fields={fields}
					setFormData={setFormData}
					setChangedData={setChangedData}
					dataKey={key}
				/>
			</Flex>
		</Column>
	);
};

export default ContentEditorPage;
