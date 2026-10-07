import { useRouter } from 'next/navigation';
import { useEffect, FC } from 'react';

type RedirectProps = {
	isSuccess: boolean;
	path: string;
	isLoading: boolean;
};

const useRedirect: FC<RedirectProps> = ({ isSuccess, path, isLoading }) => {
	const router = useRouter();
	useEffect(() => {
		if (!isLoading && isSuccess) {
			router.replace(path);
		}
	}, [isLoading]);
	return null;
};

export default useRedirect;
