'use client';

import { useParams } from 'next/navigation';
import RecordView from '../../_components/RecordView';

/** Any record's page: overview, linked-record tabs and history. See RecordView. */
const ViewPage = () => {
	const { id, slug }: { id: string; slug: string } = useParams();
	return (
		<RecordView
			slug={slug}
			id={id}
		/>
	);
};

export default ViewPage;
