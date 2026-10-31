'use client';

import { FC } from 'react';
import { Badge } from '@chakra-ui/react';
import type { DeliveryStatus, StoreDelivery } from '../../store/services/courierApi';

/**
 * What the delivery screens share (backend docs/couriers CR-07): the status
 * badge in the store's colours, and the parcel label printed for the courier.
 */

const COLOR: Record<string, string> = {
	draft: 'gray', booking: 'gray', booked: 'blue', 'pickup-pending': 'blue', 'picked-up': 'purple', 'in-transit': 'purple', 'out-for-delivery': 'cyan',
	delivered: 'green', 'partly-delivered': 'teal', 'on-hold': 'orange', 'failed-attempt': 'orange', returning: 'orange', returned: 'gray', cancelled: 'red', lost: 'red', error: 'red',
};

export const DeliveryBadge: FC<{ status?: DeliveryStatus | string; label?: string }> = ({ status, label }) =>
	status ? (
		<Badge
			colorPalette={COLOR[status] || 'gray'}
			variant='subtle'
			textTransform='none'>
			{label || status}
		</Badge>
	) : null;

/** Finished: nothing more will happen by itself. */
export const ENDED = ['delivered', 'partly-delivered', 'returned', 'cancelled', 'lost'];

/** "Sundarban | https://…/{tracking}" lines → names (the manual courier's own list). */
export const manualNames = (names: any) =>
	String(names || '')
		.split('\n')
		.map(l => l.split('|')[0].trim())
		.filter(Boolean);

/* --------------------------------------------------------------- label */

/** Code 128 (set B) as bar widths: the tracking code scanned at the courier's hub. */
const PATTERNS = [
	'212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211',
	'221132', '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113',
	'132311', '211313', '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', '231131', '213113', '213311', '213131', '311123', '311321', '331121',
	'312113', '312311', '332111', '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', '112412', '122114', '122411', '142112', '142211', '241211',
	'221114', '413111', '241112', '134111', '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', '214121', '412121', '111143', '111341', '131141',
	'114113', '114311', '411113', '411311', '113141', '114131', '311141', '411131', '211412', '211214', '211232', '2331112',
];
export const barcodeSvg = (text: string, height = 48) => {
	const chars = [...String(text)].filter(c => c.charCodeAt(0) >= 32 && c.charCodeAt(0) <= 126);
	const codes = [104, ...chars.map(c => c.charCodeAt(0) - 32)];
	const check = codes.reduce((s, c, i) => s + c * (i || 1), 0) % 103;
	const widths = [...codes, check, 106].map(c => PATTERNS[c]).join('');
	let x = 10;
	const bars: string[] = [];
	[...widths].forEach((w, i) => {
		const n = Number(w);
		if (i % 2 === 0) bars.push(`<rect x="${x}" y="0" width="${n}" height="${height}"/>`);
		x += n;
	});
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${x + 10} ${height}" width="100%" height="${height}" preserveAspectRatio="none">${bars.join('')}</svg>`;
};

const esc = (s: any) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** The parcel label (A6, or 80 mm on a receipt printer): courier, tracking barcode, recipient, cash to collect, order. */
export const labelHtml = (d: StoreDelivery, opts: { shop: string; orderCode: string; money: (n: number) => string; size?: '80mm' | 'a6' }) => {
	const w = opts.size === '80mm' ? '80mm' : '105mm';
	const code = d.trackingCode || d.consignment || d.invoice;
	return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(d.code)}</title><style>
@page { size: ${opts.size === '80mm' ? '80mm auto' : '105mm 148mm'}; margin: 4mm; }
body { font: 13px/1.35 -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: #000; margin: 0; width: ${w}; }
.row { display: flex; justify-content: space-between; gap: 8px; }
h1 { font-size: 18px; margin: 0; } h2 { font-size: 15px; margin: 6px 0 2px; }
.box { border: 1.5px solid #000; padding: 6px 8px; margin-top: 6px; }
.cod { font-size: 22px; font-weight: 800; } .muted { color: #333; font-size: 12px; } .code { font: 600 14px monospace; text-align: center; letter-spacing: 1px; }
</style></head><body>
<div class="row"><h1>${esc(d.courierName)}</h1><div class="muted">${esc(d.code)}</div></div>
<div class="box">${barcodeSvg(code)}<div class="code">${esc(code)}</div></div>
<div class="box"><div class="muted">To</div><h2>${esc(d.recipient?.name)}</h2><div>${esc(d.recipient?.phone)}</div><div>${esc([d.recipient?.address, d.recipient?.area, d.recipient?.city].filter(Boolean).join(', '))}</div></div>
<div class="box row"><div><div class="muted">Cash to collect</div><div class="cod">${esc(opts.money(Number(d.cod) || 0))}</div></div><div style="text-align:right"><div class="muted">Order</div><div><b>${esc(opts.orderCode)}</b></div><div class="muted">${d.items || 1} item(s)${d.weight ? ` · ${d.weight} kg` : ''}</div></div></div>
${d.note ? `<div class="box"><div class="muted">Note</div>${esc(d.note)}</div>` : ''}
<div class="muted" style="margin-top:6px">From ${esc(opts.shop)}</div>
</body></html>`;
};
