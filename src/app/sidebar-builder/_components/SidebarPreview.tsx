'use client';

import { FC, useState } from 'react';
import { Box, Flex, Stack, Text } from '@chakra-ui/react';
import { Lock } from 'lucide-react';
import { SidebarItem, sizes } from '@/components/library';
import { SidebarSection } from '@/components/library/nav/sidebar/sidebar-components';
import { Section } from './draft';

/**
 * The sidebar as it will look once saved, drawn with the sidebar's own
 * components so it can't drift from the real thing.
 *
 * It follows the same rules as GET /sidebar/crm/server: hidden sections and
 * hidden pages are left out, and so is a section with no visible pages. Pages
 * behind a permission are shown with a lock — who sees them depends on role.
 */
const SidebarPreview: FC<{ sections: Section[] }> = ({ sections }) => {
	const [closed, setClosed] = useState<Record<string, boolean>>({});
	const shown = sections
		.filter(s => s.isActive)
		.map(s => ({ ...s, items: s.items.filter(i => i.isActive && i.name.trim()) }))
		.filter(s => s.items.length);

	return (
		<Box
			w={sizes.SIDEBAR_WIDTH}
			maxW='full'
			mx='auto'
			px={3}
			py={3}
			borderRadius='md'
			borderWidth='1px'
			borderColor='border'
			bg='sidebar.light'
			_dark={{ bg: 'sidebar.dark' }}>
			<SidebarItem path='__preview-dashboard'>Dashboard</SidebarItem>
			{shown.map(s => (
				<SidebarSection
					key={s.key}
					title={s.name || 'Untitled section'}
					icon={s.icon || 'folder'}
					isOpen={!closed[s.key]}
					onToggle={() => setClosed(c => ({ ...c, [s.key]: !c[s.key] }))}>
					<Stack gap={0.5}>
						{s.items.map(i => (
							<Flex
								key={i.key}
								align='center'
								gap={1}
								title={i.permissionProtected ? `Only roles with “${i.permission}” see this` : i.tooltip || undefined}>
								<Box
									flex='1'
									minW={0}>
									<SidebarItem path={`__preview-${i.key}`}>{i.name}</SidebarItem>
								</Box>
								{i.permissionProtected && (
									<Box
										color='fg.subtle'
										flexShrink={0}>
										<Lock size={10} />
									</Box>
								)}
							</Flex>
						))}
					</Stack>
				</SidebarSection>
			))}
			{!shown.length && (
				<Text
					fontSize='xs'
					color='fg.muted'
					mt={3}>
					Nothing visible yet — add a section with at least one visible page.
				</Text>
			)}
		</Box>
	);
};

export default SidebarPreview;
