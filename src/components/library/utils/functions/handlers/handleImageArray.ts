////////////////////////// VERSION FOUR
/*

REASON FOR VERSION FOUR:
1. IMPLEMENTED NESTED IMAGE UPLOAD
2. EDIT AND DELETE BUG FIXED
3. FIXED RELOAD ISSUE - PRESERVES EXISTING IMAGES WHEN ADDING NEW ONES
4. ADDED DRAG AND DROP REORDER FUNCTIONALITY

*/

import { Handler } from '.';

// Helper function to safely get nested value
const getNestedValue = (obj: any, path: string) => {
	return path.split('.').reduce((acc, part) => {
		return acc && acc[part] !== undefined ? acc[part] : [];
	}, obj);
};

// Helper function to set nested value
const setNestedValue = (obj: any, path: string, value: any) => {
	const pathArray = path.split('.');
	const lastKey = pathArray.pop()!;

	// Clone the root object
	const newObj = { ...obj };

	// Traverse the path and clone each level
	let target = newObj;
	pathArray.forEach(part => {
		if (!(part in target) || typeof target[part] !== 'object') {
			target[part] = {};
		} else {
			target[part] = { ...target[part] }; // Clone each level
		}
		target = target[part];
	});

	// Set the final value
	target[lastKey] = value;
	return newObj; // Return the updated clone
};

const handleImageArray = ({
	e,
	type,
	dataKey,
	formData,
	setFormData,
	setChangedData,
}: Handler & { dataKey: string; type?: string }) => {
	const updateNestedState = (prevState: any, isChangedData: boolean = false) => {
		// Handle reorder type differently - e is the new array
		if (type === 'reorder') {
			return setNestedValue(prevState, dataKey, e);
		}

		// Get current array from the appropriate source
		let currentArray;

		if (isChangedData) {
			// For changedData, first check if it exists, otherwise get from formData
			const changedArray = getNestedValue(prevState, dataKey);
			const originalArray = getNestedValue(formData, dataKey);

			// If changedData has the array, use it; otherwise use original formData
			currentArray =
				Array.isArray(changedArray) && changedArray.length > 0 ? changedArray : originalArray;
		} else {
			// For formData, always use the current state
			currentArray = getNestedValue(prevState, dataKey);
		}

		let updatedData;

		if (type === 'delete') {
			updatedData = Array.isArray(currentArray)
				? currentArray.filter((item: any) => item !== e)
				: [];
		} else if (type === 'add-many') {
			// Several images picked at once from the media library (see
			// UploadModal's `multiSelect`) — e is the whole batch, not one item.
			const base = Array.isArray(currentArray) ? currentArray : [];
			const incoming: any[] = Array.isArray(e) ? e : [e];
			const newOnes = incoming.filter(item => !base.includes(item));
			updatedData = [...base, ...newOnes];
		} else {
			// For add operation, ensure we're not duplicating
			if (Array.isArray(currentArray)) {
				updatedData = currentArray.includes(e)
					? currentArray // Don't add if already exists
					: [...currentArray, e]; // Add to existing array
			} else {
				updatedData = [e]; // Create new array with the item
			}
		}

		// Use the corrected setNestedValue to ensure immutability
		return setNestedValue(prevState, dataKey, updatedData);
	};

	// Update changedData with awareness of formData
	setChangedData((prevState: any) => updateNestedState(prevState, true));

	// Update formData normally
	setFormData((prevState: any) => updateNestedState(prevState, false));
};

export default handleImageArray;
