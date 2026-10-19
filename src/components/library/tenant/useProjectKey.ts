import { useGetProjectKeyQuery } from '../store/services/apiBuilderApi';
import { useWorkspace } from './useWorkspace';

/**
 * The project key (backend docs/api-builder D14): it names the project on the
 * public API — every call carries ?apiKey=<key>. Read once and cached
 * (GET /p/:project/project-key); '' until it's loaded.
 */
export const useProjectKey = () => {
	const { project } = useWorkspace();
	const { data } = useGetProjectKeyQuery(undefined, { skip: !project });
	return data?.apiKey || '';
};
