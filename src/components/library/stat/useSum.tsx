import { FC } from 'react';
import { useGetSumQuery } from '..';

type CountProps = {
	path: string;
	field: string;
	filters?: any;
};

const useSum = ({ path, field, filters = {} }: CountProps): number => {
	const { data, isFetching, isError } = useGetSumQuery({ path, field, filters }, { skip: !path });
	return data?.total || 0;
};

export default useSum;
