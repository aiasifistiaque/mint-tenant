'use client';
import { FC } from 'react';
import { currency } from '..';
import StatTile from './StatTile';

type CountProps = {
	title: string;
	children: any;
	price?: boolean;
	isLoading?: boolean;
	isError?: boolean;
	tooltip?: string;
	href?: string;
	/** Small muted line under the number. */
	hint?: string;
};

/**
 * An arbitrary figure as a stat card. Shares `StatTile` with `Count` and the
 * Heroku pages so every card in the admin is the same card.
 */
const ShowSum: FC<CountProps> = ({
	title,
	children,
	price,
	isLoading = false,
	isError = false,
	href,
	hint,
}) => {
	const formatted = price
		? // `toLocaleString` is only safe on a number — this used to be called on
		  // whatever the caller passed, so a string amount threw.
		  `${currency.symbol}${Number(children ?? 0).toLocaleString()}`
		: children;

	return (
		<StatTile
			label={title}
			href={href}
			hint={hint}
			isLoading={isLoading}
			value={isError ? '--' : formatted}
		/>
	);
};

export default ShowSum;
