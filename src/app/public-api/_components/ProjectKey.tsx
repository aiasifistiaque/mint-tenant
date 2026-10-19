'use client';

import { FC, useState } from 'react';
import { Box, Button, Flex, Skeleton, Text } from '@chakra-ui/react';
import { RefreshCw } from 'lucide-react';
import { PromptDialog } from '@/components/library';
import { CopyValue, Panel } from '@/components/library/cl';
import GuideLink from '@/components/library/tenant/GuideLink';
import { toaster } from '@/components/ui/toaster';
import { useGetProjectKeyQuery, useRegenerateProjectKeyMutation } from '@/components/library/store/services/apiBuilderApi';
import { apiBase } from './shared';

/**
 * The project key (backend docs/api-builder D14): it names this project on the
 * public API — every call carries `?apiKey=<key>` (or `X-Api-Key`), or the API
 * answers 401 api_key_missing. Fine in a website's code. Regenerate makes a new
 * one and the old one stops at once. On API → Keys and the API Overview.
 */
const ProjectKey: FC<{ canChange: boolean }> = ({ canChange }) => {
	const { data, isLoading } = useGetProjectKeyQuery();
	const [regenerate, regenerating] = useRegenerateProjectKeyMutation();
	const [asking, setAsking] = useState(false);
	const key = data?.apiKey || '';

	return (
		<Panel
			title='Project key'
			subtitle='Every call to the API carries it — it says which project the call is for. It’s fine in your website’s code.'
			actions={
				<>
					<GuideLink section='api-project-key' />
					{canChange && (
						<Button
							size='sm'
							variant='outline'
							disabled={!key}
							onClick={() => setAsking(true)}>
							<RefreshCw size={14} />
							Regenerate
						</Button>
					)}
				</>
			}>
			{isLoading ? (
				<Skeleton h='64px' />
			) : (
				<Flex
					direction='column'
					gap={3}>
					<Box
						fontFamily='mono'
						wordBreak='break-all'>
						<CopyValue value={key} />
					</Box>
					<Box
						p={3}
						borderRadius='md'
						bg='bg.subtle'
						fontSize='12px'
						fontFamily='mono'
						wordBreak='break-all'>
						GET {apiBase()}/
						<Text
							as='span'
							color='fg.muted'
							fontSize='inherit'>
							&lt;route&gt;
						</Text>
						?apiKey={key}
					</Box>
					<Text
						fontSize='12px'
						color='fg.muted'>
						Add it to every address, or send it as the{' '}
						<Text
							as='span'
							fontFamily='mono'
							fontSize='inherit'>
							X-Api-Key
						</Text>{' '}
						header. Without it the API answers 401. Endpoints for server keys still need a secret server key as well.
					</Text>
				</Flex>
			)}
			<PromptDialog
				open={asking}
				onClose={() => setAsking(false)}
				tone='warning'
				title='Make a new project key?'
				description='The current key stops working at once: websites, widgets and apps that use it get 401 until they have the new one. Sites MINT hosts for this project switch by themselves.'
				confirmLabel='Make a new key'
				loading={regenerating.isLoading}
				onConfirm={async () => {
					const res = await regenerate();
					if ('data' in res) {
						toaster.create({ type: 'success', title: 'New project key made', description: 'Put it in every site and app that calls the API.' });
						setAsking(false);
					} else toaster.create({ type: 'error', title: 'Not changed', description: (res.error as any)?.data?.message || 'Try again' });
				}}
			/>
		</Panel>
	);
};

export default ProjectKey;
