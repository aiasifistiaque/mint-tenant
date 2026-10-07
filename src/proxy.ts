import { NextRequest, NextResponse } from 'next/server';
import {
	IS_TENANT_PANEL,
	PROJECT_COOKIE,
	PROJECT_PAGES,
	isProjectSegment,
	projectHref,
	projectPagePath,
} from './components/library/config/lib/constants/panel';

/**
 * The tenant panel's project addresses (docs/multi-tenancy D18, panel.ts):
 *
 * - /<project>/<page…> is served by the app page it stands for (a rewrite —
 *   the address stays as it is): /acme-store/clients → /t/clients.
 * - A project page's own address with no project in it (an older link to
 *   /model-builder) goes to the same page inside the project this browser last
 *   worked in (the PROJECT_COOKIE); with none it opens as it is.
 * - /dashboard alone is always the organization's home (its projects) — a
 *   project's dashboard is /<project>. It used to follow the cookie too, so
 *   Home and the landing page's Dashboard button opened whichever project
 *   was last used.
 *
 * The super-admin panel's addresses are left alone.
 */
export function proxy(req: NextRequest) {
	if (!IS_TENANT_PANEL) return NextResponse.next();

	const segments = req.nextUrl.pathname.split('/').filter(Boolean);
	const first = segments[0] || '';

	if (PROJECT_PAGES.has(first) && !(first === 'dashboard' && segments.length === 1)) {
		const last = req.cookies.get(PROJECT_COOKIE)?.value || '';
		if (!isProjectSegment(last)) return NextResponse.next();
		const url = req.nextUrl.clone();
		url.pathname = projectHref(req.nextUrl.pathname, last);
		return NextResponse.redirect(url);
	}

	if (!isProjectSegment(first)) return NextResponse.next();
	const url = req.nextUrl.clone();
	url.pathname = projectPagePath(segments.slice(1));
	return NextResponse.rewrite(url);
}

export const config = {
	// Pages only: not Next's own files, the API proxy, or anything with an extension.
	matcher: ['/((?!_next/|api/|.*\\..*).*)'],
};
