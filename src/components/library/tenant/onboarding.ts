/**
 * The sign-up questions about the business (backend organization.model.ts
 * ORG_INDUSTRIES / ORG_TEAM_SIZES / HEARD_FROM / ORG_GOALS — keep the values
 * in step; the server refuses any other).
 */
export const INDUSTRIES = [
	{ value: 'agency', label: 'Agency or studio' },
	{ value: 'ecommerce', label: 'E-commerce' },
	{ value: 'education', label: 'Education' },
	{ value: 'finance', label: 'Finance' },
	{ value: 'healthcare', label: 'Healthcare' },
	{ value: 'hospitality', label: 'Hospitality' },
	{ value: 'manufacturing', label: 'Manufacturing' },
	{ value: 'media', label: 'Media' },
	{ value: 'nonprofit', label: 'Non-profit' },
	{ value: 'real-estate', label: 'Real estate' },
	{ value: 'retail', label: 'Retail' },
	{ value: 'software', label: 'Software or SaaS' },
	{ value: 'travel', label: 'Travel' },
	{ value: 'other', label: 'Something else' },
];

export const TEAM_SIZES = [
	{ value: '1', label: 'Just me' },
	{ value: '2-10', label: '2–10' },
	{ value: '11-50', label: '11–50' },
	{ value: '51-200', label: '51–200' },
	{ value: '201-1000', label: '201–1,000' },
	{ value: '1000+', label: '1,000+' },
];

export const HEARD_FROM = [
	{ value: 'search', label: 'A search engine' },
	{ value: 'social', label: 'Social media' },
	{ value: 'friend', label: 'A friend or colleague' },
	{ value: 'youtube', label: 'YouTube' },
	{ value: 'blog', label: 'A blog or article' },
	{ value: 'event', label: 'An event' },
	{ value: 'ad', label: 'An ad' },
	{ value: 'ai-assistant', label: 'An AI assistant' },
	{ value: 'other', label: 'Somewhere else' },
];

export const GOALS = [
	{ value: 'website', label: 'A website' },
	{ value: 'internal-tools', label: 'Internal tools' },
	{ value: 'crm', label: 'A CRM' },
	{ value: 'ecommerce', label: 'An online store' },
	{ value: 'api', label: 'An API for my app' },
	{ value: 'automation', label: 'Automations' },
	{ value: 'other', label: 'Something else' },
];
