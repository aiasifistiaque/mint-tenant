'use client';

import { useAppDispatch } from '../hooks';
import { refreshAuth, useGetSelfQuery, useSwitchOrganizationMutation } from '../store';
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
	// A project's own role (WO-47) decides what this account can do inside it.
	const permissions: string[] = project?.permissions || self?.permissions || [];
	const organizations = (self?.organizations || []) as OrgRef[];
	return {
		self,
		isLoading,
		isFetching,
		organization: self?.organization || null,
		organizations,
		role: self?.role || null,
		permissions,
		can: (key: string) => can(permissions, key),
		projects,
		project,
		/** The address names a project this account can't see (deleted, archived, another organization). */
		staleProject: !!slug && !!self && !project,
		/** …and the organization it's in, when it's one of this account's others (WO-47). */
		projectElsewhere: (!!slug && !!self && !project && organizations.find(o => o._id !== self?.organization?._id && o.projects?.some(p => p.publicSlug === slug))) || null,
	};
};

/**
 * Opens a project in any of this account's organizations (WO-47): one in
 * another organization trades the token for one there first
 * (POST /org/switch/:id), then opens it.
 */
export const useOpenAnyProject = () => {
	const { organization } = useWorkspace();
	const dispatch = useAppDispatch();
	const [switchOrg, switching] = useSwitchOrganizationMutation();
	const open = async (orgId: string, slug: string, page = '') => {
		if (!organization || orgId === organization._id) return openProject(slug, page);
		const res = await switchOrg(orgId);
		if ('data' in res && res.data?.token) {
			dispatch(refreshAuth(res.data.token));
			openProject(slug, page);
		}
	};
	return { open, opening: switching.isLoading ? switching.originalArgs : null };
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
