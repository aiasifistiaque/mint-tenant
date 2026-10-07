import mainApi from './mainApi';

export const invoiceApi = mainApi.injectEndpoints({
	overrideExisting: true,
	endpoints: builder => ({
		downloadInvoicePdf: builder.mutation<
			Blob,
			{ id: string; code?: string; signed?: boolean; type?: 'bill' | 'receipt'; design?: string }
		>({
			// `design` selects the PDF layout (see backend lib/invoiceDesigns.ts); the
			// server falls back to its default when it is omitted, so leaving it unset
			// keeps the download exactly as it was before designs were switchable.
			query: ({ id, signed, type = 'bill', design }) => ({
				url: `invoices/${id}/pdf?type=${type}&signed=${signed ? 'true' : 'false'}${
					design ? `&design=${encodeURIComponent(design)}` : ''
				}`,
				method: 'GET',
				responseHandler: (response: Response) => response.blob(),
			}),
			onQueryStarted: async ({ code, type }, { queryFulfilled }) => {
				try {
					const result = await queryFulfilled;
					const url = window.URL.createObjectURL(result.data);
					const link = document.createElement('a');
					link.href = url;
					const suffix = type === 'receipt' ? '-receipt' : '';
					link.setAttribute('download', `${code || 'invoice'}${suffix}.pdf`);
					document.body.appendChild(link);
					link.click();
					link.remove();
					window.URL.revokeObjectURL(url);
				} catch {
					// Toast/error surfacing follows this mutation's isError state in the caller.
				}
			},
		}),
	}),
});

export const { useDownloadInvoicePdfMutation } = invoiceApi;
