import type { Metadata } from 'next';
import { IS_TENANT_PANEL } from '@/components/library/config/lib/constants/panel';
import Landing from './_landing/Landing';
import Dashboard from './dashboard/page';

/**
 * The tenant panel's / is its public landing page — what MINT is, sign up,
 * sign in, or on to the dashboard (/dashboard, panel.ts HOME). The
 * super-admin panel's / is the dashboard itself.
 */
export const metadata: Metadata = IS_TENANT_PANEL
	? {
			title: 'MINT — Apps and websites for your business',
			description:
				'Describe what you keep track of and get a ready panel — tables, forms, dashboards — for your team, with a public API and customer sign-in for your own site or app.',
	  }
	: {};

export default function Root() {
	return IS_TENANT_PANEL ? <Landing /> : <Dashboard />;
}
