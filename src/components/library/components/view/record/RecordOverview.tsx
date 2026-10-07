'use client';

import { FC } from 'react';
import { DetailSkeleton } from '../../../cl/States';
import ConfiguredView from '../view-page/ConfiguredView';
import ViewPageBasicInfo from '../view-page/ViewPageBasicInfo';

type Props = {
	slug: string;
	id: string;
	schema: any;
	moduleData: any;
	configured: any;
	configuredLoading?: boolean;
	configuredFetching?: boolean;
	/** In a drawer: one column, whatever the section asks for. */
	compact?: boolean;
};

/**
 * A record's Overview: the route builder's view sections when there are any,
 * otherwise the fields grouped by the form layout. The view page and the
 * quick-view drawer render exactly this, so they always agree.
 */
const RecordOverview: FC<Props> = ({
	slug,
	id,
	schema,
	moduleData,
	configured,
	configuredLoading,
	configuredFetching,
	compact,
}) => {
	if (!slug || !id || !schema || configuredLoading) return <DetailSkeleton />;

	if (configured?.sections?.length)
		return (
			<ConfiguredView
				slug={slug}
				schema={schema}
				view={configured}
				isLoading={configuredFetching}
				compact={compact}
			/>
		);

	return (
		<ViewPageBasicInfo
			layout={moduleData}
			schema={schema}
			slug={slug}
			id={id}
		/>
	);
};

export default RecordOverview;
