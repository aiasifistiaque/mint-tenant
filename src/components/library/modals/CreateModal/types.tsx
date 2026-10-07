import { InputData } from '../..';

type CreateModalProps = {
	data: InputData<any>[];
	trigger?: any;
	path: string;
	type?: 'post' | 'update';
	id?: string;
	title?: string;
	invalidate?: any;
	children?: any;
	doc?: any;
	populate?: any;
	isMenu?: boolean;
	item?: any;
	icon?: string;
	layout?: any;
	/** Values the form starts with on open — set whether or not a field shows them (a view tab's link to its record). */
	defaults?: Record<string, any>;
	/** The header's title and the line under it, when the prompt doesn't set them ("New customer"). */
	heading?: string;
	description?: string;
	prompt?: {
		title?: string;
		/** A line under the title — set in the page builder (Add button → Form description). */
		description?: string;
		body?: string;
		btnText?: string;
		successMsg?: string;
	};
	// Controlled mode: when `open` is passed (even `false`), the dialog's open
	// state is driven by the caller instead of an internal useDisclosure, and no
	// trigger is rendered — used by TableMenu so the dialog lives outside the
	// dropdown menu's own mount lifecycle.
	open?: boolean;
	onClose?: () => void;
};

export default CreateModalProps;
