'use client';

import { useMemo } from 'react';
import { useGetBuilderRoutesQuery, useGetModelBuilderOptionsQuery } from '@/components/library';

/** A model with an admin route, and every route serving it. */
export type LinkModel = { name: string; title?: string; routes: string[]; route?: string; display?: string };

/**
 * Every model with an admin route — each route's model (builder/routes), with
 * the route and display field the model builder links to (its options). What
 * the record-picker and dashboard-builder model dropdowns list; either stores
 * the route (`mainRoute`), as settings and widgets always have.
 */
export const useLinkModels = () => {
	const { data: routesData, isLoading: a } = useGetBuilderRoutesQuery();
	const { data: optionsData, isLoading: b } = useGetModelBuilderOptionsQuery();
	const models: LinkModel[] = useMemo(() => {
		const byName = new Map<string, LinkModel>();
		for (const r of routesData?.doc || []) {
			if (!r?.model || r.kind === 'custom') continue;
			const m: LinkModel = byName.get(r.model) || { name: r.model, routes: [] };
			m.routes.push(r.route);
			if (!m.title && r.title) m.title = r.title;
			byName.set(r.model, m);
		}
		for (const t of optionsData?.targets || []) {
			const m: LinkModel = byName.get(t.name) || { name: t.name, routes: t.route ? [t.route] : [] };
			Object.assign(m, { route: t.route, display: t.display, title: m.title || t.title });
			byName.set(t.name, m);
		}
		return [...byName.values()].filter(m => m.routes.length).sort((x, y) => x.name.localeCompare(y.name));
	}, [routesData, optionsData]);
	return { models, isLoading: a || b };
};

/** The route a model is linked through: the model builder's, else its first. */
export const mainRoute = (m: LinkModel) => (m.route && m.routes.includes(m.route) ? m.route : m.routes[0]);

/** "Software — Projects · /projects +1" — the route too, as a model's name isn't always its page's. */
export const modelLabel = (m: LinkModel) =>
	`${m.name}${m.title && m.title !== m.name ? ` — ${m.title}` : ''} · /${mainRoute(m)}${m.routes.length > 1 ? ` +${m.routes.length - 1}` : ''}`;
