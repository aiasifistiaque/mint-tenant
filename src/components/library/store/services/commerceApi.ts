import mainApi, { routeTags } from './mainApi';

/**
 * An e-commerce project's store (backend docs/ecommerce): the setup wizard's
 * answers and status (EC-02). Backend: routes-tenant/commerce.router.ts at
 * /p/:project/commerce.
 */

const TAG = 'commerce';
export const SIDEBAR_TAGS = ['/sidebar/crm/page', '/sidebar/crm/server', '/sidebar/crm/generic', 'sidebaritems', 'sidebarcategories'];

export type CommerceSection = 'store' | 'outlets' | 'products' | 'payments' | 'returns' | 'delivery' | 'pos';
export type CommerceStep = CommerceSection | 'review';

export type CommerceOutlet = { name: string; code: string; kind: 'store' | 'warehouse'; address?: string; phone?: string };
export type CommerceTaxRate = { name: string; rate: number; default?: boolean };
export type CommerceShippingRate = { name: string; amount: number };

export type CommerceAnswers = {
	store: { currency: string; orderPrefix: string; negativeStock: boolean };
	outlets: CommerceOutlet[];
	products: { variations: boolean; options: string[]; brands: boolean; barcodes: boolean; trackStock: boolean };
	payments: { tenders: string[]; custom: string[]; gateways: string[] };
	returns: { allowed: boolean; windowDays: number; partial: boolean; restockDefault: boolean; refundMethods: string[]; storeCredit: boolean };
	delivery: { enabled: boolean; rates: CommerceShippingRate[]; couriers: string[] };
	pos: {
		receipt: { size: '80mm' | 'a4'; header: string; footer: string };
		shifts: boolean;
		held: boolean;
		discounts: boolean;
		coupons: boolean;
		tax: { mode: 'none' | 'inclusive' | 'added'; rates: CommerceTaxRate[] };
		customerRequired: boolean;
	};
};

export type CommerceOffered = {
	country: { code: string; name: string; flag: string } | null;
	currency: string;
	tenders: { id: string; label: string }[];
	gateways: { id: string; name: string }[];
	couriers: { id: string; name: string; ready: boolean }[];
	refundMethods: { id: string; label: string }[];
};

export type CommerceView = {
	status: 'new' | 'building' | 'ready' | 'failed';
	step: CommerceStep;
	answers: CommerceAnswers;
	features: string[];
	/** Each pre-built model by its key (product, order…): its name, route and id (EC-03). */
	installed: Record<string, { name: string; route: string; id: string }>;
	error: string;
	problems: string[];
	startedAt: string | null;
	finishedAt: string | null;
	offered: CommerceOffered;
	/** What each section still needs before the store can be set up. */
	needs: Partial<Record<CommerceSection, string[]>>;
};

/** One sellable variant, as the POS and the item pickers show it (EC-05). */
export type StoreItem = {
	variant: string;
	product: string;
	name: string;
	productName: string;
	title: string;
	sku: string;
	barcode: string;
	price: number;
	compareAtPrice: number | null;
	taxRate: string | null;
	category: string | null;
	trackStock: boolean;
	image: string | null;
	active: boolean;
	/** At the outlet asked about; null when none was. */
	onHand: number | null;
	totalStock: number;
};
export type StoreCatalogueProduct = { _id: string; name: string; category: string | null; image: string | null; price: number; trackStock: boolean; status: string; variants: StoreItem[] };
export type StoreCatalogue = { total: number; page: number; doc: StoreCatalogueProduct[] };
export type ProductStock = {
	outlets: { _id: string; name: string; code: string; kind: string }[];
	variants: { _id: string; title: string; sku: string; barcode: string; price: number | null; active: boolean; isDefault: boolean; total: number; stock: Record<string, { onHand: number; reorderPoint: number | null }> }[];
};

export type CommerceSaveInput = { answers?: Partial<CommerceAnswers>; step?: CommerceStep };

export const commerceApi = mainApi.enhanceEndpoints({ addTagTypes: [TAG, 'store-stock'] }).injectEndpoints({
	endpoints: builder => ({
		getCommerceSettings: builder.query<CommerceView, void>({
			query: () => 'commerce/settings',
			providesTags: [TAG],
		}),
		// A built store's settings show and hide its pages: the sidebar follows.
		saveCommerceSettings: builder.mutation<CommerceView, CommerceSaveInput>({
			query: body => ({ url: 'commerce/settings', method: 'PUT', body }),
			invalidatesTags: [TAG, ...SIDEBAR_TAGS],
		}),
		/* ------------------------------------------- catalogue and stock (EC-05) */
		getStoreCatalogue: builder.query<StoreCatalogue, { outlet?: string; q?: string; category?: string; page?: number; all?: boolean; limit?: number }>({
			query: ({ outlet, q, category, page, all, limit }) => ({ url: 'commerce/catalogue', params: { ...(outlet && { outlet }), ...(q && { q }), ...(category && { category }), ...(page && { page }), ...(all && { all: '1' }), ...(limit && { limit }) } }),
			providesTags: ['store-stock'],
		}),
		getStoreProductStock: builder.query<ProductStock, string>({
			query: id => `commerce/products/${id}/stock`,
			providesTags: ['store-stock'],
		}),
		syncStoreVariants: builder.mutation<{ doc: any[] }, { id: string; route: string }>({
			query: ({ id }) => ({ url: `commerce/products/${id}/variants`, method: 'POST', body: {} }),
			invalidatesTags: (_r, _e, { route }) => ['store-stock', ...routeTags(route, 'variants')],
		}),
		setStoreStock: builder.mutation<{ after: number | null }, { variant: string; outlet: string; onHand?: number; change?: number; reason?: string; note?: string; routes: string[] }>({
			query: ({ routes, ...body }) => ({ url: 'commerce/stock/set', method: 'POST', body }),
			invalidatesTags: (_r, _e, { routes }) => ['store-stock', ...routeTags(...routes)],
		}),
		applyStoreAdjustment: builder.mutation<{ applied: number }, { id: string; routes: string[] }>({
			query: ({ id }) => ({ url: `commerce/adjustments/${id}/apply`, method: 'POST', body: {} }),
			invalidatesTags: (_r, _e, { routes }) => ['store-stock', ...routeTags(...routes)],
		}),
		storeTransferAction: builder.mutation<{ status: string }, { id: string; action: 'send' | 'receive' | 'cancel'; routes: string[] }>({
			query: ({ id, action }) => ({ url: `commerce/transfers/${id}/${action}`, method: 'POST', body: {} }),
			invalidatesTags: (_r, _e, { routes }) => ['store-stock', ...routeTags(...routes)],
		}),

		/** Builds the store in the background (EC-03): answers 202 `building`; poll the settings for `ready` / `failed`. */
		startCommerceSetup: builder.mutation<CommerceView, void>({
			query: () => ({ url: 'commerce/setup', method: 'POST', body: {} }),
			invalidatesTags: [TAG],
		}),
	}),
});

export const {
	useGetCommerceSettingsQuery,
	useSaveCommerceSettingsMutation,
	useStartCommerceSetupMutation,
	useGetStoreCatalogueQuery,
	useLazyGetStoreCatalogueQuery,
	useGetStoreProductStockQuery,
	useSyncStoreVariantsMutation,
	useSetStoreStockMutation,
	useApplyStoreAdjustmentMutation,
	useStoreTransferActionMutation,
} = commerceApi;
