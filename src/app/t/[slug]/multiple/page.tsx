'use client';

import { use } from 'react';
import { NextPage } from 'next';
import MultipleEntryPage from '@/components/library/pages/MultipleEntryPage';

/** A project table's "add multiple records" page — /<project>/<route>/multiple (multiplePath). */
const MultiplePage: NextPage<any> = ({ params }) => {
	const { slug }: any = use(params);
	return <MultipleEntryPage route={slug} />;
};

export default MultiplePage;
