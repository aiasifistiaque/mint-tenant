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
	store: { currency: string; orderPrefix: string; negativeStock: boolean; guestCheckout?: boolean };
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

/* ------------------------------------------------------- orders (EC-06) */

export type StoreTender = { id: string; label: string; cash?: boolean };
export type StoreDiscount = { type: 'percent' | 'amount'; value: number } | null;
export type StoreQuoteInput = {
	outlet?: string;
	customer?: string | null;
	lines: { variant: string; quantity: number; discount?: StoreDiscount }[];
	orderDiscount?: StoreDiscount;
	couponCode?: string;
	shipping?: number;
};
export type StoreQuoteLine = {
	variant: string;
	product: string;
	name: string;
	sku: string;
	quantity: number;
	unitPrice: number;
	gross: number;
	lineDiscount: number;
	couponDiscount: number;
	orderDiscount: number;
	discount: number;
	net: number;
	taxRate: number;
	tax: number;
	total: number;
	trackStock: boolean;
	available: number | null;
};
export type StoreQuote = {
	lines: StoreQuoteLine[];
	subtotal: number;
	lineDiscounts: number;
	couponDiscount: number;
	orderDiscount: number;
	discount: number;
	tax: number;
	taxMode: 'none' | 'inclusive' | 'added';
	shipping: number;
	total: number;
	coupon: { _id: string; code: string; type: string; value: number } | null;
	currency: string;
	problems: string[];
	warnings: string[];
};
export type StorePaymentInput = { method: string; amount: number; tendered?: number; reference?: string };
export type StoreShift = {
	_id: string;
	code?: string;
	register: string;
	outlet: string;
	status: 'open' | 'closed';
	openedBy: string;
	openedAt: string;
	openingFloat: number;
	cashMoves: { type: 'in' | 'out'; amount: number; reason: string; by: string; at: string }[];
	expectedCash?: number;
	countedCash?: number;
	difference?: number;
	closedAt?: string;
};
export type StoreShiftSummary = {
	shift: StoreShift;
	totals: { method: string; label: string; sales: number; refunds: number }[];
	cashIn: number;
	cashOut: number;
	expectedCash: number;
	sales: number;
};
export type PosSetup = {
	currency: string;
	features: string[];
	outlets: { _id: string; name: string; outletCode: string; address?: string; phone?: string; receiptHeader?: string }[];
	registers: { _id: string; name: string; outlet: string }[];
	tenders: StoreTender[];
	shift: StoreShift | null;
	pos: { receipt: { size: '80mm' | 'a4'; header: string; footer: string }; taxMode: 'none' | 'inclusive' | 'added'; customerRequired: boolean };
	delivery: { rates: CommerceShippingRate[] } | null;
	negativeStock: boolean;
};
export type StoreOrder = {
	_id: string;
	code: string;
	channel: 'pos' | 'manual';
	status: 'held' | 'open' | 'completed' | 'cancelled';
	outlet: string;
	customer?: string;
	items: { variant: string; product: string; name: string; sku: string; quantity: number; unitPrice: number; discount: number; tax: number; total: number; returned: number }[];
	subtotal: number;
	discount: number;
	orderDiscount: number;
	couponCode: string;
	tax: number;
	shipping: number;
	total: number;
	paid: number;
	refunded: number;
	balance: number;
	paymentStatus: string;
	fulfilment: string;
	returnedItems?: number;
	delivery?: { name?: string; phone?: string; address?: string; area?: string; rate?: string };
	courier?: Record<string, any>;
	/** On held sales: the customer's name and credit. */
	customerInfo?: { _id: string; name: string; storeCredit?: number };
	register?: string;
	shift?: string;
	cashier?: string;
	completedAt?: string;
	createdAt: string;
	note?: string;
};
export type StorePayment = {
	_id: string;
	code: string;
	type: 'payment' | 'refund';
	method: string;
	methodLabel: string;
	amount: number;
	tendered?: number;
	change?: number;
	reference?: string;
	status: string;
	by: string;
	createdAt: string;
	note?: string;
};
export type StoreOrderDetail = {
	order: StoreOrder;
	payments: StorePayment[];
	movements: any[];
	returns: any[];
	credit: any[];
	customer: { _id: string; name: string; phone?: string; email?: string; address?: string; storeCredit?: number } | null;
	outlet: { _id: string; name: string; outletCode: string; address?: string; phone?: string; receiptHeader?: string } | null;
	extra?: StoreExtraField[];
};

/* ------------------------------------------- Orders and Returns pages (EC-09) */

export type StoreOrderView = 'all' | 'today' | 'unpaid' | 'to-ship' | 'returns' | 'cancelled';
export type StoreOrderRow = StoreOrder & {
	customerInfo: { _id: string; name: string; phone?: string } | null;
	outletInfo: { _id: string; name: string; outletCode?: string } | null;
	itemCount: number;
};
export type StoreList<T, V extends string> = { doc: T[]; total: number; page: number; limit: number; views: Record<V, number> };
export type StoreOrderQuery = { view?: StoreOrderView; q?: string; channel?: string; outlet?: string; paymentStatus?: string; fulfilment?: string; page?: number; limit?: number };
/** A field people added to a store model, with the record's value (the "More details" card). */
export type StoreExtraField = { key: string; label: string; kind: string; value: any };

export type StoreReturnStatus = 'requested' | 'approved' | 'received' | 'refunded' | 'rejected' | 'closed';
export type StoreReturnView = 'all' | 'open' | 'refunded' | 'rejected';
export type StoreReturn = {
	_id: string;
	code: string;
	order: string;
	customer?: string;
	outlet?: string;
	lines: { line: number; variant: string; name: string; sku: string; quantity: number; unitRefund: number; total: number; reason?: string; condition?: string; restock?: boolean }[];
	refundDue: number;
	refunded: number;
	restocked: boolean;
	status: StoreReturnStatus;
	by?: string;
	note?: string;
	createdAt: string;
	updatedAt: string;
};
export type StoreReturnRow = StoreReturn & {
	orderInfo: { _id: string; code: string } | null;
	customerInfo: { _id: string; name: string; phone?: string } | null;
	outletInfo: { _id: string; name: string } | null;
	itemCount: number;
};
export type StoreReturnDetail = {
	return: StoreReturn;
	order: { _id: string; code: string; total: number; paid: number; refunded: number; createdAt: string; channel: string } | null;
	customer: { _id: string; name: string; phone?: string; email?: string; storeCredit?: number } | null;
	outlet: { _id: string; name: string; outletCode?: string } | null;
	payments: StorePayment[];
	movements: any[];
	extra: StoreExtraField[];
};

export type CommerceSaveInput = { answers?: Partial<CommerceAnswers>; step?: CommerceStep };

export const commerceApi = mainApi.enhanceEndpoints({ addTagTypes: [TAG, 'store-stock', 'store-orders', 'store-held', 'store-shift', 'store-returns'] }).injectEndpoints({
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

		/* ----------------------------------------------- orders and the POS (EC-06) */
		getPosSetup: builder.query<PosSetup, string | void>({
			query: register => ({ url: 'commerce/pos/setup', params: register ? { register } : {} }),
			providesTags: ['store-shift'],
		}),
		quoteStoreBasket: builder.mutation<StoreQuote, StoreQuoteInput>({
			query: body => ({ url: 'commerce/quote', method: 'POST', body }),
		}),
		lookupStoreCode: builder.query<StoreItem, { code: string; outlet?: string }>({
			query: ({ code, outlet }) => ({ url: 'commerce/lookup', params: { code, ...(outlet && { outlet }) } }),
			keepUnusedDataFor: 0,
		}),
		/** A POS sale: `routes` are the store's model routes whose tables should refresh. */
		createStoreSale: builder.mutation<StoreOrderDetail, StoreQuoteInput & { register?: string; payments: StorePaymentInput[]; note?: string; heldId?: string; routes: string[] }>({
			query: ({ routes, ...body }) => ({ url: 'commerce/sales', method: 'POST', body }),
			invalidatesTags: (_r, _e, { routes }) => ['store-stock', 'store-orders', 'store-held', 'store-shift', ...routeTags(...routes)],
		}),
		createStoreOrder: builder.mutation<StoreOrderDetail, StoreQuoteInput & { payments?: StorePaymentInput[]; note?: string; delivery?: StoreOrder['delivery']; routes: string[] }>({
			query: ({ routes, ...body }) => ({ url: 'commerce/orders', method: 'POST', body }),
			invalidatesTags: (_r, _e, { routes }) => ['store-stock', 'store-orders', ...routeTags(...routes)],
		}),
		getStoreHeld: builder.query<{ docs: StoreOrder[] }, { outlet?: string; register?: string }>({
			query: params => ({ url: 'commerce/held', params }),
			providesTags: ['store-held'],
		}),
		holdStoreSale: builder.mutation<{ doc: StoreOrder }, StoreQuoteInput & { register?: string; note?: string }>({
			query: body => ({ url: 'commerce/held', method: 'POST', body }),
			invalidatesTags: ['store-held'],
		}),
		discardStoreHeld: builder.mutation<{ ok: boolean }, string>({
			query: id => ({ url: `commerce/held/${id}`, method: 'DELETE' }),
			invalidatesTags: ['store-held'],
		}),
		/** The Orders page (EC-09): a page of orders and each quick filter's count. */
		getStoreOrders: builder.query<StoreList<StoreOrderRow, StoreOrderView>, StoreOrderQuery>({
			query: params => ({ url: 'commerce/orders', params: Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')) }),
			providesTags: ['store-orders'],
		}),
		getStoreOrder: builder.query<StoreOrderDetail, string>({
			query: id => `commerce/orders/${id}`,
			providesTags: ['store-orders'],
		}),
		payStoreOrder: builder.mutation<StoreOrderDetail, { id: string; payments: StorePaymentInput[]; register?: string; routes: string[] }>({
			query: ({ id, routes, ...body }) => ({ url: `commerce/orders/${id}/pay`, method: 'POST', body }),
			invalidatesTags: (_r, _e, { routes }) => ['store-orders', 'store-shift', ...routeTags(...routes)],
		}),
		fulfilStoreOrder: builder.mutation<StoreOrderDetail, { id: string; to: string; routes: string[] }>({
			query: ({ id, to }) => ({ url: `commerce/orders/${id}/fulfil`, method: 'POST', body: { to } }),
			invalidatesTags: (_r, _e, { routes }) => ['store-orders', ...routeTags(...routes)],
		}),
		cancelStoreOrder: builder.mutation<StoreOrderDetail, { id: string; reason?: string; register?: string; routes: string[] }>({
			query: ({ id, routes, ...body }) => ({ url: `commerce/orders/${id}/cancel`, method: 'POST', body }),
			invalidatesTags: (_r, _e, { routes }) => ['store-stock', 'store-orders', 'store-shift', ...routeTags(...routes)],
		}),
		/* ------------------------------------------------- returns (EC-09) */
		getStoreReturns: builder.query<StoreList<StoreReturnRow, StoreReturnView>, { view?: StoreReturnView; q?: string; outlet?: string; page?: number; limit?: number }>({
			query: params => ({ url: 'commerce/returns', params: Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')) }),
			providesTags: ['store-returns'],
		}),
		getStoreReturn: builder.query<StoreReturnDetail, string>({
			query: id => `commerce/returns/${id}`,
			providesTags: ['store-returns'],
		}),
		moveStoreReturn: builder.mutation<StoreReturnDetail, { id: string; to: StoreReturnStatus; note?: string; routes: string[] }>({
			query: ({ id, to, note }) => ({ url: `commerce/returns/${id}/status`, method: 'POST', body: { to, note } }),
			invalidatesTags: (_r, _e, { routes }) => ['store-returns', ...routeTags(...routes)],
		}),
		openStoreShift: builder.mutation<{ doc: StoreShift }, { register: string; openingFloat: number }>({
			query: body => ({ url: 'commerce/shifts', method: 'POST', body }),
			invalidatesTags: ['store-shift'],
		}),
		getStoreShift: builder.query<StoreShiftSummary, string>({
			query: id => `commerce/shifts/${id}`,
			providesTags: ['store-shift'],
		}),
		storeShiftCash: builder.mutation<StoreShiftSummary, { id: string; type: 'in' | 'out'; amount: number; reason?: string }>({
			query: ({ id, ...body }) => ({ url: `commerce/shifts/${id}/cash`, method: 'POST', body }),
			invalidatesTags: ['store-shift'],
		}),
		closeStoreShift: builder.mutation<StoreShiftSummary, { id: string; countedCash: number; note?: string }>({
			query: ({ id, ...body }) => ({ url: `commerce/shifts/${id}/close`, method: 'POST', body }),
			invalidatesTags: ['store-shift'],
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
	useGetPosSetupQuery,
	useQuoteStoreBasketMutation,
	useLazyLookupStoreCodeQuery,
	useCreateStoreSaleMutation,
	useCreateStoreOrderMutation,
	useGetStoreHeldQuery,
	useHoldStoreSaleMutation,
	useDiscardStoreHeldMutation,
	useGetStoreOrdersQuery,
	useGetStoreOrderQuery,
	useGetStoreReturnsQuery,
	useGetStoreReturnQuery,
	useMoveStoreReturnMutation,
	usePayStoreOrderMutation,
	useFulfilStoreOrderMutation,
	useCancelStoreOrderMutation,
	useOpenStoreShiftMutation,
	useGetStoreShiftQuery,
	useStoreShiftCashMutation,
	useCloseStoreShiftMutation,
} = commerceApi;
