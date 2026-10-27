'use client';

import { useParams } from 'next/navigation';
import { useWorkspace } from '@/components/library/tenant';
import RecordView from '../../_components/RecordView';
import SeoRecordPage from '../../../t/_seo/SeoRecordPage';

/**
 * Any record's page: overview, linked-record tabs and history. See RecordView.
 * A website's SEO record has its own (docs/seo SEO-20).
 */
const ViewPage = () => {
	const { id, slug }: { id: string; slug: string } = useParams();
	const { project } = useWorkspace();
	if (slug === 'seo' && project?.type === 'website') return <SeoRecordPage id={id} />;
	return (
		<RecordView
			slug={slug}
			id={id}
		/>
	);
};

export default ViewPage;
