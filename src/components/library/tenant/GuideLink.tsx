'use client';

import { FC } from 'react';
import { Link } from '@chakra-ui/react';
import { ExternalLink } from 'lucide-react';

/**
 * "How this works ↗" on the tenant panel's own pages — a section of the user
 * guides (/user-docs), in a new tab so it reads beside the page. `section` is
 * the anchor; which guide it's in is looked up here. Rename an anchor in its
 * guide and here together.
 */
const GUIDE_OF: Record<string, string> = {
	organizations: 'organization',
	members: 'organization',
	invitations: 'organization',
	roles: 'organization',
	ownership: 'organization',
	switching: 'organization',
	invited: 'organization',
	'project-access': 'organization',
	projects: 'projects',
	'project-settings': 'projects',
	'project-comments': 'projects',
	automations: 'automations',
	'automation-trigger': 'automations',
	'automation-conditions': 'automations',
	'automation-actions': 'automations',
	'automation-try': 'automations',
	'automation-runs': 'automations',
	'automation-emails': 'automations',
	'project-people': 'organization',
	'project-roles': 'organization',
	templates: 'templates',
	'start-from': 'templates',
	'template-questions': 'templates',
	'template-build': 'templates',
	'after-template': 'templates',
	'template-list': 'templates',
	'template-faq': 'templates',
	history: 'projects',
	notifications: 'account',
	'install-app': 'account',
	'media-library': 'projects',
	'public-api': 'public-api',
	// The API builder (docs/api-builder).
	'api-endpoints': 'public-api',
	'api-generate': 'public-api',
	'api-customer-sign-in': 'public-api',
	'api-new-endpoint': 'public-api',
	'api-access': 'public-api',
	'api-conditions': 'public-api',
	'api-fields': 'public-api',
	'api-filters': 'public-api',
	'api-populate': 'public-api',
	'api-drafts': 'public-api',
	'api-try': 'public-api',
	'api-keys': 'public-api',
	'api-project-key': 'public-api',
	'api-logs': 'public-api',
	'models-components': 'models',
	'models-components-nesting': 'models',
	'models-components-reusable': 'models',
	'models-image-details': 'models',
	'models-drafts': 'models',
	'models-schedule': 'models',
	'api-reference': 'public-api',
	reference: 'public-api',
	filters: 'public-api',
	paging: 'public-api',
	sorting: 'public-api',
	tester: 'public-api',
	webhooks: 'public-api',
	'verify-signatures': 'public-api',
	examples: 'public-api',
	api: 'projects',
	customers: 'customers',
	widget: 'customers',
	widgets: 'widgets',
	'add-mint': 'widgets',
	look: 'widgets',
	login: 'widgets',
	shop: 'widgets',
	'shop-orders': 'widgets',
	checkout: 'widgets',
	thanks: 'widgets',
	orders: 'widgets',
	payments: 'payments',
	stripe: 'payments',
	sslcommerz: 'payments',
	bkash: 'payments',
	'return-pages': 'payments',
	'payments-list': 'payments',
	coming: 'payments',
	email: 'email',
	'email-server': 'email',
	'email-test': 'email',
	'email-log': 'email',
	'email-accounts': 'email',
	'connect-email': 'email',
	'default-account': 'email',
	'email-designs': 'email',
	'design-look': 'email',
	'design-header': 'email',
	'design-colours': 'email',
	'design-footer': 'email',
	'automation-email-design': 'email',
	cart: 'widgets',
	'mint-js': 'widgets',
	'coming-next': 'widgets',
	'add-widget': 'widgets',
	'login-customers': 'widgets',
	websites: 'websites',
	'site-setup': 'websites',
	'site-general': 'websites',
	'site-contact': 'websites',
	'site-seo': 'websites',
	'server-side': 'websites',
	'site-check': 'websites',
	tracking: 'websites',
	'site-code': 'websites',
	indexing: 'websites',
	redirects: 'websites',
	'site-domains': 'websites',
	'site-overview': 'websites',
	'site-contents': 'websites',
	'site-contents-list': 'websites',
	'starter-code': 'websites',
	'website-setup': 'websites',
	'website-setup-keys': 'websites',
	'connect-a-website': 'websites',
	analytics: 'analytics',
	visitors: 'analytics',
	journey: 'analytics',
	'live-visitors': 'analytics',
	'traffic-sources': 'analytics',
	'connect-ai': 'connect-ai',
	start: 'site-builder',
};

const GuideLink: FC<{ section: string; label?: string }> = ({ section, label = 'How this works' }) => (
	<Link
		href={`/user-docs/${GUIDE_OF[section] || ''}#${section}`}
		target='_blank'
		rel='noreferrer'
		fontSize='12px'
		color='fg.muted'
		display='inline-flex'
		alignItems='center'
		gap={1}
		whiteSpace='nowrap'
		_hover={{ color: 'fg' }}>
		{label}
		<ExternalLink size={11} />
	</Link>
);

export default GuideLink;
