'use client';

import { Box, Skeleton } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/library';
import { projectHref } from '@/components/library/config/lib/constants/panel';
import { useWorkspace } from '@/components/library/tenant';
import { useGetMailAccountsQuery } from '@/components/library/store/services/tenantApi';
import ConnectDialog from '../_components/ConnectDialog';

/** A phone's "Connect an account": the same form as the window, as a page of its own. */
export default function ConnectEmailPage() {
	const router = useRouter();
	const { can, project } = useWorkspace();
	const { data } = useGetMailAccountsQuery(undefined, { skip: !can('manage-projects') });

	return (
		<Layout
			title='Connect an email account'
			path='email-accounts'>
			<Box
				w='full'
				maxW='760px'
				mx='auto'>
				{!data ? (
					<Skeleton h='320px' />
				) : (
					<ConnectDialog
						asPage
						open
						account={null}
						ports={data.ports}
						projectName={project?.name || ''}
						onClose={() => router.replace(projectHref('/email-accounts'))}
					/>
				)}
			</Box>
		</Layout>
	);
}
