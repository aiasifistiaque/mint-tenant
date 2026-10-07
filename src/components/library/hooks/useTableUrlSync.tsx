'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from './useReduxHooks';
import { hydrateTable } from '../store/slices/tableSlice';
import { BASE_LIMIT } from '../config';

const RESERVED_KEYS = ['page', 'limit', 'search', 'sort'];
const DEFAULT_SORT = '-createdAt';

const buildParamsFrom = (searchParams: URLSearchParams) => {
	const filters: Record<string, string> = {};
	searchParams.forEach((value, key) => {
		if (!RESERVED_KEYS.includes(key)) filters[key] = value;
	});
	return {
		page: Number(searchParams.get('page')) || 1,
		limit: Number(searchParams.get('limit')) || BASE_LIMIT,
		search: searchParams.get('search') || '',
		sort: searchParams.get('sort') || DEFAULT_SORT,
		filters,
	};
};

/**
 * Keeps a table's page/search/sort/filters mirrored in the URL's query
 * string, so a refresh (or a shared/bookmarked link) lands back on the same
 * filtered, paginated view instead of resetting to page 1 with nothing
 * applied.
 *
 * Every filter value already lives in Redux as a plain string (boolean,
 * range, date and multi-select filters all encode down to one string before
 * they ever reach `state.table.filters`), so each filter key maps onto a URL
 * query param with no extra serialization.
 */
const useTableUrlSync = (path?: string) => {
	const dispatch = useAppDispatch();
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const { page, limit, search, sort, filters } = useAppSelector((state: any) => state.table);

	// Flips true once this table's own hydration dispatch has actually
	// committed to Redux — the write-out effect below gates on it so it
	// never fires with the still-default state from before hydration ran
	// and clobbers the URL the hydration effect hasn't read yet.
	const [hydrated, setHydrated] = useState(false);
	const hydratedForRef = useRef<string | undefined>(undefined);

	// URL -> Redux, once per table (and again on the browser's back/forward
	// buttons, which change `searchParams`). Once Redux already matches the
	// URL this is a no-op rather than a re-dispatch, so it can't loop against
	// the write-out effect below.
	useEffect(() => {
		if (!path) return;
		if (hydratedForRef.current !== path) {
			hydratedForRef.current = path;
			setHydrated(false);
		}

		const fromUrl = buildParamsFrom(new URLSearchParams(window.location.search));
		const alreadyMatches =
			hydrated &&
			page === fromUrl.page &&
			limit === fromUrl.limit &&
			search === fromUrl.search &&
			sort === fromUrl.sort &&
			JSON.stringify(filters || {}) === JSON.stringify(fromUrl.filters);

		if (alreadyMatches) return;

		dispatch(hydrateTable(fromUrl));
		setHydrated(true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [path, searchParams]);

	// Redux -> URL, once this table has hydrated.
	useEffect(() => {
		if (!path || !hydrated) return;

		const params = new URLSearchParams();
		if (page && page !== 1) params.set('page', String(page));
		if (limit && limit !== BASE_LIMIT) params.set('limit', String(limit));
		if (search) params.set('search', search);
		if (sort && sort !== DEFAULT_SORT) params.set('sort', sort);

		Object.entries(filters || {}).forEach(([key, value]) => {
			if (value === undefined || value === null || value === '') return;
			params.set(key, String(value));
		});

		const query = params.toString();
		if (query === new URLSearchParams(window.location.search).toString()) return;

		router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [path, hydrated, page, limit, search, sort, filters, pathname]);
};

export default useTableUrlSync;
