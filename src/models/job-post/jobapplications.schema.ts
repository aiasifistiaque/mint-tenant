import { SchemaType } from '@/components/library';

const jobApplicationSchema: SchemaType<any> = {
	jobPost: {
		label: 'Job Post',
		type: 'data-menu',
		isRequired: true,
		model: 'jobposts',
		tableType: 'text',
		tableKey: 'jobPost.name',
		viewKey: 'jobPost.name',
		displayInTable: true,
		default: true,
	},
	scheduledAt: {
		label: 'Interview Schedule',
		type: 'date',
		displayInTable: true,
		tableType: 'date-only',
	},
	fit: {
		label: 'Fit',
		type: 'select',
		displayInTable: true,
		options: [
			{
				label: 'Good',
				value: 'good',
			},
			{
				label: 'Average',
				value: 'average',
			},
			{
				label: 'Poor',
				value: 'poor',
			},
			{
				label: 'Not Fit',
				value: 'not-fit',
			},
		],
	},
	name: {
		label: 'Candidate Name',
		type: 'string',
		isRequired: true,
		sort: true,
		default: true,
		displayInTable: true,
	},
	email: {
		label: 'Email',
		type: 'string',
		// isRequired: true,
		displayInTable: true,
		default: true,
	},
	phone: {
		label: 'Phone',
		type: 'string',
		displayInTable: true,
	},
	address: {
		label: 'Address',
		type: 'textarea',
	},
	city: {
		label: 'City',
		type: 'string',
	},
	coverLetter: {
		label: 'Cover Letter',
		type: 'textarea',
	},
	resume: {
		label: 'Resume',
		type: 'file',
		displayInTable: true,
	},
	resumeUrl: {
		label: 'Resume URL',
		type: 'string',
		tableType: 'external-link',
		viewType: 'external-link',
		displayInTable: true,
	},
	educationLevel: {
		label: 'Education Level',
		type: 'select',
		options: [
			{
				label: 'High School',
				value: 'high-school',
			},
			{
				label: 'Diploma',
				value: 'diploma',
			},
			{
				label: 'Bachelors',
				value: 'bachelors',
			},
			{
				label: 'Masters',
				value: 'masters',
			},
			{
				label: 'PhD',
				value: 'phd',
			},
			{
				label: 'Other',
				value: 'other',
			},
		],
	},
	school: {
		label: 'School',
		type: 'string',
	},
	college: {
		label: 'College',
		type: 'string',
	},
	degree: {
		label: 'Degree',
		type: 'string',
	},
	university: {
		label: 'University',
		type: 'string',
		displayInTable: true,
	},
	passingYear: {
		label: 'Passing Year',
		type: 'string',
		displayInTable: true,
	},
	portfolioUrl: {
		label: 'Portfolio URL',
		type: 'string',
		viewType: 'external-link',
		tableType: 'external-link',
		copy: true,
		displayInTable: true,
	},
	linkedin: {
		label: 'LinkedIn',
		type: 'string',
		displayInTable: true,
		tableType: 'external-link',
		viewType: 'external-link',
	},
	github: {
		label: 'GitHub',
		type: 'string',
		tableType: 'external-link',
		viewType: 'external-link',
	},
	facebook: {
		label: 'Facebook',
		type: 'string',
		tableType: 'external-link',
		viewType: 'external-link',
	},
	website: {
		label: 'Website',
		type: 'string',
		tableType: 'external-link',
		viewType: 'external-link',
	},
	expectedSalary: {
		label: 'Expected Salary',
		type: 'number',
	},
	status: {
		label: 'Status',
		type: 'select',
		// isRequired: true,
		options: [
			{
				label: 'Applied',
				value: 'applied',
			},
			{
				label: 'Pending',
				value: 'pending',
			},
			{
				label: 'Reviewed',
				value: 'reviewed',
			},
			{
				label: 'Shortlisted',
				value: 'shortlisted',
			},
			{
				label: 'Called',
				value: 'called',
			},
			{
				label: 'Interview Scheduled',
				value: 'interview-scheduled',
			},
			{
				label: 'Interviewed',
				value: 'interviewed',
			},
			{
				label: 'Offer Sent',
				value: 'offer-sent',
			},
			{
				label: 'Offer Accepted',
				value: 'offer-accepted',
			},
			{
				label: 'Offer Declined',
				value: 'offer-declined',
			},
			{
				label: 'Recalled',
				value: 'recalled',
			},
			{
				label: 'Rejected',
				value: 'rejected',
			},
			{
				label: 'Hired',
				value: 'hired',
			},
			{
				label: 'Deleted',
				value: 'deleted',
			},
			{
				label: 'Expired',
				value: 'expired',
			},
		],
		displayInTable: true,
	},
	appliedAt: {
		label: 'Applied At',
		type: 'date',

		displayInTable: true,
		sort: true,
	},
	appliedFrom: {
		label: 'Applied From',
		type: 'select',
		isRequired: true,
		options: [
			{
				label: 'LinkedIn',
				value: 'linkedin',
			},
			{
				label: 'Email',
				value: 'email',
			},
			{
				label: 'Facebook',
				value: 'facebook',
			},
			{
				label: 'Application URL',
				value: 'applicationUrl',
			},
			{
				label: 'Referral',
				value: 'referral',
			},
			{
				label: 'Other',
				value: 'other',
			},
		],
	},
	experienceLevel: {
		label: 'Experience Level',
		type: 'select',
		options: [
			{
				label: 'Entry Level',
				value: 'entry-level',
			},
			{
				label: 'Mid Level',
				value: 'mid-level',
			},
			{
				label: 'Senior Level',
				value: 'senior-level',
			},
			{
				label: 'Management',
				value: 'management',
			},
			{
				label: 'Other',
				value: 'other',
			},
		],
	},
	skills: {
		label: 'Skills',
		type: 'tag',
	},
	notes: {
		label: 'Note',
		type: 'textarea',
	},
	tags: {
		label: 'Tags',
		type: 'tag',
	},
};

export default jobApplicationSchema;
