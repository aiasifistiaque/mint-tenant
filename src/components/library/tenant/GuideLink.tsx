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
	templates: 'templates',
	'start-from': 'templates',
	'template-questions': 'templates',
	'template-build': 'templates',
	'after-template': 'templates',
	'template-list': 'templates',
	'template-faq': 'templates',
	history: 'projects',
	notifications: 'account',
	'media-library': 'projects',
	'public-api': 'public-api',
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
	'return-pages': 'payments',
	'payments-list': 'payments',
	coming: 'payments',
	email: 'email',
	'email-server': 'email',
	'email-test': 'email',
	'email-log': 'email',
	cart: 'widgets',
	'mint-js': 'widgets',
	'coming-next': 'widgets',
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
	'starter-code': 'websites',
	analytics: 'analytics',
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
