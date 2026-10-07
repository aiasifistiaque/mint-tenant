import { Badge } from '@chakra-ui/react';
import { useGetByIdQuery } from '../../../../store';

const RenderTag = ({ path, item }: { path: string; item: any }) => {
	const { data, isFetching } = useGetByIdQuery({ path, id: item });
	return <Badge>{isFetching ? 'Fetching Data' : data?.name}</Badge>;
};

export default RenderTag;
