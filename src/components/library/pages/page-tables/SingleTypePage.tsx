'use client';

import { FC, useEffect } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@chakra-ui/react';
import { Plus } from 'lucide-react';
import Layout from '../../nav/Layout';
import { useGetAllQuery } from '../../store';
import { DetailSkeleton, EmptyState } from '../../cl/States';
import { createPath } from '../../config/lib/constants/panel';
import { viewHrefOf } from '../../components/view/utils/record-link/linked';

/**
 * A single type's page (backend docs/cms D2): it holds one record, so instead
 * of a table it opens that record's page — or, before there is one, offers to
 * fill it in.
 */
const SingleTypePage: FC<{ route: string; title?: string }> = ({ route, title = '' }) => {
	const router = useRouter();
	const { data, isLoading } = useGetAllQuery({ page: 1, limit: 1, path: route });
	const id = data?.doc?.[0]?._id;
	useEffect(() => {
		if (id) router.replace(viewHrefOf(route, id));
	}, [id, route, router]);

	return (
		<Layout
			title={title}
			path={route}>
			{isLoading || id ? (
				<DetailSkeleton />
			) : (
				<EmptyState
					title={`${title || 'This'} isn’t filled in yet`}
					description='It holds one record — fill it in once, then change it whenever you need to.'
					action={
						<Button
							size='sm'
							asChild>
							<NextLink href={createPath(route)}>
								<Plus size={14} />
								Fill it in
							</NextLink>
						</Button>
					}
				/>
			)}
		</Layout>
	);
};

export default SingleTypePage;
