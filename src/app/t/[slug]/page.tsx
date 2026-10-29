'use client';
import { NextPage } from 'next';
import { Suspense, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { ServerPage } from '@/components/library';
import { useWorkspace } from '@/components/library/tenant';
import ContentsScreen from '../_contents/ContentsScreen';
import SeoHealth from '../_seo/SeoHealth';

/**
 * A tenant project's table (tenant panel only — see pagePath in
 * config/lib/constants/panel.ts). The same generic page as /[slug]; the prefix
 * keeps a project route from colliding with one of the admin's own pages.
 * A website's Contents (web-contents) opens by page and type instead
 * (docs/cms D1) — its table is `?view=table`.
 */
const KIT_CONTENTS = 'web-contents';
const KIT_SEO = 'seo';

const Table = ({ slug }: { slug: string }) => {
	const params = useSearchParams();
	const { project } = useWorkspace();
	if (slug === KIT_CONTENTS && (project?.type === 'website' || project?.type === 'ecommerce') && params.get('view') !== 'table') return <ContentsScreen />;
	// A website's SEO table has the site's SEO health above it (docs/seo SEO-03).
	if (slug === KIT_SEO && (project?.type === 'website' || project?.type === 'ecommerce'))
		return (
			<ServerPage
				route={slug}
				above={<SeoHealth />}
			/>
		);
	return <ServerPage route={slug} />;
};

const ProjectTablePage: NextPage<any> = ({ params }) => {
	const { slug }: any = use(params);
	return (
		<Suspense>
			<Table slug={slug} />
		</Suspense>
	);
};

export default ProjectTablePage;
