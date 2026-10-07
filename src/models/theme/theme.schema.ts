import { Schema, SchemaType } from '@/components/library';

type ModelType = {
	image: string; // URL to the image of the theme
	name: string; // Name of the theme
	price: number; // Price of the theme
	isFree: boolean; // Whether the theme is free or not
	developer: string; // Name of the developer
	gitRepo: string; // URL to the GitHub repository of the theme
	demoUrl: string; // URL to the demo of the theme
	framework: string; // Framework of the theme
	shortDescription: string; // Short description of the theme
	description: string; // Description of the theme
	isDiscounted?: boolean; // Whether the theme is discounted or not
	discountedPrice?: number; // Discounted price of the theme
	demoVariants?: object; // Variants of the demo
	title?: string; // Title of the theme if the title is different from name
	useCase?: string; // Use case of the theme
	css?: string; // CSS framework used for the theme
	views?: number; // Number of views of the theme
	likes?: number; // Number of likes of the theme
	downloads?: number; // Number of downloads of the theme
	slug?: string; // Slug of the theme
	images?: string[]; // Array of URLs to the images of the theme
	sections?: { image?: string; title?: string; description?: string }[]; // Sections of the theme
};

export type Type<T> = {
	[K in keyof T]: Schema;
};

const schema: SchemaType<ModelType> = {
	image: {
		type: 'image',
		isRequired: true,
		label: 'Image',
	},
	images: {
		type: 'image-array',
		label: 'Images',
	},

	name: {
		type: 'text',
		isRequired: true,
		label: 'Name',
		displayInTable: true,
		default: true,
	},
	slug: {
		type: 'text',
		label: 'Slug',
		displayInTable: true,
		isRequired: true,
	},
	gitRepo: {
		type: 'text',
		label: 'GitHub Repository',
		isRequired: true,
		displayInTable: true,
	},
	title: {
		type: 'text',
		label: 'Description Title',
	},
	price: {
		type: 'number',
		isRequired: true,
		displayInTable: true,
		label: 'Price',
		default: true,
	},
	isFree: {
		label: 'Is Free',
		type: 'checkbox',
		isRequired: true,
		default: false,
	},
	isDiscounted: {
		type: 'checkbox',
		label: 'Is Discounted',
		displayInTable: true,
	},
	discountedPrice: {
		type: 'number',
		label: 'Discounted Price',
		displayInTable: true,
	},
	developer: {
		type: 'string',
		isRequired: true,
		displayInTable: true,
		label: 'Developer',
	},
	demoUrl: {
		type: 'text',
		label: 'Demo Url',
		isRequired: true,
	},
	framework: {
		type: 'text',
		label: 'Framework',
	},
	shortDescription: {
		type: 'textarea',
		label: 'Short Description',
	},
	description: {
		type: 'textarea',
		label: 'Long Description',
	},
	useCase: {
		type: 'text',
		label: 'Use Case',
	},
	css: {
		type: 'text',
		label: 'CSS Framework',
	},
	views: {
		type: 'number',
		label: 'Views',
		displayInTable: true,
	},
	likes: {
		type: 'number',
		label: 'Likes',
		displayInTable: true,
	},
	downloads: {
		type: 'number',
		label: 'Downloads',
		displayInTable: true,
	},
};

export default schema;
