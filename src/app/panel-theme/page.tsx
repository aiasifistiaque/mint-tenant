'use client';

import { useRouter } from 'next/navigation';
import { Layout } from '@/components/library';
import { EmptyState } from '@/components/library/cl';
import { useWorkspace } from '@/components/library/tenant';
import PanelThemeDialog from '@/components/library/tenant/PanelThemeDialog';

/**
 * The panel theme, reached by address (the ⌘K search, a link). The sidebar
 * opens the same dialog in place (nav/sidebar/sidebarModals.tsx); here it
 * opens over the page, and closing it goes back where you came from.
 */
export default function PanelThemePage() {
	const router = useRouter();
	const { project, can, isLoading } = useWorkspace();
	const allowed = can('manage-projects') || can('invite-to-projects');

	return (
		<Layout
			title='Panel theme'
			path='panel-theme'>
			{!isLoading && (!project || !allowed) ? (
				<EmptyState
					title={!project ? 'Open a project' : 'The panel theme is set by people who manage the project'}
					description={!project ? 'A panel theme belongs to a project.' : 'Ask your organization’s owner or an admin.'}
				/>
			) : (
				<PanelThemeDialog
					open={!isLoading}
					onClose={() => (window.history.length > 1 ? router.back() : router.push('/'))}
				/>
			)}
		</Layout>
	);
}
