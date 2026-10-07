'use client';

import { use } from 'react';
import { NextPage } from 'next';
import CreateRecordPage from '@/components/library/pages/CreateRecordPage';

/** A project table's "add a record" page — /<project>/<route>/create (createPath). */
const ProjectCreatePage: NextPage<any> = ({ params }) => {
	const { slug }: any = use(params);
	return <CreateRecordPage route={slug} />;
};

export default ProjectCreatePage;
