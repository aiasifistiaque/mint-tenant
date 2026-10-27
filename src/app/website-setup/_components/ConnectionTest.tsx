'use client';

import { FC, useState } from 'react';
import { Badge, Box, Button, Flex, Input, Text } from '@chakra-ui/react';
import { CircleAlert, CircleCheck, CircleDashed, CircleX } from 'lucide-react';
import { useTestSiteConnectionMutation, type SiteConnection } from '@/components/library/store/services/tenantApi';

/**
 * Website setup → Existing website → Test connection (docs/site-connect):
 * the owner's live page, checked now — its domain, the snippet in its HTML,
 * visits arriving (the snippet running in browsers), and that page's SEO.
 */

const TONE = {
	ok: { color: 'green.fg', icon: CircleCheck },
	warning: { color: 'orange.fg', icon: CircleAlert },
	missing: { color: 'red.fg', icon: CircleX },
	idle: { color: 'fg.muted', icon: CircleDashed },
} as const;

const errorOf = (e: any) => e?.data?.message || e?.error || 'Couldn’t run the test — try again.';

const Result: FC<{ r: SiteConnection }> = ({ r }) => (
	<Box
		mt={3}
		borderWidth='1px'
		borderColor='border'
		borderRadius='md'
		overflow='hidden'>
		<Flex
			px={4}
			py={3}
			gap={2}
			align='center'
			wrap='wrap'>
			<Badge
				size='sm'
				variant='subtle'
				colorPalette={r.connected ? 'green' : r.items.some(i => i.status === 'missing') ? 'red' : 'orange'}>
				{r.connected ? 'Connected' : r.items.some(i => i.status === 'missing') ? 'Not connected' : 'Almost'}
			</Badge>
			<Text
				fontSize='12.5px'
				color='fg.muted'
				minW={0}
				wordBreak='break-all'>
				{r.url || r.message}
			</Text>
		</Flex>
		{r.items.map(i => {
			const t = TONE[i.status];
			const Icon = t.icon;
			return (
				<Flex
					key={i.key}
					gap={3}
					px={4}
					py={3}
					borderTopWidth='1px'
					borderColor='border.muted'
					align='flex-start'>
					<Box
						color={t.color}
						mt='2px'
						flexShrink={0}>
						<Icon size={16} />
					</Box>
					<Box minW={0}>
						<Text
							fontSize='13px'
							fontWeight='600'>
							{i.label}
						</Text>
						<Text
							fontSize='12.5px'
							color='fg.muted'
							wordBreak='break-word'>
							{i.message}
						</Text>
					</Box>
				</Flex>
			);
		})}
	</Box>
);

const ConnectionTest: FC<{ domain: string }> = ({ domain }) => {
	const [url, setUrl] = useState(domain ? `https://${domain}/` : '');
	const [run, { data, isLoading, error, reset }] = useTestSiteConnectionMutation();
	return (
		<Box>
			<Flex
				gap={2}
				direction={{ base: 'column', sm: 'row' }}>
				<Input
					size='sm'
					fontFamily='mono'
					value={url}
					placeholder='https://www.your-site.com/about'
					onChange={e => {
						setUrl(e.target.value);
						if (data) reset();
					}}
					onKeyDown={e => e.key === 'Enter' && !isLoading && run({ url })}
				/>
				<Button
					size='sm'
					flexShrink={0}
					loading={isLoading}
					loadingText='Testing…'
					onClick={() => run({ url })}>
					Test connection
				</Button>
			</Flex>
			{error ? (
				<Text
					mt={2}
					fontSize='12.5px'
					color='red.fg'>
					{errorOf(error)}
				</Text>
			) : data ? (
				<Result r={data} />
			) : null}
		</Box>
	);
};

export default ConnectionTest;
