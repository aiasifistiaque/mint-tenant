'use client';

import { useEffect } from 'react';
import { toaster } from '@/components/ui/toaster';

type ToastProps = {
	isError?: boolean;
	isSuccess?: boolean;
	error?: any;
	successText?: string;
	successTitle?: string;
	isLoading: boolean;
	/** The answer: a save that changed linked records (`linked`) says which. */
	data?: any;
};

/** "Also updated Invoice A (Status, Payment date)." — from a save's `linked`. */
export const linkedText = (linked: any) => {
	if (!Array.isArray(linked) || !linked.length) return '';
	const byRecord = new Map<string, { label: string; fields: Set<string> }>();
	for (const l of linked) {
		const key = `${l.route}:${l.id}`;
		const entry = byRecord.get(key) || { label: `${l.model || 'Record'} ${l.name || ''}`.trim(), fields: new Set<string>() };
		(l.changes || []).forEach((c: any) => entry.fields.add(c.label || c.field));
		byRecord.set(key, entry);
	}
	const parts = [...byRecord.values()].map(e => `${e.label}${e.fields.size ? ` (${[...e.fields].join(', ')})` : ''}`);
	return ` Also updated ${parts.join('; ')}.`;
};

// Chakra's toaster renders with flushSync, which React refuses inside an
// effect ("flushSync was called from inside a lifecycle method") — the toast
// could be dropped. Queued after the commit, it always shows.
const show = (options: Parameters<typeof toaster.create>[0]) => queueMicrotask(() => toaster.create(options));

const useCustomToast = ({
	isError,
	isSuccess,
	error,
	successText,
	successTitle,
	isLoading,
	data,
}: ToastProps) => {
	useEffect(() => {
		if (isLoading) return;

		if (isError) {
			show({
				title: 'Error',
				description: error?.data?.message || 'An error occurred',
				type: 'error',
				duration: 9000,
			});
		}
	}, [isError, isLoading, error]);

	useEffect(() => {
		if (isLoading) return;

		if (isSuccess) {
			show({
				title: successTitle || 'Success',
				description: (successText || 'Operation completed successfully') + linkedText(data?.linked),
				type: 'success',
				duration: 9000,
			});
		}
	}, [isSuccess, isLoading, successText, successTitle, data]);

	return null;
};

export default useCustomToast;
