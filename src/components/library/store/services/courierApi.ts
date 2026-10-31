import { commerceApi } from './commerceApi';
import { routeTags } from './mainApi';

/**
 * A store's couriers and deliveries (backend docs/couriers): each courier
 * account the store connects itself (CR-03), orders sent to them and the
 * parcels' way (CR-05 onwards). Backend: routes-tenant/commerce.router.ts at
 * /p/:project/commerce/couriers and /deliveries.
 */

const TAGS = ['store-couriers', 'store-deliveries'] as const;

export type CourierField = { key: string; label: string; secret: boolean; helper?: string; kind?: 'text' | 'email' };
export type CourierSettingField = { key: string; label: string; kind: 'select' | 'number' | 'text'; options?: { value: string; label: string }[]; from?: 'stores' | 'cities' | 'zones' | 'areas'; default?: any; helper?: string };
export type CourierChoice = { value: string; label: string; details?: Record<string, any> };

export type CourierCard = {
	id: string;
	name: string;
	on: boolean;
	ready: boolean;
	sandbox: boolean;
	links: { signUp: string; keys: string; webhook?: string };
	fields: { credentials: CourierField[]; settings: CourierSettingField[]; sandboxKeys?: { clientId: string; username: string } };
	ownWebhookSecret: boolean;
	connection: null | {
		mode: 'test' | 'live';
		keys: Record<string, { set: boolean; value?: string }>;
		settings: Record<string, any>;
		tested: boolean;
		test: { ok: boolean; message: string; at: string; rejected: boolean } | null;
		webhook: { url: string; secret?: string; pasted: boolean; lastAt: string | null; refusedCalls: number; panel: string | null } | null;
		sharedAccount: boolean;
		connectedBy: string;
		updatedAt: string;
	};
	warnings: string[];
};

export type DeliveryStatus =
	| 'draft' | 'booking' | 'booked' | 'pickup-pending' | 'picked-up' | 'in-transit' | 'out-for-delivery' | 'delivered' | 'partly-delivered'
	| 'on-hold' | 'failed-attempt' | 'returning' | 'returned' | 'cancelled' | 'lost' | 'error';

export type DeliveryEvent = { at: string; status: string; courierStatus: string; message: string; source: 'webhook' | 'sync' | 'staff'; by: string };

export type StoreDelivery = {
	_id: string;
	code: string;
	order: string;
	orderCode?: string;
	courier: string;
	courierName: string;
	status: DeliveryStatus;
	statusLabel: string;
	courierStatus?: string;
	courierMessage?: string;
	invoice: string;
	consignment?: string;
	trackingCode?: string;
	trackingUrl?: string;
	cod: number;
	collected: number;
	charge: number;
	recipient: { name: string; phone: string; address: string; area?: string; city?: string };
	weight?: number;
	items?: number;
	note?: string;
	options?: Record<string, string>;
	events: DeliveryEvent[];
	bookedAt?: string;
	pickedAt?: string;
	deliveredAt?: string;
	lastEventAt?: string;
	lastSyncedAt?: string;
	settled?: boolean;
	payoutRef?: string;
	error?: string;
	uncertain?: boolean;
	createdAt: string;
};

export type DeliveryDetail = {
	delivery: StoreDelivery;
	order: { _id: string; code: string; balance: number; total: number } | null;
	can: { refresh: boolean; cancel: boolean; sendAgain: boolean; move?: boolean; receive?: boolean; settle?: boolean };
	return?: { _id: string; code: string; refundDue: number; refunded: number };
};

export type AreaPicks = { city?: string; cityName?: string; zone?: string; zoneName?: string; area?: string; areaName?: string };

export type SendPrefill = {
	order: { _id: string; code: string; total: number; balance: number; fulfilment: string; status: string };
	couriers: { id: string; name: string; mode: string; settings: Record<string, any>; canCancel: boolean; canQuote: boolean; areas: { picks: AreaPicks; from: 'remembered' | 'matched' | 'none' } }[];
	active: { _id: string; code: string; courier: string; status: string; error: string; uncertain: boolean } | null;
	prefill: { courier: string; recipient: { name: string; phone: string; address: string; area: string; city: string; email: string }; cod: number; maxCod: number; weight: number; items: number; note: string };
};

export type SendInput = {
	courier: string;
	recipient?: Partial<SendPrefill['prefill']['recipient']>;
	cod?: number;
	weight?: number;
	items?: number;
	note?: string;
	options?: Record<string, string>;
	confirmNotBooked?: boolean;
};

export type DeliveryView = 'all' | 'problems' | 'pickup' | 'moving' | 'delivered' | 'returning' | 'returned' | 'cancelled';
export type DeliveryList = {
	doc: StoreDelivery[];
	total: number;
	page: number;
	totalPages: number;
	views: Record<DeliveryView, number>;
	cashWithCouriers: { total: number; byCourier: { courier: string; amount: number; deliveries: number }[] };
};

export type DeliveryRisk = {
	phone: string;
	level: 'low' | 'medium' | 'high' | 'unknown';
	summary: string;
	checkedAt: string;
	risk: { deliveryRatio: number | null; cancellationRatio: number | null; delivered: number | null; cancelled: number | null; reports: number | null; volume: string | null; categories: string[] };
};

type Routes = { routes: string[] };
const after = (routes: string[]) => ['store-deliveries', 'store-orders', 'store-stock', 'store-returns', ...routeTags(...routes)];

export const courierApi = commerceApi.enhanceEndpoints({ addTagTypes: [...TAGS] }).injectEndpoints({
	endpoints: builder => ({
		/* ---------------------------------------------- connections (CR-03) */
		getStoreCouriers: builder.query<{ couriers: CourierCard[] }, void>({
			query: () => 'commerce/couriers',
			providesTags: ['store-couriers'],
		}),
		saveStoreCourier: builder.mutation<CourierCard, { id: string; mode?: string; keys?: Record<string, string>; settings?: Record<string, any>; webhookSecret?: string; sandbox?: boolean }>({
			query: ({ id, ...body }) => ({ url: `commerce/couriers/${id}`, method: 'PUT', body }),
			invalidatesTags: ['store-couriers'],
		}),
		testStoreCourier: builder.mutation<CourierCard, string>({
			query: id => ({ url: `commerce/couriers/${id}/test`, method: 'POST', body: {} }),
			invalidatesTags: ['store-couriers'],
		}),
		renewStoreCourierSecret: builder.mutation<CourierCard, string>({
			query: id => ({ url: `commerce/couriers/${id}/webhook-secret`, method: 'POST', body: {} }),
			invalidatesTags: ['store-couriers'],
		}),
		disconnectStoreCourier: builder.mutation<{ removed: boolean }, string>({
			query: id => ({ url: `commerce/couriers/${id}`, method: 'DELETE' }),
			invalidatesTags: ['store-couriers'],
		}),
		getStoreCourierOptions: builder.query<{ choices: CourierChoice[]; cachedAt: string }, { id: string; what: string; parent?: string }>({
			query: ({ id, what, parent }) => ({ url: `commerce/couriers/${id}/options/${what}`, params: parent ? { parent } : {} }),
		}),
		/* ------------------------------------------------ deliveries (CR-05) */
		getStoreSendPrefill: builder.query<SendPrefill, string>({
			query: id => `commerce/orders/${id}/send`,
			providesTags: ['store-deliveries'],
		}),
		sendStoreOrder: builder.mutation<DeliveryDetail, { id: string } & SendInput & Routes>({
			query: ({ id, routes, ...body }) => ({ url: `commerce/orders/${id}/deliveries`, method: 'POST', body }),
			invalidatesTags: (_r, _e, { routes }) => after(routes),
		}),
		sendStoreOrders: builder.mutation<{ results: { order: string; ok: boolean; code?: string; delivery?: string; error?: string }[]; sent: number; failed: number }, { orders: string[]; courier: string; weight?: number; note?: string } & Routes>({
			query: ({ routes, ...body }) => ({ url: 'commerce/deliveries/bulk', method: 'POST', body }),
			invalidatesTags: (_r, _e, { routes }) => after(routes),
		}),
		getStoreDeliveries: builder.query<DeliveryList, { view?: DeliveryView; courier?: string; settled?: string; q?: string; page?: number; limit?: number }>({
			query: params => ({ url: 'commerce/deliveries', params: Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')) }),
			providesTags: ['store-deliveries'],
		}),
		refreshStoreDelivery: builder.mutation<DeliveryDetail, { id: string } & Routes>({
			query: ({ id }) => ({ url: `commerce/deliveries/${id}/refresh`, method: 'POST', body: {} }),
			invalidatesTags: (_r, _e, { routes }) => after(routes),
		}),
		cancelStoreDelivery: builder.mutation<DeliveryDetail, { id: string; reason?: string } & Routes>({
			query: ({ id, reason }) => ({ url: `commerce/deliveries/${id}/cancel`, method: 'POST', body: { reason } }),
			invalidatesTags: (_r, _e, { routes }) => after(routes),
		}),
		moveStoreDelivery: builder.mutation<DeliveryDetail, { id: string; to: string; collected?: number; note?: string } & Routes>({
			query: ({ id, routes, ...body }) => ({ url: `commerce/deliveries/${id}/status`, method: 'POST', body }),
			invalidatesTags: (_r, _e, { routes }) => after(routes),
		}),
		receiveStoreDelivery: builder.mutation<DeliveryDetail, { id: string; lines: { line: number; quantity: number; condition?: string; restock?: boolean }[]; note?: string } & Routes>({
			query: ({ id, routes, ...body }) => ({ url: `commerce/deliveries/${id}/receive`, method: 'POST', body }),
			invalidatesTags: (_r, _e, { routes }) => after(routes),
		}),
		settleStoreDeliveries: builder.mutation<{ settled: number; skipped: number }, { deliveries: string[]; ref?: string } & Routes>({
			query: ({ routes, ...body }) => ({ url: 'commerce/deliveries/settle', method: 'POST', body }),
			invalidatesTags: (_r, _e, { routes }) => after(routes),
		}),
		getStoreDeliveryRisk: builder.query<DeliveryRisk, { id: string; fresh?: boolean }>({
			query: ({ id, fresh }) => ({ url: `commerce/orders/${id}/risk`, params: fresh ? { fresh: '1' } : {} }),
		}),
	}),
});

export const {
	useGetStoreCouriersQuery,
	useSaveStoreCourierMutation,
	useTestStoreCourierMutation,
	useRenewStoreCourierSecretMutation,
	useDisconnectStoreCourierMutation,
	useGetStoreCourierOptionsQuery,
	useLazyGetStoreCourierOptionsQuery,
	useGetStoreSendPrefillQuery,
	useSendStoreOrderMutation,
	useSendStoreOrdersMutation,
	useGetStoreDeliveriesQuery,
	useRefreshStoreDeliveryMutation,
	useCancelStoreDeliveryMutation,
	useMoveStoreDeliveryMutation,
	useReceiveStoreDeliveryMutation,
	useSettleStoreDeliveriesMutation,
	useLazyGetStoreDeliveryRiskQuery,
} = courierApi;
