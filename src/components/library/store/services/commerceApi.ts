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
	store: { currency: string; orderPrefix: string; negativeStock: boolean; guestCheckout?: boolean; timeZone?: string };
	outlets: CommerceOutlet[];
	products: { variations: boolean; options: string[]; brands: boolean; barcodes: boolean; trackStock: boolean; collections?: boolean; discounts?: boolean };
	payments: { tenders: string[]; custom: string[]; gateways: string[] };
	returns: { allowed: boolean; windowDays: number; partial: boolean; restockDefault: boolean; refundMethods: string[]; storeCredit: boolean };
	delivery: { enabled: boolean; rates: CommerceShippingRate[]; couriers: string[] };
	pos: {
		receipt: { size: '80mm' | 'a4'; header: string; footer: string };
		shifts: boolean;
		held: boolean;
		discounts: boolean;
		coupons: boolean;
		couponBase?: 'discounted' | 'original';
		tax: { mode: 'none' | 'inclusive' | 'added'; rates: CommerceTaxRate[] };
		customerRequired: boolean;
	};
};

export type CommerceOffered = {
	country: { code: string; name: string; flag: string } | null;
	currency: string;
	timeZone?: string;
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
	/** What it sells for — its sale price when a store discount reaches it. */
	price: number;
	/** Before the store discount (backend DISCOUNTS.md DS10). */
	listPrice?: number;
	sale?: { discount: string | null; percent: number } | null;
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
	listPrice?: number;
	/** The store discount it sells at — not the cashier's line discount. */
	sale?: { discount: string | null; name: string; percent: number; amount: number } | null;
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
	items: {
		variant: string;
		product: string;
		name: string;
		sku: string;
		quantity: number;
		unitPrice: number;
		discount: number;
		tax: number;
		total: number;
		returned: number;
		/** The store discount it sold at (DISCOUNTS.md DS10). */
		listPrice?: number;
		saleName?: string;
		salePercent?: number;
		saleAmount?: number;
	}[];
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
	delivery?: { name?: string; phone?: string; address?: string; area?: string; city?: string; landmark?: string; email?: string; rate?: string };
	email?: string;
	slot?: string;
	paymentMethod?: string;
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
	/** Its parcels sent to couriers, current first (backend docs/couriers CR-05). */
	deliveries?: import('./courierApi').StoreDelivery[];
};

/* ------------------------------------------- Orders and Returns pages (EC-09) */

export type StoreOrderView = 'all' | 'today' | 'unpaid' | 'to-ship' | 'returns' | 'cancelled' | 'new' | 'confirmed' | 'out' | 'delivered';
export type StoreOrderRow = StoreOrder & {
	customerInfo: { _id: string; name: string; phone?: string } | null;
	outletInfo: { _id: string; name: string; outletCode?: string } | null;
	itemCount: number;
};
export type StoreList<T, V extends string> = { doc: T[]; total: number; page: number; limit: number; views: Record<V, number> };
export type StoreOrderQuery = { [filter: string]: any; view?: StoreOrderView; q?: string; scope?: 'pos' | 'website'; area?: string; channel?: string; outlet?: string; paymentStatus?: string; fulfilment?: string; page?: number; limit?: number };
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

/** Store search's settings (backend commerce/search/settings.ts). `enabled` null: not switched on by name yet. */
export type SearchDial = 'off' | 'low' | 'normal' | 'high';
export type StoreSearchSettings = {
	enabled: boolean | null;
	typos: 'off' | 'normal' | 'loose';
	outOfStock: 'show' | 'hide';
	dials: { popularity: SearchDial; freshness: SearchDial; sale: SearchDial; learned: SearchDial };
	learning: boolean;
	banglish: boolean;
	/** Search by meaning (SI-19): the store's switch; `meaning` says whether this server has the model. */
	semantic: boolean;
	meaning?: StoreSearchMeaning;
	defaults: Omit<StoreSearchSettings, 'defaults' | 'enabled' | 'meaning'> & { enabled: boolean };
};
/** Where the search-by-meaning model is on this server (backend search/semantic/model.ts). */
export type StoreSearchMeaning = { state: 'off' | 'missing' | 'idle' | 'loading' | 'ready' | 'failed'; loadMs?: number; error?: string; queries: number; slow: number; p50: number | null; p95: number | null; vectors?: number; due?: number };
export type StoreSearchPack = { id: string; name: string; about: string; size: number; installed: number; on: boolean };
export type StoreSearchStatus = {
	docs: number;
	products: number;
	queued: number;
	version: number;
	builtAt: string | null;
	sweptAt: string | null;
	rebuild: { status: 'running' | 'done' | 'failed'; reason?: string; startedAt?: string; finishedAt?: string; done?: number; total?: number; docs?: number; error?: string } | null;
	lastDrift: { at: string; products: number; docs: number; rebuilt: boolean } | null;
	/** The last learning run (SI-16). */
	learn?: { at: string; pairs: number; boosted: number; suggestions: number; ms: number } | null;
	/** Search by meaning (SI-19): the model, and how many products have a vector. */
	meaning?: StoreSearchMeaning;
};
/** A suggested fix for the store's search (backend commerce/search/learn.ts, SI-16 learned / SI-18 your AI). */
export type StoreSearchSuggestion = {
	_id: string;
	kind: 'synonym' | 'redirect' | 'rule';
	source: 'learned' | 'your-ai';
	key: string;
	title: string;
	why: string;
	record: any;
	evidence?: { visitors?: number; searches?: number; position?: number };
	status: 'open' | 'accepted' | 'dismissed';
	made?: string;
	updatedAt: string;
};

/** Search insights (backend commerce/search/insights.ts, docs/search SI-14). Rates are 0–1. */
export type SearchSums = { searches: number; zero: number; clicks: number; carts: number; orders: number; revenue: number; zeroRate: number; clickRate: number; conversion: number };
export type SearchQueryRow = SearchSums & { nq: string; q: string; last?: string };
export type SearchDayPoint = { day: string; searches: number; zero: number; clicks: number; orders: number; revenue: number };
export type StoreSearchInsights = {
	days: number;
	timeZone: string;
	from: string;
	to: string;
	totals: SearchSums & { visitors: number | null; searchedSessions: number | null; sessions: number | null; sessionShare: number | null };
	before: SearchSums & { visitors: number | null; searchedSessions: number | null };
	series: SearchDayPoint[];
	top: SearchQueryRow[];
	noResults: SearchQueryRow[];
	lowClicks: SearchQueryRow[];
	trending: { nq: string; q: string; searches: number; before: number; up: number; zero: number; isNew: boolean }[];
};
export type StoreSearchQueryInsight = {
	q: string;
	nq: string;
	days: number;
	totals: SearchSums & { visitors: number };
	before: SearchSums;
	series: SearchDayPoint[];
	positions: { position: string; clicks: number }[];
	next: { nq: string; q: string; times: number }[];
};
export type ProductSearchInsight = {
	indexed: boolean;
	shown: number;
	clicks: number;
	carts: number;
	orders: number;
	units: number;
	revenue: number;
	queries: { nq: string; q: string; clicks: number; carts: number; orders: number }[];
	keywords: string[];
	sold30: number;
	views30: number;
};
export type StoreSearchWeek = { days: number; totals: SearchSums; before: SearchSums; noResults: SearchQueryRow[] };
/** A search result card as the panel's explained search returns it (SI-10 / SI-15). */
export type StoreSearchCard = { _id: string; name: string; image?: string | null; price?: number; salePrice?: number; explain?: string; pinned?: number; score?: number };
export type StoreSearchRulePreview = {
	q: string;
	category: string | null;
	/** Whether the rule is whole enough to do anything; `missing` says what isn't. */
	ready: boolean;
	missing?: string;
	/** Whether the search tried sets it off. */
	fires: boolean;
	before: { doc: StoreSearchCard[]; total: number; rules: { _id: string; name: string; action: string }[]; pinned: number };
	after: StoreSearchRulePreview['before'] | null;
};
export type StoreSearchRuleTouching = { _id: string; name: string; when: string; action: string; active: boolean; live: boolean; startsAt?: string; endsAt?: string; hits: number };

export type CommerceSaveInput = { answers?: Partial<CommerceAnswers>; step?: CommerceStep };

export const commerceApi = mainApi.enhanceEndpoints({ addTagTypes: [TAG, 'store-stock', 'store-orders', 'store-held', 'store-shift', 'store-returns', 'store-search', 'store-search-status', 'store-search-suggestions'] }).injectEndpoints({
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
		/** Who holds a tax (categories, products, variants) — for the delete refusal and the inactive notice. */
		getTaxUsage: builder.query<{ usage: { categories: number; products: number; variants: number; total: number }; text: string; inactive: boolean }, string>({
			query: id => `commerce/taxes/${id}/usage`,
			providesTags: [TAG],
		}),
		/** How many of a category's products saving this tax would change — the category form's note. */
		getTaxPreview: builder.query<{ products: number; on: boolean }, { category: string; tax: string }>({
			query: ({ category, tax }) => ({ url: 'commerce/tax-preview', params: { category, tax } }),
		}),
		/** What saving a discount would do — the discount form's note (DISCOUNTS.md DS11). */
		getDiscountPreview: builder.query<{ text: string; problem?: string | null; reach: number; gets?: number; keepBigger?: number }, { id?: string; discount: any }>({
			query: ({ id, discount }) => ({ url: 'commerce/discount-preview', method: 'POST', body: { id, discount } }),
		}),
		/** Moves everything holding a tax to another, active one. */
		replaceTax: builder.mutation<{ moved: number }, { id: string; to: string }>({
			query: ({ id, to }) => ({ url: `commerce/taxes/${id}/replace`, method: 'POST', body: { to } }),
			invalidatesTags: [TAG, 'store-stock'],
		}),
		getStoreCatalogue: builder.query<StoreCatalogue, { outlet?: string; q?: string; category?: string; page?: number; all?: boolean; limit?: number }>({
			query: ({ outlet, q, category, page, all, limit }) => ({ url: 'commerce/catalogue', params: { ...(outlet && { outlet }), ...(q && { q }), ...(category && { category }), ...(page && { page }), ...(all && { all: '1' }), ...(limit && { limit }) } }),
			providesTags: ['store-stock'],
		}),
		/** The POS's category bar: active on the POS, highest Order on POS first. */
		getStoreCategories: builder.query<{ doc: { _id: string; name: string; parent: string | null; image: string | null }[] }, void>({
			query: () => 'commerce/categories',
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
		receiveStoreStock: builder.mutation<{ code: string; id: string; units: number; items: number }, { outlet: string; date?: string; note?: string; lines: { product?: string; variant?: string; quantity: number }[] }>({
			query: body => ({ url: 'commerce/stock/receive', method: 'POST', body }),
			invalidatesTags: ['store-stock', ...routeTags('stock-in', 'stock', 'stock-movements', 'products', 'variants')],
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
		returnStoreOrder: builder.mutation<any, { id: string; lines: { line: number; quantity: number; reason?: string; condition?: string; restock?: boolean }[]; refundMethod?: string; note?: string; routes: string[] }>({
			query: ({ id, routes, ...body }) => ({ url: `commerce/orders/${id}/return`, method: 'POST', body }),
			invalidatesTags: (_r, _e, { routes }) => ['store-stock', 'store-orders', 'store-returns', 'store-shift', ...routeTags(...routes)],
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

		/* ------------------------------------------- store search (backend docs/search SI-05 / SI-06) */
		getStoreSearchSettings: builder.query<StoreSearchSettings, void>({
			query: () => 'commerce/search/settings',
			providesTags: ['store-search'],
		}),
		saveStoreSearchSettings: builder.mutation<StoreSearchSettings, Partial<Omit<StoreSearchSettings, 'defaults' | 'enabled'>> & { enabled?: boolean }>({
			query: body => ({ url: 'commerce/search/settings', method: 'PUT', body }),
			invalidatesTags: ['store-search'],
		}),
		getStoreSearchStatus: builder.query<StoreSearchStatus, void>({
			query: () => 'commerce/search/status',
			providesTags: ['store-search-status'],
		}),
		rebuildStoreSearch: builder.mutation<{ started: boolean }, void>({
			query: () => ({ url: 'commerce/search/rebuild', method: 'POST', body: {} }),
			invalidatesTags: ['store-search-status'],
		}),
		getStoreSearchPacks: builder.query<StoreSearchPack[], void>({
			query: () => 'commerce/search/packs',
			providesTags: ['store-search'],
		}),
		setStoreSearchPack: builder.mutation<StoreSearchPack[], { id: string; on: boolean }>({
			query: ({ id, on }) => ({ url: `commerce/search/packs/${id}`, method: 'POST', body: { on } }),
			invalidatesTags: ['store-search'],
		}),
		getStoreSearchInsights: builder.query<StoreSearchInsights, number>({
			query: days => ({ url: 'commerce/search/insights', params: { days } }),
		}),
		getStoreSearchQueryInsight: builder.query<StoreSearchQueryInsight, { q: string; days: number }>({
			query: params => ({ url: 'commerce/search/insights/query', params }),
		}),
		getProductSearchInsight: builder.query<ProductSearchInsight, string>({
			query: id => `commerce/search/insights/product/${id}`,
		}),
		getStoreSearchWeek: builder.query<StoreSearchWeek, void>({
			query: () => 'commerce/search/insights/week',
		}),
		tryStoreSearch: builder.query<any, string>({
			query: q => ({ url: 'commerce/search/try', params: { q } }),
		}),
		// The Try search page (backend docs/search SI-17): a page of results, a sort, every result explained.
		tryStoreSearchPage: builder.query<any, { q: string; page?: number; limit?: number; sort?: string }>({
			query: params => ({ url: 'commerce/search/try', params }),
		}),
		// Search rules (backend docs/search SI-15): the editor's before / after, and the rules a search or product meets.
		previewStoreSearchRule: builder.mutation<StoreSearchRulePreview, { rule: any; q?: string }>({
			query: body => ({ url: 'commerce/search/rules/preview', method: 'POST', body }),
		}),
		getStoreSearchRulesTouching: builder.query<StoreSearchRuleTouching[], { q?: string; product?: string }>({
			query: params => ({ url: 'commerce/search/rules/touching', params }),
		}),
		// Suggested fixes (backend docs/search SI-16 / SI-18): learned from shoppers, or drafted by the owner's AI.
		getStoreSearchSuggestions: builder.query<{ open: number; doc: StoreSearchSuggestion[] }, string | void>({
			query: status => ({ url: 'commerce/search/suggestions', params: { status: status || 'open' } }),
			providesTags: ['store-search-suggestions'],
		}),
		acceptStoreSearchSuggestion: builder.mutation<{ ok: boolean; kind: string; made: string; route: string }, string>({
			query: id => ({ url: `commerce/search/suggestions/${id}/accept`, method: 'POST', body: {} }),
			invalidatesTags: ['store-search-suggestions'],
		}),
		dismissStoreSearchSuggestion: builder.mutation<{ ok: boolean }, string>({
			query: id => ({ url: `commerce/search/suggestions/${id}/dismiss`, method: 'POST', body: {} }),
			invalidatesTags: ['store-search-suggestions'],
		}),
		learnStoreSearch: builder.mutation<any, void>({
			query: () => ({ url: 'commerce/search/learn', method: 'POST', body: {} }),
			invalidatesTags: ['store-search-suggestions', 'store-search-status'],
		}),
	}),
});

export const {
	useGetStoreSearchSettingsQuery,
	useSaveStoreSearchSettingsMutation,
	useGetStoreSearchStatusQuery,
	useRebuildStoreSearchMutation,
	useGetStoreSearchPacksQuery,
	useSetStoreSearchPackMutation,
	useLazyTryStoreSearchQuery,
	useTryStoreSearchQuery,
	useLazyTryStoreSearchPageQuery,
	useGetStoreSearchInsightsQuery,
	useGetStoreSearchQueryInsightQuery,
	useGetProductSearchInsightQuery,
	useGetStoreSearchWeekQuery,
	usePreviewStoreSearchRuleMutation,
	useGetStoreSearchRulesTouchingQuery,
	useGetStoreSearchSuggestionsQuery,
	useAcceptStoreSearchSuggestionMutation,
	useDismissStoreSearchSuggestionMutation,
	useLearnStoreSearchMutation,
	useGetTaxPreviewQuery,
	useGetDiscountPreviewQuery,
	useGetTaxUsageQuery,
	useReplaceTaxMutation,
	useGetCommerceSettingsQuery,
	useSaveCommerceSettingsMutation,
	useStartCommerceSetupMutation,
	useGetStoreCatalogueQuery,
	useGetStoreCategoriesQuery,
	useLazyGetStoreCatalogueQuery,
	useGetStoreProductStockQuery,
	useSyncStoreVariantsMutation,
	useSetStoreStockMutation,
	useReceiveStoreStockMutation,
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
	useReturnStoreOrderMutation,
	useOpenStoreShiftMutation,
	useGetStoreShiftQuery,
	useStoreShiftCashMutation,
	useCloseStoreShiftMutation,
} = commerceApi;
