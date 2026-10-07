import { table } from 'console';

const schema = {
	name: {
		label: 'Name',
		type: 'string',
		isRequired: true,
		default: true,
		displayInTable: true,
		sort: true,
	},
	category: {
		label: 'Category',
		type: 'string',
		displayInTable: true,
		default: true,
	},
	project: {
		label: 'Project',
		type: 'data-menu',
		model: 'projects',
		tableType: 'text',
		tableKey: 'project.name',
		displayInTable: true,
		default: true,
	},
	clientName: {
		label: 'Client Name',
		type: 'string',
		// displayInTable: true,
		// default: true,
	},
	client: {
		label: 'Client',
		type: 'data-menu',
		tableType: 'string',
		displayInTable: true,
		default: true,
		sort: true,
		tableKey: 'client.name',
		model: 'clients',
	},
	devUrl: {
		label: 'Dev Url',
		type: 'string',
		displayInTable: true,
		viewType: 'external-link',
		copy: true,
		tableType: 'external-link',
	},
	liveUrl: {
		label: 'Live Url',
		type: 'string',
		displayInTable: true,
		viewType: 'external-link',
		tableType: 'external-link',
		copy: true,
	},
	testUrl: {
		label: 'Test Url',
		type: 'string',
		displayInTable: true,
		viewType: 'external-link',
		tableType: 'external-link',
		copy: true,
	},
	prodUrl: {
		label: 'Prod Url',
		type: 'string',
		displayInTable: true,
		viewType: 'external-link',
		tableType: 'external-link',
		copy: true,
	},
	projectType: {
		label: 'Project Type',
		type: 'select',
		displayInTable: true,
		options: [
			{
				label: 'Frontend',
				value: 'frontend',
			},
			{
				label: 'Backend',
				value: 'backend',
			},
			{
				label: 'Fullstack',
				value: 'fullstack',
			},
			{
				label: 'Android',
				value: 'android',
			},
			{
				label: 'IOS',
				value: 'ios',
			},
			{
				label: 'Admin',
				value: 'admin',
			},
			{
				label: 'Other',
				value: 'other',
			},
		],
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
				label: 'In Progress',
				value: 'in-progress',
			},
			{
				label: 'Completed',
				value: 'completed',
			},
			{
				label: 'Cancelled',
				value: 'cancelled',
			},
			{
				label: 'On Hold',
				value: 'on-hold',
			},
			{
				label: 'Testing',
				value: 'testing',
			},
			{
				label: 'Deployed',
				value: 'deployed',
			},
			{
				label: 'Pending',
				value: 'pending',
			},
		],
	},
	technologies: {
		label: 'Technologies',
		type: 'tag',
	},
	frameworks: {
		label: 'frameworks',
		type: 'tag',
	},
	libraries: {
		label: 'Libraries',
		type: 'tag',
	},
	githubUrl: {
		label: 'Git Repo',
		type: 'string',
		displayInTable: true,
		viewType: 'external-link',
		tableType: 'external-link',
		copy: true,
	},
	/**
	 * Set together by the repo page's Link dialog, never one at a time — see
	 * the note on the backend settings. Not in the create/edit form: picking an
	 * account and then a project from it is a two-request cascade that the
	 * generic form has no way to express.
	 */
	hostedPlatform: {
		label: 'Hosted On',
		type: 'select',
		displayInTable: true,
		options: [
			{ label: 'Vercel', value: 'vercel' },
			{ label: 'Heroku', value: 'heroku' },
		],
	},
	hostedProjectName: {
		label: 'Hosted Project',
		type: 'string',
		displayInTable: true,
	},
	hostingAccount: {
		label: 'Hosting Account',
		type: 'string',
	},
	hostingAccountModel: {
		label: 'Hosting Account Type',
		type: 'string',
	},
	hostedProjectId: {
		label: 'Hosted Project ID',
		type: 'string',
	},
	createdAt: {
		label: 'Created At',
		type: 'string',
	},
	updatedAt: {
		label: 'Updated At',
		type: 'string',
	},
	addedBy: {
		label: 'Added By',
		type: 'string',
		displayInTable: true,
		sort: true,
		tableKey: 'addedBy.name',
	},
};

export default schema;
