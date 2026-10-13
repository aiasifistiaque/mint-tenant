'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { HOME, IS_TENANT_PANEL, docsPath, getProjectSlug, rememberProject } from '../config/lib/constants/panel';
import { useAppDispatch } from '../hooks';
import { refreshAuth, useSwitchOrganizationMutation } from '../store';
import { ADMIN_ONLY_PAGES, TENANT_ONLY_PAGES } from './pages';
import { useWorkspace } from './useWorkspace';

/**
 * Which panel a page belongs to (mounted once in the root providers):
 * - in the tenant panel the super admin's own pages (pages.ts) go home, and
 *   in the super-admin panel the tenant panel's do;
 * - in the tenant panel a /docs guide opens its user guide (/user-docs);
 * - a project in the address (/<project>/<page>) in another of this account's
 *   organizations switches to that organization (WO-47); one it can't see at
 *   all sends it to its projects; one it can see becomes the browser's last project
 *   whenever this tab is in front, so a link that names no project
 *   (/dashboard) opens this tab's (src/proxy.ts).
 */
const PanelGuard = () => {
	const pathname = usePathname() || '/';
	const router = useRouter();
	const first = pathname.split('/')[1] || '';
	// Signed-out pages (the landing page, sign-in, the public guides) have no account to read.
	const { staleProject, projectElsewhere } = useWorkspace({ skip: !first || first === 'auth' || first === 'user-docs' || !IS_TENANT_PANEL });
	const dispatch = useAppDispatch();
	const [switchOrg] = useSwitchOrganizationMutation();

	useEffect(() => {
		if (IS_TENANT_PANEL && first === 'docs') router.replace(docsPath(`${pathname}${window.location.hash}`));
		else if (IS_TENANT_PANEL ? ADMIN_ONLY_PAGES.has(first) : TENANT_ONLY_PAGES.has(first)) router.replace(HOME);
	}, [first]);

	useEffect(() => {
		if (!IS_TENANT_PANEL || !staleProject) return;
		if (projectElsewhere) {
			// The same address, in the organization the project is in.
			switchOrg(projectElsewhere._id).then(res => {
				if ('data' in res && res.data?.token) {
					dispatch(refreshAuth(res.data.token));
					window.location.reload();
				} else window.location.href = '/projects';
			});
			return;
		}
		rememberProject(null);
		window.location.href = '/projects';
	}, [staleProject]);

	useEffect(() => {
		const slug = getProjectSlug();
		if (!slug) return;
		const remember = () => document.visibilityState === 'visible' && rememberProject(slug);
		remember();
		window.addEventListener('focus', remember);
		document.addEventListener('visibilitychange', remember);
		return () => {
			window.removeEventListener('focus', remember);
			document.removeEventListener('visibilitychange', remember);
		};
	}, [first]);

	return null;
};

export default PanelGuard;
