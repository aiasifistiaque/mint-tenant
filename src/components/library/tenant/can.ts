/**
 * The tenant API's permission rule (backend library/functions/
 * tenantPermissions.function.ts `grants`), for showing only what a role can
 * use. The server checks again on every request.
 *
 * The standard keys (WO-21): `records:view|create|edit|delete` cover every
 * model's view-/create-/edit-/delete-<route>; `build` covers media too. The
 * old `data:*` / `data:view` still count.
 */
const RECORD_KEY = /^(view|create|edit|delete)-(.+)$/;

export const can = (permissions: string[] = [], key: string) => {
	if (permissions.includes('*') || permissions.includes(key)) return true;
	const record = key.match(RECORD_KEY);
	if (!record) return false;
	const [, action, route] = record;
	if (route === 'image' && permissions.includes('build')) return true;
	if (permissions.includes(`records:${action}`) || permissions.includes('data:*')) return true;
	return action === 'view' && permissions.includes('data:view');
};
