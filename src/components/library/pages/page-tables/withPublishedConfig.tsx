'use client';

import { ComponentType } from 'react';
import { useGetRouteQuery } from '../../store';
import ServerPage from './ServerPage';

/**
 * Lets the route builder take over a hand-written table page.
 *
 * A page built with PageTable, BackendPageTable or ServerPageTable carries its
 * table in code. Once a table config is published for its route in the
 * builder, `/get/route` answers for it — and the page is rendered by
 * ServerPage from that published config instead, so what's configured in the
 * builder is what the admin sees. Until then `/get/route` 404s and the page
 * renders exactly as written.
 *
 * The check is one cached request per route. While it's in flight the page
 * shows a skeleton rather than the hand-written table, so a configured route
 * doesn't flash its old layout first.
 */
const withPublishedConfig = <P extends { table: any; layoutPath?: string }>(Page: ComponentType<P>) => {
	const Wrapped = (props: P) => {
		const path: string | undefined = props.table?.path;
		const { data, isLoading } = useGetRouteQuery(path as string, { skip: !path });

		// ServerPage's own loading state (it reads the same in-flight route
		// query), so the page shows one table skeleton throughout — this used to
		// be a detail-page skeleton that the table's skeleton then replaced.
		if (path && isLoading) return <ServerPage route={path} />;

		if (path && data?.path) return <ServerPage route={path} />;

		return <Page {...props} />;
	};
	Wrapped.displayName = `withPublishedConfig(${Page.displayName || Page.name || 'Page'})`;
	return Wrapped;
};

export default withPublishedConfig;
