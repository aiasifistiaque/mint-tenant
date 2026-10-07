import { useGetByIdQuery } from '..';

const useGetItemNameById = ({ path, id }: { path: string; id: string }) => {
	const { data, isLoading, isFetching } = useGetByIdQuery(
		{
			path,
			id,
		},
		{
			skip: !id || !path,
		}
	);
	if (isLoading || isFetching) return { name: '', image: '', code: '', display: id };
	if (!data) return { name: '', image: '', code: '', display: id };
	if (data)
		return {
			name: data?.name,
			image: data?.image,
			code: data?.code,
			display: data?.code || data?.name || id,
		};
	return { name: '', image: '', code: '', display: id };
};

export default useGetItemNameById;
