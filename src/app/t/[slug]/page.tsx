'use client';
import { NextPage } from 'next';
import { Suspense, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { ServerPage } from '@/components/library';
import { useWorkspace } from '@/components/library/tenant';
import ContentsScreen from '../_contents/ContentsScreen';

/**
 * A tenant project's table (tenant panel only — see pagePath in
 * config/lib/constants/panel.ts). The same generic page as /[slug]; the prefix
 * keeps a project route from colliding with one of the admin's own pages.
 * A website's Contents (web-contents) opens by page and type instead
 * (docs/cms D1) — its table is `?view=table`.
 */
const KIT_CONTENTS = 'web-contents';

const Table = ({ slug }: { slug: string }) => {
	const params = useSearchParams();
	const { project } = useWorkspace();
	if (slug === KIT_CONTENTS && project?.type === 'website' && params.get('view') !== 'table') return <ContentsScreen />;
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
