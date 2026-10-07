'use client';

import { FC, useState } from 'react';
import { Box, Button, Flex } from '@chakra-ui/react';
import { Copy } from 'lucide-react';
import { Endpoint, exampleRequests } from './api';

/**
 * An endpoint as a request to paste — curl or fetch (api.ts exampleRequests).
 * On the tenant's API reference and in the studio's Public API tab.
 */
const ExampleRequest: FC<{ base: string; e: Endpoint }> = ({ base, e }) => {
	const [as, setAs] = useState<'curl' | 'fetch'>('curl');
	const [copied, setCopied] = useState(false);
	const code = exampleRequests(base, e)[as];
	return (
		<Box
			borderWidth='1px'
			borderColor='border'
			borderRadius='md'
			bg='bg.subtle'
			overflow='hidden'>
			<Flex
				align='center'
				gap={1}
				px={2}
				py={1}
				borderBottomWidth='1px'
				borderColor='border.muted'>
				{(['curl', 'fetch'] as const).map(k => (
					<Button
						key={k}
						size='2xs'
						variant={as === k ? 'subtle' : 'ghost'}
						onClick={() => setAs(k)}>
						{k === 'curl' ? 'curl' : 'fetch (JavaScript)'}
					</Button>
				))}
				<Box flex={1} />
				<Button
					size='2xs'
					variant='ghost'
					aria-label='Copy the example'
					onClick={() => {
						navigator.clipboard?.writeText(code);
						setCopied(true);
						setTimeout(() => setCopied(false), 1500);
					}}>
					{copied ? 'Copied' : <Copy size={12} />}
				</Button>
			</Flex>
			<Box
				as='pre'
				m={0}
				p={3}
				fontSize='12px'
				fontFamily='mono'
				whiteSpace='pre-wrap'
				wordBreak='break-all'>
				{code}
			</Box>
		</Box>
	);
};

export default ExampleRequest;
