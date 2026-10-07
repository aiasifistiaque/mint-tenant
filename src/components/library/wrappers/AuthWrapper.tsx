'use client';

import { FlexProps } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { FC, useEffect, ReactNode } from 'react';

import { useAppDispatch, useAuth } from '../hooks';
import { clearFilters } from '../store';

export type FlexPropsType = FlexProps & {
	children?: ReactNode;
};

const AuthWrapper: FC<FlexPropsType> = ({ children }) => {
	const { isLoading, isLoggedIn } = useAuth();
	const dispatch = useAppDispatch();

	const router = useRouter();

	useEffect(() => {
		if (isLoading) return;
		// Only clear on an actual logout/redirect-to-login — this effect was
		// firing on every normal authenticated page load too (any time
		// `isLoading` settles, which is every mount), wiping out filters and
		// pagination a table had just hydrated from the URL a moment earlier.
		if (!isLoggedIn) {
			router.replace('/auth/login');
			dispatch(clearFilters());
		}
	}, [isLoading]);

	if (isLoading) return null;
	if (isLoggedIn) return children;
	return null;
};

export default AuthWrapper;
