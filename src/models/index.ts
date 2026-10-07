import createCollection from './collection/createCollection.model';
import viewCollections from './collection/getAllCollections.model';

import getAllCategories from './categories/getAllCategories.model';
// import createCategory from './categories/createCategory.model';
import getCategoryById from './categories/getCategoryById.model';
import updateCategory from './categories/editCategories.model';
import getCollectionById from './collection/getCollectionById.model';

const collections = {
	create: createCollection,
	getAll: viewCollections,
	getById: getCollectionById,
};

const categories = {
	getAll: getAllCategories,
	create: updateCategory,
	getById: getCategoryById,
	update: updateCategory,
};

export { collections, categories };

import ProductSchema from './products/product.schema';
import CustomerSchema from './customer/schema';
import SupplierSchema from './supplier/supplier.schema';

export const schema: any = {
	products: ProductSchema,
	customers: CustomerSchema,
	suppliers: SupplierSchema,
};

export { default as themeSchema } from './theme/theme.schema';
export { default as purchasedThemeSchema } from './theme/purchasedTheme.schema';
export { default as leadSchema } from './leads/leads.schema';
export { default as adminSchema } from './admin/adminSchema';
export { default as adminRoleSchema } from './admin/adminRoleSchema';

export { default as projectSchema } from './projects/schema';
export { default as clientSchema } from './client/client.schema';

export { default as documentSchema } from './documents/document.schema';
export { default as jobPostSchema } from './job-post/jobposts.schema';
export { default as jobApplicationSchema } from './job-post/jobapplications.schema';
