import { SelectmenuItemProps } from '@/components/library';
import { createModal } from '@/models/categories';

const multiSelectMenu: SelectmenuItemProps[] = [
	{
		title: 'Mark as Active',
		type: 'edit',
		key: 'isActive',
		value: true,
		prompt: {
			title: 'Mark as Active',
			body: 'Are you sure you want to mark these items as active?',
		},
	},
	{
		title: 'Mark as Inactive',
		type: 'edit',
		key: 'isActive',
		value: false,
		prompt: {
			title: 'Mark as InActive',
			body: 'Are you sure you want to mark these items as in-active?',
		},
	},
	{
		title: 'Update Product Status',
		type: 'edit-select',
		key: 'status',
		options: [
			{ label: 'Published', value: 'published' },
			{ label: 'Draft', value: 'draft' },
			{ label: 'Archived', value: 'archived' },
		],
		prompt: {
			title: 'Product Status',
			body: 'Update Product Status',
		},
	},

	{
		title: 'Update Category',
		type: 'edit-data-select',
		key: 'category',
		dataPath: 'categories',
		dataModel: createModal,
		prompt: {
			title: 'Update Category',
			body: 'Choose item category to update',
		},
	},
	{
		title: 'Add to collection',
		type: 'edit-data-select',
		key: 'collection',
		keyType: 'array',
		dataPath: 'collections',
		//dataModel: createCollection,
		prompt: {
			title: 'Add to collection',
			body: 'Add Items to collection',
		},
	},
	{
		title: 'Export selected',
		type: 'export',
	},
];

export default multiSelectMenu;
