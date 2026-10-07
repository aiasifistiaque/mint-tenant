'use client';

import { useEffect, useState } from 'react';
import { TOKEN_NAME } from '..';

type UseAuthReturnProps = {
	isLoading: boolean;
	isLoggedIn: boolean | undefined;
	token: string;
};

const useAuth = (): UseAuthReturnProps => {
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isLoggedIn, setIsLoggedIn] = useState<boolean | undefined>(undefined);
	const [authToken, setAuthToken] = useState<string>('');

	useEffect(() => {
		if (typeof window !== 'undefined') {
			const storedToken = localStorage.getItem(TOKEN_NAME);
			// Signing out stores the string 'null'.
			const token = storedToken && storedToken !== 'null' && storedToken !== 'undefined' ? storedToken : null;

			if (token != null) {
				setAuthToken(token);
				setIsLoggedIn(true);
			} else {
				setIsLoggedIn(false);
			}
			setIsLoading(false);
		}
	}, []);

	return { isLoading, isLoggedIn, token: authToken };
};

export default useAuth;
