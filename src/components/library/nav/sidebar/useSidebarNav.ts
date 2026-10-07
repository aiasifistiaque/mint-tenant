'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { sidebarData as fallback, useAppSelector, useGetQuery, useGetSelfQuery } from '../..';
import { homeHref } from '../../config/lib/constants/panel';

const COLLAPSED_KEY = 'emint_sidebar_collapsed';

export type NavItem = {
	href: string;
	path: string;
	icon: any;
	title: string;
	sectionTitle?: string;
	sectionIcon?: string;
	startOfSection?: boolean;
};

export type NavSection = { title: string; icon?: string; items: NavItem[] };

/**
 * Turns the flat link list into sections.
 *
 * `/sidebar/crm/:type` returns one array with `startOfSection` marking where a
 * new category begins, so grouping happens here rather than in the payload.
 * Links before the first marker (Dashboard) keep rendering ungrouped at the top.
 */
const toSections = (items: NavItem[]): { lead: NavItem[]; sections: NavSection[] } => {
	const lead: NavItem[] = [];
	const sections: NavSection[] = [];

	for (const item of items) {
		if (item?.startOfSection && item?.sectionTitle) {
			sections.push({ title: item.sectionTitle, icon: item.sectionIcon, items: [item] });
			continue;
		}

		if (sections.length) sections[sections.length - 1].items.push(item);
		else lead.push(item);
	}

	return { lead, sections };
};

/**
 * Everything the desktop sidebar and the mobile drawer share: the links,
 * grouped into sections, narrowed by the search, and which sections are
 * folded away (remembered in this browser, the same list for both).
 */
const useSidebarNav = () => {
	const sidebarType = process.env.NEXT_PUBLIC_SIDEBAR_TYPE || 'generic';

	const { data: self } = useGetSelfQuery({});
	const { data: sidebarData, isFetching } = useGetQuery({ path: `/sidebar/crm/${sidebarType}` });
	const { selected } = useAppSelector((state: any) => state.route);

	// The tenant panel shows the organization it's working in.
	const title = self?.organization?.name || self?.shop?.name || process.env.NEXT_PUBLIC_STORE_NAME || 'Admin';

	const isLoading = isFetching || !Array.isArray(sidebarData);
	const source: NavItem[] = useMemo(
		// The sidebar's Home links to '/'; in the tenant panel that's the landing page (HOME).
		() => ((isLoading ? fallback : sidebarData) as NavItem[]).map(item => ({ ...item, href: homeHref(item?.href) })),
		[isLoading, sidebarData]
	);

	const { lead, sections } = useMemo(() => toSections(source ?? []), [source]);

	const [search, setSearch] = useState('');
	const query = search.trim().toLowerCase();
	const isSearching = query.length > 0;

	const filteredLead = useMemo(
		() => (isSearching ? lead.filter(item => item.title?.toLowerCase().includes(query)) : lead),
		[lead, query, isSearching]
	);

	const filteredSections = useMemo(() => {
		if (!isSearching) return sections;

		return sections
			.map(section => {
				// A matching category name keeps its whole list, otherwise only
				// the items that actually match survive.
				const sectionMatches = section.title.toLowerCase().includes(query);
				const items = sectionMatches
					? section.items
					: section.items.filter(item => item.title?.toLowerCase().includes(query));

				return { ...section, items };
			})
			.filter(section => section.items.length > 0);
	}, [sections, query, isSearching]);

	const hasResults = filteredLead.length > 0 || filteredSections.length > 0;

	// Only collapsed sections are stored, so a newly added category is open by
	// default rather than inheriting someone's stale "everything closed" state.
	const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

	useEffect(() => {
		try {
			const raw = window.localStorage.getItem(COLLAPSED_KEY);
			if (raw) setCollapsed(JSON.parse(raw));
		} catch {
			// A blocked or corrupt store just means everything starts open.
		}
	}, []);

	const toggle = useCallback((sectionTitle: string) => {
		setCollapsed(prev => {
			const next = { ...prev, [sectionTitle]: !prev[sectionTitle] };
			if (!next[sectionTitle]) delete next[sectionTitle];

			try {
				window.localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next));
			} catch {
				// Preference is a convenience; failing to persist is not an error.
			}

			return next;
		});
	}, []);

	const isActive = useCallback(
		(section: NavSection) => section.items.some(item => item?.path && item.path === selected),
		[selected]
	);

	/**
	 * The section holding the current page, or one with a live match, always
	 * renders open — collapsing never hides where you are or what you just
	 * searched for.
	 */
	const isOpen = useCallback(
		(section: NavSection) => isSearching || isActive(section) || !collapsed[section.title],
		[isSearching, isActive, collapsed]
	);

	return {
		title,
		selected,
		isLoading,
		search,
		setSearch,
		isSearching,
		lead: filteredLead,
		sections: filteredSections,
		hasResults,
		toggle,
		isActive,
		isOpen,
	};
};

export default useSidebarNav;
