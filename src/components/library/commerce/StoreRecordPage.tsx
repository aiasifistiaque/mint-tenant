'use client';

import { FC } from 'react';
import { Badge } from '@chakra-ui/react';
import RecordView from '@/app/view/_components/RecordView';
import { useGetByIdQuery } from '../store/services/commonApi';
import type { CommerceView } from '../store/services/commerceApi';
import { ProductStock, StockLines } from './stock';

/**
 * A store model's record page (backend docs/ecommerce): the generic record
 * page with the store's own tab first — a product's stock by outlet, an
 * adjustment's or transfer's items and actions. Others are the generic page.
 */

const STATUS_COLOR: Record<string, string> = { draft: 'gray', applied: 'green', sent: 'orange', received: 'green', cancelled: 'red' };

const Lines: FC<{ kind: 'adjustment' | 'transfer'; slug: string; id: string; store: CommerceView }> = ({ kind, slug, id, store }) => {
	const { data } = useGetByIdQuery({ path: slug, id });
	const record = data?.doc || data;
	return (
		<RecordView
			slug={slug}
			id={id}
			badge={record?.status ? <Badge colorPalette={STATUS_COLOR[record.status] || 'gray'}>{record.status}</Badge> : undefined}
			tabs={[{ value: 'items', label: 'Items', content: record ? <StockLines kind={kind} record={record} store={store} /> : null }]}
		/>
	);
};

/** The store's key for this page's route, or null when it isn't one of the store's. */
export const storeKeyOf = (store: CommerceView | undefined, slug: string) =>
	store ? Object.keys(store.installed).find(k => store.installed[k]?.route === slug) || null : null;

const StoreRecordPage: FC<{ slug: string; id: string; store: CommerceView }> = ({ slug, id, store }) => {
	const key = storeKeyOf(store, slug);
	if (key === 'product')
		return (
			<RecordView
				slug={slug}
				id={id}
				tabs={[{ value: 'in-stock', label: 'In stock', content: <ProductStock id={id} store={store} /> }]}
			/>
		);
	if (key === 'adjustment' || key === 'transfer')
		return (
			<Lines
				kind={key}
				slug={slug}
				id={id}
				store={store}
			/>
		);
	return (
		<RecordView
			slug={slug}
			id={id}
		/>
	);
};

export default StoreRecordPage;
