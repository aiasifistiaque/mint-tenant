import type { PosSetup, StoreOrderDetail } from '../../store/services/commerceApi';

/**
 * A sale's receipt (backend docs/ecommerce EC-07): one HTML page, shown in an
 * iframe on the POS and printed from it — 80 mm roll or A4, as the store's
 * Receipt settings say. Plain HTML so the printer gets exactly what's shown.
 */

const places = (currency: string) => (['JPY', 'KRW', 'VND', 'CLP', 'ISK', 'UGX', 'XAF', 'XOF'].includes(String(currency).toUpperCase()) ? 0 : 2);

/** Money in the store's currency: "BDT 1,050.00". */
export const moneyFor = (currency: string) => {
	const p = places(currency);
	const f = new Intl.NumberFormat(undefined, { minimumFractionDigits: p, maximumFractionDigits: p });
	return (n: number | null | undefined) => `${currency} ${f.format(Number(n) || 0)}`;
};

const esc = (s: any) =>
	String(s ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');

const lines = (s: string) => esc(s).replace(/\n/g, '<br>');

export const receiptHtml = (d: StoreOrderDetail, setup: Pick<PosSetup, 'currency' | 'pos'>) => {
	const m = moneyFor(setup.currency);
	const { order, payments, customer, outlet } = d;
	const roll = setup.pos.receipt.size !== 'a4';
	const header = outlet?.receiptHeader || setup.pos.receipt.header;
	const when = new Date(order.completedAt || order.createdAt).toLocaleString();
	const row = (label: string, value: string, strong = false) => `<tr class="${strong ? 'strong' : ''}"><td>${esc(label)}</td><td class="r">${esc(value)}</td></tr>`;
	const items = order.items
		.map(
			it => `<tr><td colspan="2" class="item">${esc(it.name)}${it.sku ? ` <span class="muted">${esc(it.sku)}</span>` : ''}</td></tr>
<tr><td class="muted">${it.quantity} × ${esc(m(it.unitPrice))}${it.discount ? ` − ${esc(m(it.discount))}` : ''}</td><td class="r">${esc(m(it.total))}</td></tr>`
		)
		.join('');
	const taxRow = order.tax ? row(setup.pos.taxMode === 'inclusive' ? 'Tax (included)' : 'Tax', m(order.tax)) : '';
	const paid = payments
		.filter(p => p.type === 'payment')
		.map(p => row(p.methodLabel + (p.reference ? ` · ${p.reference}` : ''), m(p.amount)) + (p.change ? row('  Cash given', m(p.tendered)) + row('  Change', m(p.change)) : ''))
		.join('');
	const refunds = payments
		.filter(p => p.type === 'refund')
		.map(p => row(`Refund · ${p.methodLabel}`, `−${m(p.amount)}`))
		.join('');
	return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(order.code)}</title><style>
@page { size: ${roll ? '80mm auto' : 'A4'}; margin: ${roll ? '4mm' : '16mm'}; }
* { box-sizing: border-box; }
body { margin: 0; padding: ${roll ? '12px' : '32px'}; font: ${roll ? '12px/1.45' : '13px/1.5'} ui-monospace, Menlo, Consolas, monospace; color: #111; background: #fff; }
.sheet { width: ${roll ? '72mm' : '100%'}; max-width: ${roll ? '72mm' : '720px'}; margin: 0 auto; }
.c { text-align: center; } .r { text-align: right; white-space: nowrap; } .muted { color: #666; }
h1 { font-size: ${roll ? '15px' : '20px'}; margin: 0 0 2px; }
table { width: 100%; border-collapse: collapse; } td { padding: 1px 0; vertical-align: top; }
.item { padding-top: 6px; } .strong td { font-weight: 700; font-size: ${roll ? '14px' : '16px'}; padding-top: 4px; }
hr { border: none; border-top: 1px dashed #999; margin: 8px 0; }
.status { display: inline-block; border: 1px solid #111; padding: 0 6px; margin-top: 4px; }
@media print { body { padding: 0; } }
</style></head><body><div class="sheet">
<div class="c">
${header ? `<div>${lines(header)}</div>` : ''}
<h1>${esc(outlet?.name || '')}</h1>
${outlet?.address ? `<div class="muted">${lines(outlet.address)}</div>` : ''}
${outlet?.phone ? `<div class="muted">${esc(outlet.phone)}</div>` : ''}
</div>
<hr>
<table>
${row('Receipt', order.code)}
${row('Date', when)}
${order.cashier ? row('Served by', order.cashier) : ''}
${customer ? row('Customer', customer.name) : ''}
</table>
${order.status === 'cancelled' ? '<div class="c"><span class="status">CANCELLED</span></div>' : ''}
<hr>
<table>${items}</table>
<hr>
<table>
${row('Subtotal', m(order.subtotal))}
${order.discount ? row('Discount', `−${m(order.discount)}`) : ''}
${order.couponCode ? row(`Coupon ${order.couponCode}`, '') : ''}
${taxRow}
${order.shipping ? row('Shipping', m(order.shipping)) : ''}
${row('Total', m(order.total), true)}
</table>
<hr>
<table>${paid}${refunds}
${order.balance > 0 ? row('Still to pay', m(order.balance), true) : ''}
</table>
${setup.pos.receipt.footer ? `<hr><div class="c">${lines(setup.pos.receipt.footer)}</div>` : ''}
</div></body></html>`;
};

/** Prints a receipt through a hidden frame (no new tab). */
export const printReceipt = (html: string) => {
	const frame = document.createElement('iframe');
	frame.setAttribute('aria-hidden', 'true');
	frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
	document.body.appendChild(frame);
	const doc = frame.contentDocument!;
	doc.open();
	doc.write(html);
	doc.close();
	setTimeout(() => {
		frame.contentWindow?.focus();
		frame.contentWindow?.print();
		setTimeout(() => frame.remove(), 1000);
	}, 100);
};
