'use client';
import { FC } from 'react';
import { useGetCountQuery } from '..';
import StatTile from './StatTile';

type CountProps = {
	title: string;
	path: string;
	filters?: any;
	tooltip?: string;
	href?: string;
	/** Small muted line under the number. */
	hint?: string;
};

/**
 * A record count as a stat card.
 *
 * Renders the shared `StatTile` — the same card the Heroku pages use — rather
 * than its own container, so the dashboard and the rest of the admin can't
 * drift apart.
 */
const Count: FC<CountProps> = ({ title, path, filters = {}, href, hint }) => {
	const { data, isFetching, isError } = useGetCountQuery({ path: path, filters }, { skip: !path });

	return (
		<StatTile
			label={title}
			href={href}
			hint={hint}
			// A failed request is not a zero. Both used to render as '--' via the
			// same branch; loading now gets the skeleton and only a real error
			// falls back to the dash.
			isLoading={isFetching}
			value={isError ? '--' : typeof data === 'number' ? data.toLocaleString() : (data ?? '--')}
		/>
	);
};

export default Count;
