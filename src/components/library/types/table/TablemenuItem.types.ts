import { FormLayout } from '..';

type Item =
	| 'edit'
	| 'delete'
	| 'view'
	| 'view-modal'
	| 'view-item'
	| 'edit-modal'
	| 'post'
	| 'update-api'
	| 'redirect'
	| 'custom'
	| 'marketing-sms'
	| 'link'
	| 'custom-modal'
	| 'update-key'
	| 'custom-redirect'
	| 'duplicate'
	| 'view-server-modal'
	| 'edit-server-modal';

type BaseMenuItem = {
	title: string;
	type: Item;
	dataModel?: any;
	id?: any;
	path?: string;
	renderCondition?: (data: any) => boolean;
	invalidate?: string[];
	fields?: string[];
	layout?: FormLayout;
	prompt?: {
		title: string;
		body: string;
		btnText?: string;
		successMsg?: string;
	};
};

type CustomModalMenuItem = BaseMenuItem & {
	type: 'custom-modal' | 'custom';
	modal: any;
};

type RedirectMenuItem = BaseMenuItem & {
	type: 'redirect';
	href: string;
};

type CustomRedirectItem = BaseMenuItem & {
	type: 'custom-redirect';
	href: (data: any) => string;
};

type UpdateApiItem = BaseMenuItem & {
	type: 'update-api';
	path?: string;
	id?: (data: any) => string;
	body: object;
	bodyFn?: (data: any) => object;
};

type UpdateKeyItem = BaseMenuItem & {
	type: 'update-key';
	dataPath?: string;
	keyType: 'data-menu' | 'string' | 'number' | 'boolean' | 'array' | 'select';
	key: string;
};

type OtherMenuItem = BaseMenuItem & {
	type: Exclude<Item, 'redirect' | 'custom-modal' | 'custom-redirect'>;
	href?: string;
	modal?: never;
};

export type MenuItem =
	| CustomModalMenuItem
	| RedirectMenuItem
	| OtherMenuItem
	| CustomRedirectItem
	| UpdateApiItem
	| UpdateKeyItem;
