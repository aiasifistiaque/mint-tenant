'use client';

import { useParams } from 'next/navigation';
import { useWorkspace } from '@/components/library/tenant';
import RecordView from '../../_components/RecordView';
import SeoRecordPage from '../../../t/_seo/SeoRecordPage';
import StoreRecordPage from '@/components/library/commerce/StoreRecordPage';
import { useGetCommerceSettingsQuery } from '@/components/library/store/services/commerceApi';

/**
 * Any record's page: overview, linked-record tabs and history. See RecordView.
 * A website's SEO record has its own (docs/seo SEO-20); a store's products,
 * adjustments and transfers get their stock tab first (docs/ecommerce EC-05).
 */
const ViewPage = () => {
	const { id, slug }: { id: string; slug: string } = useParams();
	const { project } = useWorkspace();
	const isStore = project?.type === 'ecommerce';
	const { data: store } = useGetCommerceSettingsQuery(undefined, { skip: !isStore });
	if (slug === 'seo' && project?.type === 'website') return <SeoRecordPage id={id} />;
	// A store's page waits for the store, so its own tab doesn't pop in after the generic page.
	if (isStore && !store) return null;
	if (isStore && store?.status === 'ready')
		return (
			<StoreRecordPage
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

export default ViewPage;
