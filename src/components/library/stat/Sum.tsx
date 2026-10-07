'use client';
import { FC } from 'react';
import { currency, useGetSumQuery } from '..';
import StatTile from './StatTile';

type CountProps = {
	title: string;
	path: string;
	field: string;
	price?: boolean;
	filters?: any;
	tooltip?: string;
	href?: string;
	/** Small muted line under the number. */
	hint?: string;
};

/**
 * A server-side aggregate as a stat card. Same `StatTile` as `Count`,
 * `ShowSum` and the Heroku pages.
 */
const Sum: FC<CountProps> = ({ title, path, field, price, href, hint, filters = {} }) => {
	const { data, isFetching, isError } = useGetSumQuery({ path, field, filters }, { skip: !path });

	const total = data?.total;
	const value = price
		? // Guarded: `total` is undefined until the request lands, and calling
		  // `toLocaleString` on it threw rather than showing the skeleton.
		  `${currency.symbol}${Number(total ?? 0).toLocaleString()}`
		: total ?? '--';

	return (
		<StatTile
			label={title}
			href={href}
			hint={hint}
			isLoading={isFetching}
			value={isError ? '--' : value}
		/>
	);
};

export default Sum;
