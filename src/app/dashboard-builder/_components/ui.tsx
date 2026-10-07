'use client';

import { FC } from 'react';
import { Link } from '@chakra-ui/react';
import { ExternalLink } from 'lucide-react';
import { docsPath } from '@/components/library/config/lib/constants/panel';

/** The dashboard builder guide. Section ids are the anchors below. */
export const GUIDE = docsPath('/docs/dashboard-builder');

/** A link into the guide, opened beside the builder rather than in place of it. */
export const DocLink: FC<{ section: string; label?: string }> = ({ section, label = 'How this works' }) => (
	<Link
		href={`${GUIDE}#${section}`}
		target='_blank'
		rel='noopener noreferrer'
		display='inline-flex'
		alignItems='center'
		gap={1}
		fontSize='xs'
		color='fg.muted'
		flexShrink={0}
		_hover={{ color: 'fg', textDecoration: 'underline' }}>
		{label}
		<ExternalLink size={11} />
	</Link>
);
