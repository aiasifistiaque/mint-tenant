export type UpdateProps = {
	page?: number;
	limit?: number;
	search?: string;
	sort?: string;
};

export type User = {
	_id: string;
	name: string;
	email: string;
	role: string;
	isActive: boolean;
	permissions: string[];
	createdAt: string;
	updatedAt: string;
	phone: string;
	organisation: Organization;
	__v: number;
};

export type Users = {
	search?: string;
	sort: string;
	page: number;
	limit: number;
	skip: number;
	docsInPage: number;
	totalDocs: number;
	totalPages: number;
	fields: string;
	doc: User[];
};

export type ApiResponse<T> = {
	search?: string;
	sort: string;
	page: number;
	limit: number;
	skip: number;
	docsInPage: number;
	totalDocs: number;
	totalPages: number;
	fields: string;
	allowSort?: string[];
	doc: T[];
};

export type Organization = {
	_id: string;
	name: string;
	email: string;
	phone: string;
	address: string;
	user: string;
	website: string | null;
	isActive: boolean;
	__v?: number;
	createdAt?: string;
	updatedAt?: string;
};

export type Coupon = {
	name?: string;
	code: string;
	maxUse: number;
	description?: string;
	isActive: boolean;
	store: any;
	image?: string;
	isFlat: boolean;
	maxAmount: number;
	minOrderValue: number;
	percentage?: number;
	validFrom: Date;
	validTill: Date;
	addedBy?: any;
	maxUsePerUser: number;
	user?: any;
	_id: string;
	createdAt: string;
	updatedAt: string;
};

export type TableProps = {
	page: number;
	limit: any;
	search?: string;
	sort: string;
	isActive?: any;
	filters?: any;
};

export type ListType<T> = {
	search?: string;
	sort: string;
	page: number;
	limit: number;
	skip: number;
	docsInPage: number;
	totalDocs: number;
	totalPages: number;
	fields: string;
	doc: T[];
};

/**
 * Example
 * 	_id: '64fad2df314843cb2762ed81';
	name: 'Asif Istiaque';
	email: 'asifistiaque.ai@gmail.com';
	role: 'super-admin';
	isActive: true;
	permissions: [];
	createdAt: '2023-09-08T07:53:03.509Z';
	updatedAt: '2023-09-08T07:53:03.509Z';
    __v: 0;
 */
