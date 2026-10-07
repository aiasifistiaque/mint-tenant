'use client';

import { useGetSelfQuery } from '../store';
import { IS_TENANT_PANEL, getProjectSlug, rememberProject } from '../config/lib/constants/panel';
import type { OrgRef, TenantProject } from '../store/services/tenantApi';
import { can } from './can';

/**
 * Where the tenant panel is working: the account, its organization (and the
 * others it can switch to), its role, and the project this tab's address is in
 * (/<project>/<page>, panel.ts).
 * Read from `auth/self`, which the tenant API fills with all of it.
 */
export const useWorkspace = ({ skip = false }: { skip?: boolean } = {}) => {
	const { data: self, isLoading, isFetching } = useGetSelfQuery({}, { skip: skip || !IS_TENANT_PANEL });
	const projects: TenantProject[] = self?.projects || [];
	const slug = getProjectSlug();
	const project = projects.find(p => p.publicSlug === slug) || null;
	const permissions: string[] = self?.permissions || [];
	return {
		self,
		isLoading,
		isFetching,
		organization: self?.organization || null,
		organizations: (self?.organizations || []) as OrgRef[],
		role: self?.role || null,
		permissions,
		can: (key: string) => can(permissions, key),
		projects,
		project,
		/** The address names a project this account can't see (deleted, archived, another organization). */
		staleProject: !!slug && !!self && !project,
	};
};

/**
 * Opens a project (by its publicSlug): the panel starts over at its dashboard,
 * /<project>, or at `page` inside it ('/model-builder'). A full load, so
 * nothing cached from another project carries over.
 */
export const openProject = (slug: string, page = '') => {
	rememberProject(slug);
	window.location.href = `/${slug}${page}`;
};

/** Back to the organization, no project open. */
export const leaveProject = (to = '/projects') => {
	rememberProject(null);
	window.location.href = to;
};
