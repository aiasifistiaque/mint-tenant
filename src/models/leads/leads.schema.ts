import { Schema, SchemaType } from '@/components/library';

export type Type<T> = {
	[K in keyof T]: Schema;
};

const sourceOptions = [
	{
		label: 'Facebook',
		value: 'facebook',
	},
	{
		label: 'Facebook Ads',
		value: 'facebook-ad',
	},
	{
		label: 'Facebook Group',
		value: 'facebook-group',
	},
	{
		label: 'Outbound Call',
		value: 'outbound-call',
	},
	{
		label: 'Outbound Email',
		value: 'outbound-email',
	},
	{
		label: 'Instagram',
		value: 'instagram',
	},
	{
		label: 'Google',
		value: 'google',
	},
	{
		label: 'Referral',
		value: 'referral',
	},
	{
		label: 'Website',
		value: 'website',
	},
	{
		label: 'Other',
		value: 'other',
	},
];

const schema: SchemaType<any> = {
	name: {
		label: 'Name',
		type: 'string',
		isRequired: true,
		default: true,
		displayInTable: true,
		sort: true,
	},
	leadType: {
		label: 'Lead Type',
		type: 'select',
		displayInTable: true,
		default: true,

		options: [
			{
				label: 'Cold',
				value: 'cold',
			},
			{
				label: 'Warm',
				value: 'warm',
			},
			{
				label: 'Hot',
				value: 'hot',
			},
		],
	},
	email: {
		label: 'Email',
		type: 'string',
		default: true,
		displayInTable: true,
	},
	phone: {
		label: 'Phone',
		type: 'string',
		default: true,
		displayInTable: true,
	},
	createdAt: {
		label: 'Created At',
		type: 'date',
	},
	category: {
		label: 'Category',
		type: 'string',
		displayInTable: true,
	},
	estimatedBudget: {
		label: 'Estimated Budget',
		type: 'number',
		displayInTable: true,
	},
	businessName: {
		label: 'Business Name',
		type: 'string',
		displayInTable: true,
	},
	position: {
		label: 'Position',
		type: 'string',
		displayInTable: true,
	},
	businessAddress: {
		label: 'Business Address',
		type: 'textarea',
		sort: true,
	},
	city: {
		label: 'City',
		type: 'string',
		displayInTable: true,
		sort: true,
	},
	assignedTo: {
		label: 'Assigned To',
		type: 'data-menu',
		displayInTable: true,
		tableType: 'text',
		tableKey: 'assignedTo.name',
		model: 'admins',
	},
	industry: {
		label: 'Industry',
		type: 'string',
		sort: true,
		displayInTable: true,
	},
	websiteUrl: {
		label: 'Website',
		type: 'string',
		viewType: 'external-link',
		copy: true,
		inputLabel: 'Enter Website Url',
	},
	tags: {
		label: 'Tags',
		type: 'tag',
	},
	interestedIn: {
		label: 'Interested In',
		type: 'tag',
	},
	hasWebsite: {
		label: 'Has Website',
		type: 'checkbox',
		displayInTable: true,
	},
	priority: {
		label: 'Priority',
		type: 'select',
		displayInTable: true,
		options: [
			{
				label: 'High',
				value: 'high',
			},
			{
				label: 'Medium',
				value: 'medium',
			},
			{
				label: 'Low',
				value: 'low',
			},
		],
	},
	followUps: {
		label: 'Follow Ups',
		type: 'tag',
	},
	facebook: {
		label: 'Facebook',
		type: 'string',
		viewType: 'external-link',
		displayInTable: true,
		copy: true,
	},
	instagram: {
		label: 'Instagram',
		type: 'string',
		viewType: 'external-link',
		displayInTable: true,
	},
	website: {
		label: 'Website',
		type: 'string',
		viewType: 'external-link',
		copy: true,
		displayInTable: true,
	},
	requirements: {
		label: 'Requirements',
		type: 'textarea',
	},
	source: {
		label: 'Source',
		type: 'select',
		displayInTable: true,
		options: sourceOptions,
	},
	status: {
		label: 'Status',
		type: 'select',
		displayInTable: true,
		options: [
			{
				label: 'New',
				value: 'new',
			},
			{
				label: 'Interested',
				value: 'interested',
			},
			{
				label: 'Contacted',
				value: 'contacted',
			},
			{
				label: 'Qualified',
				value: 'qualified',
			},
			{
				label: 'Attempted Contact',
				value: 'attempted-contact',
			},
			{
				label: 'Unqualified',
				value: 'unqualified',
			},
			{
				label: 'Follow Up',
				value: 'follow-up',
			},
			{
				label: 'Converted',
				value: 'converted',
			},
			{
				label: 'Dead',
				value: 'dead',
			},
			{
				label: 'Open',
				value: 'open',
			},
			{
				label: 'Won',
				value: 'won',
			},
			{
				label: 'Closed',
				value: 'closed',
			},
		],
	},
	notes: {
		label: 'Notes',
		type: 'tag',
	},
};

export default schema;
