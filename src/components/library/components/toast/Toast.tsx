import { useEffect, FC } from 'react';
import { toaster } from '@/components/ui/toaster';

type ToastProps = {
	isError?: boolean;
	isSuccess?: boolean;
	error?: any;
	successText?: string;
	successTitle?: string;
};

const Toast: FC<ToastProps> = ({ isError, isSuccess, error, successText, successTitle }) => {
	useEffect(() => {
		if (isError) {
			toaster.create({
				title: 'Error',
				description: error?.data?.message || 'Error Loading Data',
				type: 'error',
				duration: 9000,
			});
		}
	}, [isError, error]);

	useEffect(() => {
		if (isSuccess) {
			toaster.create({
				title: successTitle || 'Success',
				description: successText || 'success',
				type: 'success',
				duration: 9000,
			});
		}
	}, [isSuccess, successText, successTitle]);

	return null;
};

export default Toast;
