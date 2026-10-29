'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Skeleton } from '@chakra-ui/react';
import { Layout, useGetSiteContentTypesQuery, useGetSiteContentsQuery } from '@/components/library';
import { projectHref } from '@/components/library/config/lib/constants/panel';
import ContentDialog from '../../_contents/ContentDialog';

/** A phone's "New content": the same form as the window, as a page of its own. */
const NewContent = () => {
	const router = useRouter();
	const page = useSearchParams().get('page') || 'site';
	const { data } = useGetSiteContentsQuery(page);
	const { data: typesData } = useGetSiteContentTypesQuery();
	const back = () => router.replace(projectHref(`/t/web-contents?page=${page}`));

	return (
		<Layout
			title='New content'
			path='web-contents'>
			<Box
				w='full'
				maxW='760px'
				mx='auto'>
				{!data || !typesData ? (
					<Skeleton h='320px' />
				) : (
					<ContentDialog
						asPage
						open
						onClose={back}
						types={typesData.types || []}
						models={typesData.models || []}
						pages={data.pages || []}
						page={page}
						drafts={!!data.drafts}
						onPage={(data.doc || []).filter(c => !c.legacy).map(c => c.type || '')}
						start={typesData.start}
					/>
				)}
			</Box>
		</Layout>
	);
};

export default function Page() {
	return (
		<Suspense fallback={null}>
			<NewContent />
		</Suspense>
	);
}
