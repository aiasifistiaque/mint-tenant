'use client';

import { ComponentType } from 'react';
import { useGetRouteQuery } from '../../store';
import Layout from '../../nav/Layout';
import ServerPage from './ServerPage';
import { DetailSkeleton } from '../../cl/States';

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

		if (path && isLoading)
			return (
				<Layout
					showFooter={false}
					title={props.table?.title || ''}
					path={props.layoutPath || path}>
					<DetailSkeleton />
				</Layout>
			);

		if (path && data?.path) return <ServerPage route={path} />;

		return <Page {...props} />;
	};
	Wrapped.displayName = `withPublishedConfig(${Page.displayName || Page.name || 'Page'})`;
	return Wrapped;
};

export default withPublishedConfig;
