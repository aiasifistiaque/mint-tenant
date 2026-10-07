import { TableObjectProps } from '@/components/library';
import viewAllDataFields from './data/viewCustomerDataFields';

const dataFields: TableObjectProps = {
	title: 'Customers',
	path: 'customers',
	export: true,

	data: viewAllDataFields,
};

export default dataFields;
