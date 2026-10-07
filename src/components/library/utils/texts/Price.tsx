import { currency } from '../..';

const Price = ({ children }: { children: number }) => {
	return (
		<>
			{currency.symbol} {children?.toFixed(2).toLocaleString() || `0.00`}
		</>
	);
};

export default Price;
