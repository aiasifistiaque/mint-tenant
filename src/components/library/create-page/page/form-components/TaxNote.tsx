'use client';

import { FC, useRef } from 'react';
import { Text } from '@chakra-ui/react';
import { useGetTaxPreviewQuery } from '../../../store/services/commerceApi';
import { linkedId } from '../../../functions/linkedFill';

/**
 * A store category's form (backend docs/ecommerce TX6): once its Tax / VAT is changed, a note says how many of
 * its products saving will give that tax to. Only on a saved category whose tax differs from what it held when
 * opened, and only while the store's category-tax automation is on. Renders nothing otherwise.
 */
const TaxNote: FC<{ fields: any[]; formData: any }> = ({ fields, formData }) => {
	const isCategory = (fields || []).some((f: any) => f?.name === 'taxRate') && (fields || []).some((f: any) => f?.name === 'posStatus');
	const id: string | undefined = formData?._id;
	const first = useRef<{ id?: string; tax: string | null }>({ tax: null });
	const tax = linkedId(formData?.taxRate) || null;
	if (id && first.current.id !== id) first.current = { id, tax };
	const changed = isCategory && !!id && !!tax && tax !== first.current.tax;
	const { data } = useGetTaxPreviewQuery({ category: id || '', tax: tax || '' }, { skip: !changed });
	if (!changed || !data?.on || !data.products) return null;
	return (
		<Text
			fontSize='12.5px'
			color='fg.muted'
			px={1}
			pb={2}>
			Saving gives this tax to {data.products} product{data.products === 1 ? '' : 's'} in this category, and their price after tax follows.
		</Text>
	);
};

export default TaxNote;
