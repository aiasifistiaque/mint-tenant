import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

type RedirectProps = {
	isSuccess: boolean;
	path: string;
	isLoading: boolean;
};

const useRedirect: React.FC<RedirectProps> = ({ isSuccess, path, isLoading }) => {
	const router = useRouter();
	useEffect(() => {
		if (!isLoading && isSuccess) {
			router.replace(path);
		}
	}, [isLoading]);
	return null;
};

export default useRedirect;
