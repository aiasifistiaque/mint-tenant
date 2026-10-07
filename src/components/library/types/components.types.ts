// import { TableProps } from '@chakra-ui/react';
import { ReactNode } from 'react';

export type CustomTableProps = any & {
	children: ReactNode;
	header?: ReactNode;
	data: any;
	isLoading: boolean;
	col?: number;
	filters?: string;
	preferences?: any;
	pagination?: boolean;
	path?: any;
	headers?: string[];
	schema: any;
	hidePreferences?: boolean;
	selectable?: boolean;
	selectedItems?: any;
	isError?: boolean;
	search?: boolean;
	showFilters?: any;
	error?: any;
	table?: any;
	select?: {
		show: boolean;
		menu: any[];
	};
};
