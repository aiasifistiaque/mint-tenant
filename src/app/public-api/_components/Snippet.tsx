'use client';

import { FC, useState } from 'react';
import { Box, Button } from '@chakra-ui/react';
import { Copy } from 'lucide-react';

/** Code to paste, with a Copy button — on the API's Overview and Customer sign-in. */
const Snippet: FC<{ code: string; label: string }> = ({ code, label }) => {
	const [copied, setCopied] = useState(false);
	return (
		<Box
			position='relative'
			borderWidth='1px'
			borderColor='border'
			borderRadius='md'
			bg='bg.subtle'>
			<Box
				as='pre'
				m={0}
				p={3}
				pr={12}
				fontSize='12px'
				fontFamily='mono'
				whiteSpace='pre-wrap'
				wordBreak='break-all'
				aria-label={label}>
				{code}
			</Box>
			<Button
				position='absolute'
				top={1.5}
				right={1.5}
				size='xs'
				variant='ghost'
				aria-label={`Copy ${label}`}
				onClick={() => {
					navigator.clipboard?.writeText(code);
					setCopied(true);
					setTimeout(() => setCopied(false), 1500);
				}}>
				{copied ? 'Copied' : <Copy size={14} />}
			</Button>
		</Box>
	);
};

export default Snippet;
