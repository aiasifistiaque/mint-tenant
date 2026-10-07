// Import necessary constants and functions from libraries
import { BASE_LIMIT } from '../..';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define the type for the table properties
type TableProps = {
	page: number; // The current page
	limit: number; // The limit of items per page
	search?: string; // The search query
	sort: string; // The sorting order
	skip: number; // The number of items to skip
	docsInPage?: number; // The number of documents in the current page
	totalDocs?: number; // The total number of documents
	totalPages?: number; // The total number of pages
	filters?: any; // The applied filters
	unitFilters?: any; // The unit filters
	fields?: string[]; // The fields to be returned
	selected?: string[]; // The selected items
	preferences?: string[]; // The preferences
	selectedItems: any[]; // The selected items
	currentPath?: string; // The current path
	/** Desktop only: render rows as table rows, or as the mobile card grid. */
	viewMode: TableViewMode;
};

export type TableViewMode = 'table' | 'cards';

// Per browser, not per account: this is a way of looking at a page, like a
// collapsed sidebar, not data other people need to see. Keyed by table path so
// a card view on Leads doesn't follow you onto Products.
const VIEW_MODE_KEY = 'emint_table_view_mode';

const readViewModes = (): Record<string, TableViewMode> => {
	try {
		return JSON.parse(window.localStorage.getItem(VIEW_MODE_KEY) || '{}');
	} catch {
		// Blocked or corrupt storage just means everything starts as a table.
		return {};
	}
};

export const readViewMode = (path?: string): TableViewMode => {
	if (typeof window === 'undefined' || !path) return 'table';
	return readViewModes()[path] === 'cards' ? 'cards' : 'table';
};

const persistViewMode = (path: string, mode: TableViewMode) => {
	try {
		const all = readViewModes();
		if (mode === 'table') delete all[path];
		else all[path] = mode;
		window.localStorage.setItem(VIEW_MODE_KEY, JSON.stringify(all));
	} catch {
		// A preference that fails to persist is a convenience lost, not an error.
	}
};

// Define the type for the update properties
type UpdateProps = {
	page?: number; // The new page
	limit?: number; // The new limit
	search?: string; // The new search query
	sort?: string; // The new sorting order
};

// Define the type for the filter payload
type FilterPayload = any;

// Define the initial state of the table
const initialState: TableProps = {
	page: 1, // Default page is 1
	limit: BASE_LIMIT, // Default limit is BASE_LIMIT
	sort: '-createdAt', // Default sorting order is '-createdAt'
	skip: 0, // Default skip is 0
	filters: {}, // Default filters is an empty object
	preferences: [], // Default preferences is an empty array
	fields: [], // Default fields is an empty array
	selectedItems: [], // Default selected is an empty array
	currentPath: '', // Default current path is an empty string
	// Always 'table' on the server and on the first client render, so hydration
	// matches; setCurrentPath below swaps in the stored value once mounted.
	viewMode: 'table',
};
export const tableSlice = createSlice({
	name: 'table', // Name of the slice
	initialState, // Initial state
	reducers: {
		// Define a reducer for updating the table
		updateTable: (state, action: PayloadAction<UpdateProps>) => {
			if (
				action.payload.page !== state.page ||
				action.payload.search !== state.search ||
				action.payload.sort !== state.sort
			) {
				state.selectedItems = [];
			}
			// Update the state with the new properties
			state.page = action.payload.page || state.page;
			state.limit = action.payload.limit || state.limit;
			state.search = action.payload.search || state.search;
			state.sort = action.payload.sort || state.sort;
		},
		// `updateTable` falls back to the existing value for anything falsy
		// (`payload.search || state.search`), which is right for a partial
		// update — typing in the search box shouldn't reset the sort — but
		// wrong for hydrating from the URL on load, where an *absent* query
		// param means "page 1 / no search / default sort", not "leave
		// whatever was already there". This sets the values exactly as given.
		// Filters live in the same action (rather than a second `setFilters`
		// dispatch) so this is one state update, not two — react-redux can
		// render synchronously in between two separate dispatches made outside
		// a React event handler (e.g. from inside a plain `useEffect`), which
		// let a sibling effect observe page/sort already updated but filters
		// still the old value, and write that half-updated state to the URL.
		hydrateTable: (
			state,
			action: PayloadAction<{
				page: number;
				limit: number;
				search: string;
				sort: string;
				filters: FilterPayload;
			}>
		) => {
			state.page = action.payload.page;
			state.limit = action.payload.limit;
			state.search = action.payload.search;
			state.sort = action.payload.sort;
			state.filters = action.payload.filters || {};
		},
		setCurrentPath: (state, action: PayloadAction<string>) => {
			// Update the current path in the state
			state.currentPath = action.payload;
			// Each table carries its own view preference, so switching pages picks
			// up that table's stored choice rather than inheriting the last one.
			state.viewMode = readViewMode(action.payload);
		},

		setViewMode: (state, action: PayloadAction<TableViewMode>) => {
			state.viewMode = action.payload;
			if (state.currentPath) persistViewMode(state.currentPath, action.payload);
		},
		updateSearch: (state, action: PayloadAction<string>) => {
			// Update the state with the new properties
			state.search = action.payload;
			state.selectedItems = [];
		},
		// Define a reducer for applying filters
		applyFilters: (state, action: PayloadAction<FilterPayload>) => {
			// Apply the filters to the state
			const { key, value } = action.payload;
			for (const key in state.filters) {
				if (key.startsWith(action.payload.key)) {
					delete state.filters[key];
				}
			}
			state.filters[key] = value;
			state.selectedItems = [];
		},
		// Define a reducer for clearing filters
		clearFilters: state => {
			// Clear the filters in the state
			state.filters = {};
			state.selectedItems = [];
		},
		// Define a reducer for refreshing the table
		refresh: state => {
			// Reset the state to the initial state
			state.page = 1;
			state.search = '';
			state.limit = BASE_LIMIT;
			state.sort = '-createdAt';
			state.filters = {};
			state.selectedItems = [];
		},

		setFields: (state, action: PayloadAction<any>) => {
			//const { fields = [], preferences = [] } = action.payload;
			//const fields = action?.payload?.fields || [];

			state.fields = action.payload;
			//state.preferences = preferences;
		},
		setPreferences: (state, action: PayloadAction<any>) => {
			state.preferences = action.payload;
		},
		selectItem: (state, action: PayloadAction<{ id: string; isSelected?: boolean }>) => {
			const { id, isSelected = true } = action.payload;
			if (isSelected) {
				state.selectedItems.push(id);
			} else {
				state.selectedItems = state.selectedItems.filter(item => item !== id);
			}
		},
		selectAll: (state, action: PayloadAction<{ ids: string[]; isSelected?: boolean }>) => {
			const { ids, isSelected = true } = action.payload;
			if (isSelected) {
				state.selectedItems = ids;
			} else {
				state.selectedItems = [];
			}
		},
		unselectAll: state => {
			state.selectedItems = [];
		},
	},
});

// Export the actions generated by createSlice
export const {
	refresh,
	setViewMode,
	updateTable,
	hydrateTable,
	applyFilters,
	clearFilters,
	setFields,
	setPreferences,
	updateSearch,
	selectItem,
	selectAll,
	unselectAll,
	setCurrentPath,
} = tableSlice.actions;

// Export the reducer
export default tableSlice.reducer;
