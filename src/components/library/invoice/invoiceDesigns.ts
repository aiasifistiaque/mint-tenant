/**
 * The PDF layouts an admin can pick between when downloading a bill or
 * receipt. Mirrors the backend registry (lib/invoiceDesigns.ts) — ids must
 * match, since the id travels to the server as `?design=`; everything else
 * here is presentation for the picker.
 */
export type InvoiceDesignOption = {
	id: string;
	label: string;
	description: string;
};

export const INVOICE_DESIGNS: InvoiceDesignOption[] = [
	{
		id: 'v1',
		label: 'Classic',
		description: 'Dark masthead band, hairline-ruled items.',
	},
	{
		id: 'v2',
		label: 'Editorial',
		description: 'Light masthead, labelled sections, striped items, brand footer.',
	},
];

/** The design the picker opens on — the layout that was in production before
 *  designs became switchable, so an admin who ignores the picker gets exactly
 *  the PDF they have always got. */
export const DEFAULT_INVOICE_DESIGN = 'v1';
