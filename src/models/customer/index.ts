import { CreateLayoutProps, createFormFields } from '@/components/library';

import schema from './schema';

const createLayout: CreateLayoutProps = [
	{ sectionTitle: 'Customer Info', fields: ['name', 'email', 'phone'] },
];

const createFields = createFormFields({ schema, layout: createLayout });

const form = {
	type: 'add',
	title: 'Add New Customer',
	path: 'customers',
	fields: createFields,
};

export { form, form as creteForm, createFields as formFields };
