// WO-10: side-effect imports — each family file calls registerFieldType() at
// module load. Importing this file once (FormInput.tsx does, for WO-11) is
// what populates the registry.
import './text';
import './number';
import './boolean';
import './choice';
import './datetime';
import './media';
import './style';
import './composite';

import inputDataOptions from '../../../types/data-types/inputDataOptions';
import { hasFieldTypeDescriptor } from '../registry';

// WO-10 done-when: "every id in inputDataOptions has a descriptor; a test
// asserts registry keys === id list." No test runner wired into this pass, so
// enforce it the same way assertSchema does — a loud dev-only check.
if (process.env.NODE_ENV !== 'production') {
	const missing = inputDataOptions.filter(id => !hasFieldTypeDescriptor(id));
	if (missing.length > 0) {
		throw new Error(
			`[fieldTypeRegistry] missing descriptor(s) for: ${missing.join(', ')} — every id in ` +
				`inputDataOptions.ts must be registered in fields/registry/descriptors/*.tsx`
		);
	}
}
