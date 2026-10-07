import { Schema, SchemaType } from '@/components/library';

type ModelType = {
	theme: string;
	shop: string;
	price: number;
	isActivated: boolean;
	activatedAt: Date;
	isDeployed: boolean;
	deployment: string;
	name: string;
};

export type Type<T> = {
	[K in keyof T]: Schema;
};

const schema: SchemaType<ModelType> = {
	theme: {
		label: 'Theme',
		type: 'data-menu',
		model: 'themes',
		tableType: 'text',
		tableKey: 'theme.name',
		isRequired: true,
		displayInTable: true,
	},
	name: {
		label: 'Name',
		type: 'string',
		isRequired: true,
	},
	shop: {
		label: 'Shop',
		tableType: 'text',
		type: 'data-menu',
		tableKey: 'shop.name',
		model: 'shops',
		isRequired: true,
		displayInTable: true,
	},
	price: {
		label: 'Price',
		type: 'number',
		isRequired: true,
		displayInTable: true,
	},
	isActivated: {
		label: 'Is Activated',
		type: 'checkbox',
		displayInTable: true,
		colorPalette: (value: boolean) => (value ? 'green' : 'red'),
	},
	activatedAt: {
		label: 'Activated At',
		type: 'date',
		displayInTable: true,
	},
	isDeployed: {
		label: 'Is Deployed',
		type: 'tag',
	},
	deployment: {
		label: 'Deployment',
		type: 'string',
		tableKey: 'deployment.vercelName',
		displayInTable: true,
	},
};

export default schema;
