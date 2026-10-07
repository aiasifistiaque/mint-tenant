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
				description: successText || 'Operation completed successfully',
				type: 'success',
				duration: 9000,
			});
		}
	}, [isSuccess, isLoading, successText, successTitle]);

	return null;
};

export default useCustomToast;
