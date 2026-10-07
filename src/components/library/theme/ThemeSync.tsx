'use client';

import { useEffect } from 'react';
import { useGetSelfQuery } from '../store';
import { useAppSelector } from '../hooks';
import { applyTheme } from '@/theme/applyTheme';
import { themeById } from '@/theme/palettes';

/**
 * Keeps the page in the signed-in admin's saved theme. Mounted once, in the
 * app providers.
 *
 * Before the record loads (and on the login page) the theme replayed from
 * localStorage by app/layout.tsx stays in place, so there's no flash back to
 * the default colours. Renders nothing.
 */
const ThemeSync = () => {
	const loggedIn = useAppSelector((state: any) => state.auth.loggedIn);
	const { data } = useGetSelfQuery({}, { skip: !loggedIn });
	const theme = data ? themeById(data.theme).id : null;

	useEffect(() => {
		if (theme) applyTheme(themeById(theme));
	}, [theme]);

	return null;
};

export default ThemeSync;
