'use client';

import { IS_TENANT_PANEL } from '../../config/lib/constants/panel';
import { useWorkspace } from '../../tenant/useWorkspace';

/**
 * What the top of the media library is called: "All Media" in the super-admin
 * panel; in a tenant project, whose library it is (WO-23) — the project's own,
 * or the organization's shared one.
 */
export const useMediaRoot = (): string => {
	const { project, organization } = useWorkspace();
	if (!IS_TENANT_PANEL || !project) return 'All Media';
	return project.mediaScope === 'organization' ? `${organization?.name || 'Organization'} · shared media` : `${project.name} media`;
};
