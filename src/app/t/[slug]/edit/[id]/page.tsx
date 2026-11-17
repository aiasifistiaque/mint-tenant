'use client';

import { use } from 'react';
import { NextPage } from 'next';
import EditRecordPage from '@/components/library/pages/EditRecordPage';

/** A project record's edit page — /<project>/<route>/edit/<id> (editPath; docs/multi-page-forms). */
const ProjectEditPage: NextPage<any> = ({ params }) => {
	const { slug, id }: any = use(params);
	return (
		<EditRecordPage
			route={slug}
			id={decodeURIComponent(id)}
		/>
	);
};

export default ProjectEditPage;
