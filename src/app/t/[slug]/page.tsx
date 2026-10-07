'use client';
import { NextPage } from 'next';
import { use } from 'react';
import { ServerPage } from '@/components/library';

/**
 * A tenant project's table (tenant panel only — see pagePath in
 * config/lib/constants/panel.ts). The same generic page as /[slug]; the prefix
 * keeps a project route from colliding with one of the admin's own pages.
 */
const ProjectTablePage: NextPage<any> = ({ params }) => {
	const { slug }: any = use(params);
	return <ServerPage route={slug} />;
};

export default ProjectTablePage;
