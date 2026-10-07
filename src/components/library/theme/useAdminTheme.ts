'use client';

import { useEffect, useState } from 'react';
import { useGetSelfQuery, useUpdateSelfMutation } from '../store';
import { useAppSelector } from '../hooks';
import { toaster } from '@/components/ui/toaster';
import { applyTheme } from '@/theme/applyTheme';
import { DEFAULT_THEME, themeById } from '@/theme/palettes';

/**
 * The signed-in admin's colour theme, saved on their own record
 * (`Admin.theme`) like `modalLayout`, so it follows them between browsers.
 *
 * Choosing one applies it at once and saves it in the background; if the
 * save fails the previous theme comes back. `useGetSelfQuery({})` shares its
 * cache entry with every other caller, so this costs no extra request.
 */
const useAdminTheme = () => {
	const loggedIn = useAppSelector((state: any) => state.auth.loggedIn);
	const { data } = useGetSelfQuery({}, { skip: !loggedIn });
	const [updateSelf, { isLoading }] = useUpdateSelfMutation();
	// The choice just made, until the refetched record agrees with it.
	const [pending, setPending] = useState<string | null>(null);

	const saved = themeById(data?.theme || DEFAULT_THEME).id;
	const current = pending || saved;

	useEffect(() => {
		if (pending && pending === saved) setPending(null);
	}, [pending, saved]);

	const setTheme = async (id: string) => {
		if (id === current) return;
		setPending(id);
		applyTheme(themeById(id));
		try {
			await updateSelf({ theme: id }).unwrap();
		} catch (e: any) {
			setPending(null);
			applyTheme(themeById(saved));
			toaster.create({
				title: 'Theme not saved',
				description: e?.data?.message || 'Your previous theme is back. Try again.',
				type: 'error',
			});
		}
	};

	return { theme: current, saved, loaded: !!data, setTheme, isSaving: isLoading };
};

export default useAdminTheme;
