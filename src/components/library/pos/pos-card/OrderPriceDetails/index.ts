export { default as OPDContainer } from './Container';
export { default as OPDBottomContainer } from './BottomContainer';

export type OPDProps = {
	total: number;
	subTotal: number;
	discount: number;
	shipping: number;
	vat: number;
};

export { default } from './OrderPriceDetails';
