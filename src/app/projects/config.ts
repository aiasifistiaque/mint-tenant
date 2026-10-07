export const fields = [
	'name',
	'category',
	'status',
	'description',
	'client',
	'startDate',
	'endDate',
	'deadline',
	'requirements',
	'file',
	'fileUrl',
	'tags',
	'addedBy',
	'privacy',
	'access',
	'createdAt',
];

export const formFields = [
	{
		sectionTitle: 'Basic Details',
		fields: [['name', 'client'], ['category', 'status'], 'tags'],
	},
	{
		sectionTitle: 'Description',
		fields: ['description'],
	},
	{
		sectionTitle: 'Timeline',
		fields: [['startDate', 'endDate'], 'deadline'],
	},
	{
		sectionTitle: 'Requirements & Details',
		fields: ['requirements', 'file', 'fileUrl'],
	},
	{
		sectionTitle: 'Access Control',
		fields: ['privacy', 'access'],
	},
	{
		sectionTitle: 'Note & Tags',
		fields: ['note'],
	},
];

export const tableFields = [
	'name',
	'category',
	'status',
	'client',
	'startDate',
	'endDate',
	'deadline',
	'file',
	'filerl',
	'privacy',
	'addedBy',
];
