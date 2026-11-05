'use client';

import { FC, useEffect, useState } from 'react';
import { Text } from '@chakra-ui/react';
import { useGetDiscountPreviewQuery } from '../../../store/services/commerceApi';
import { linkedId } from '../../../functions/linkedFill';

/**
 * A store discount's form (backend docs/ecommerce DISCOUNTS.md DS11): what saving it would do, worked out by the
 * store as it's filled in — “Saving gives 10% off to 48 products — 3 of them keep a bigger discount.” — or why it
 * can't be saved (an end date passed). Only on the store's Discounts form; renders nothing elsewhere.
 */
const ids = (v: any) => (Array.isArray(v) ? v : v ? [v] : []).map(linkedId).filter(Boolean);

const DiscountNote: FC<{ fields: any[]; formData: any }> = ({ fields, formData }) => {
	const names = new Set((fields || []).map((f: any) => f?.name));
	const isDiscount = names.has('percent') && names.has('subCategories') && names.has('collections');
	const discount = isDiscount
		? {
				percent: formData?.percent,
				status: formData?.status || 'active',
				startsAt: formData?.startsAt || '',
				endsAt: formData?.endsAt || '',
				products: ids(formData?.products),
				categories: ids(formData?.categories),
				collections: ids(formData?.collections),
				subCategories: formData?.subCategories !== false,
				name: formData?.name || '',
		  }
		: null;
	const key = JSON.stringify(discount);
	// Asked again a moment after the last change, not on every keystroke.
	const [asked, setAsked] = useState(key);
	useEffect(() => {
		const t = setTimeout(() => setAsked(key), 500);
		return () => clearTimeout(t);
	}, [key]);
	const picked = !!discount && (discount.products.length + discount.categories.length + discount.collections.length > 0) && Number(discount.percent) > 0;
	const { data } = useGetDiscountPreviewQuery({ id: formData?._id, discount: JSON.parse(asked || 'null') }, { skip: !picked || asked !== key });
	if (!picked || !data?.text) return null;
	return (
		<Text
			fontSize='12.5px'
			color={data.problem ? 'red.600' : 'fg.muted'}
			px={1}
			pb={2}>
			{data.text}
		</Text>
	);
};

export default DiscountNote;
