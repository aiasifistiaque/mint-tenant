'use client';

import { FC } from 'react';
import { Badge } from '@chakra-ui/react';
import type { CommerceView } from '../../store/services/commerceApi';

/**
 * What the Orders and Returns pages share (backend docs/ecommerce EC-09): the
 * status badges, their words, and the store tables to refresh after an action.
 */

const words = (s: string) => (s ? `${s[0].toUpperCase()}${s.slice(1)}`.replace(/-/g, ' ') : '');

const PAYMENT: Record<string, string> = { unpaid: 'red', partial: 'orange', paid: 'green', 'partially-refunded': 'purple', refunded: 'gray' };
const FULFILMENT: Record<string, string> = { unfulfilled: 'orange', confirmed: 'cyan', fulfilled: 'blue', shipped: 'purple', delivered: 'green', returned: 'gray', cancelled: 'red' };
const STATUS: Record<string, string> = { open: 'blue', completed: 'green', cancelled: 'red', held: 'gray' };
const RETURN: Record<string, string> = { requested: 'orange', approved: 'blue', received: 'purple', refunded: 'green', rejected: 'red', closed: 'gray' };

const make =
	(colors: Record<string, string>, label?: Record<string, string>): FC<{ value?: string | null }> =>
	({ value }) =>
		value ? (
			<Badge
				colorPalette={colors[value] || 'gray'}
				variant='subtle'
				textTransform='none'>
				{label?.[value] || words(value)}
			</Badge>
		) : null;

export const PaymentBadge = make(PAYMENT, { 'partially-refunded': 'Part refunded', partial: 'Part paid' });
export const FulfilmentBadge = make(FULFILMENT, { unfulfilled: 'New' });
export const OrderStatusBadge = make(STATUS);
export const ReturnBadge = make(RETURN);

export const CHANNEL: Record<string, string> = { pos: 'POS', manual: 'Phone / by hand', website: 'Website' };

/** The next fulfilment steps an order can take, as the store allows them. */
export const FULFIL_NEXT: Record<string, { to: string; label: string }[]> = {
	unfulfilled: [
		{ to: 'confirmed', label: 'Confirm order' },
		{ to: 'fulfilled', label: 'Mark packed' },
		{ to: 'shipped', label: 'Mark shipped' },
		{ to: 'delivered', label: 'Mark delivered' },
	],
	confirmed: [
		{ to: 'fulfilled', label: 'Mark packed' },
		{ to: 'shipped', label: 'Out for delivery' },
		{ to: 'delivered', label: 'Mark delivered' },
	],
	fulfilled: [
		{ to: 'shipped', label: 'Mark shipped' },
		{ to: 'delivered', label: 'Mark delivered' },
	],
	shipped: [{ to: 'delivered', label: 'Mark delivered' }],
};

/** Where a return can go by hand; refunds come from the returns engine. */
export const RETURN_NEXT: Record<string, { to: string; label: string; danger?: boolean }[]> = {
	requested: [
		{ to: 'approved', label: 'Approve' },
		{ to: 'rejected', label: 'Reject', danger: true },
	],
	approved: [
		{ to: 'received', label: 'Mark received' },
		{ to: 'rejected', label: 'Reject', danger: true },
	],
	refunded: [{ to: 'closed', label: 'Close' }],
	rejected: [{ to: 'closed', label: 'Close' }],
};

/** The store's tables an order or return action changes, so their pages refresh. */
export const storeRoutes = (store: CommerceView) =>
	(['order', 'payment', 'movement', 'stock', 'customer', 'credit', 'return'] as const).map(k => store.installed[k]?.route).filter(Boolean) as string[];

/** A field people added, shown as text. */
export const showValue = (v: any): string => {
	if (v === null || v === undefined || v === '') return '—';
	if (typeof v === 'boolean') return v ? 'Yes' : 'No';
	if (Array.isArray(v)) return v.map(showValue).join(', ');
	if (typeof v === 'object') return v.name || v.title || v.code || JSON.stringify(v);
	if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return new Date(v).toLocaleString();
	return String(v);
};
