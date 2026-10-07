import {
	convertToTableFields,
	convertToViewFields,
	createFormFields,
	TableObjectProps,
} from '@/components/library';
import schema from './product.schema';
import multiSelectMenu from './data/multiSelect';
import itemMenu from './data/itemMenu';

const tableLayout: any[] = [
	'name',
	'price',
	'shop',
	'category',
	'brand',
	'isActive',
	'slug',
	'status',
	'sku',
	'isFeatured',
	'isDiscount',
	'discount',
	'createdAt',
];

// const createProductFormFields = createFormFields({ schema, layout });
export const viewAllDataFields = convertToTableFields({ schema, fields: tableLayout });
export const viewPreviewFields = convertToViewFields({ schema });

export const viewProductFields = convertToViewFields({ schema });

// const form = {
// 	type: 'add',
// 	title: 'Add New Product',
// 	path: 'products',
// 	fields: createProductFormFields,
// };

// const updateForm = {
// 	type: 'add',
// 	title: 'Update Product Details',
// 	path: 'products',
// 	fields: createProductFormFields,
// };

const viewAll: TableObjectProps = {
	title: 'Products',
	path: 'products',
	export: true,
	select: {
		show: true,
		menu: multiSelectMenu,
	},

	menu: itemMenu,
	data: viewAllDataFields,
};

export { viewAll as viewAll };
