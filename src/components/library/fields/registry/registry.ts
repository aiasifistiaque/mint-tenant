import type { FieldTypeDescriptor, FieldTypeId } from './types';

// WO-09: the registry itself. Empty until WO-10 populates one descriptor per
// entry in inputDataOptions — importing this file must never throw and must
// never assume a given id has a descriptor yet (see getFieldTypeDescriptor).
const descriptors = new Map<FieldTypeId, FieldTypeDescriptor>();

/**
 * Register a descriptor. Called once per type from fields/registry/descriptors/*.ts
 * (WO-10).
 *
 * A second registration for the same id is treated as a re-import of the same
 * module, not a conflict: Turbopack's static-generation workers can end up
 * loading fields/registry/descriptors/index.ts through two separate chunk
 * files for the same worker process (its chunk graph is per-page, and a
 * shared module can land in a page-specific chunk for one page and a shared
 * chunk for another landing in the same worker) — this is bundler chunk
 * splitting, triggered by the page count/shape, not anything about a given
 * field type. `id` is typed off the same fixed union every descriptor file
 * draws from, so two source-level definitions colliding on one id is already
 * caught at the type level; re-registration in practice only ever means "this
 * exact module ran twice." First registration wins; later ones are a no-op.
 */
export const registerFieldType = (descriptor: FieldTypeDescriptor): void => {
	if (descriptors.has(descriptor.id)) return;
	descriptors.set(descriptor.id, descriptor);
};

export const getFieldTypeDescriptor = (id: FieldTypeId | string): FieldTypeDescriptor | undefined => {
	return descriptors.get(id as FieldTypeId);
};

export const getAllFieldTypeDescriptors = (): FieldTypeDescriptor[] => {
	return Array.from(descriptors.values());
};

export const hasFieldTypeDescriptor = (id: FieldTypeId | string): boolean => {
	return descriptors.has(id as FieldTypeId);
};
