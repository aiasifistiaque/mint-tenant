'use client';

import { Flex, Text } from '@chakra-ui/react';
import { Eye } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { IS_TENANT_PANEL } from '../config/lib/constants/panel';
import { useWorkspace } from './useWorkspace';

const hoursLeft = (iso?: string) => {
	if (!iso) return null;
	const h = Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 3_600_000));
	return h <= 1 ? 'within the hour' : `in about ${h} hours`;
};

/**
 * A template preview's reminder (tenant panel, docs/templates T-04): a small
 * pill at the bottom of every page while signed in to the template sandbox,
 * saying this is a throwaway copy and when it goes. Nothing in a real account.
 */
const PreviewBanner = () => {
	const first = (usePathname() || '/').split('/')[1] || '';
	const skip = !IS_TENANT_PANEL || !first || ['auth', 'user-docs', 'preview'].includes(first);
	const { self, project } = useWorkspace({ skip });
	if (skip || !self?.preview) return null;
	const left = hoursLeft(project?.preview?.expiresAt);

	return (
		<Flex
			role='status'
			position='fixed'
			bottom='16px'
			left='50%'
			transform='translateX(-50%)'
			zIndex='toast'
			align='center'
			gap='8px'
			px='14px'
			py='8px'
			maxW='calc(100vw - 32px)'
			borderRadius='full'
			bg='fg'
			color='bg'
			boxShadow='lg'
			pointerEvents='none'>
			<Eye size={14} />
			<Text
				fontSize='13px'
				fontWeight='500'
				color='bg'
				lineClamp={1}>
				Template preview{project?.preview?.from === 'draft' ? ' (draft)' : ''} — a throwaway copy{left ? `, deleted ${left}` : ''}.
			</Text>
		</Flex>
	);
};

export default PreviewBanner;
