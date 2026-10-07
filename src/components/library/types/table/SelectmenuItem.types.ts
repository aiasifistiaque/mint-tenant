/**
 * Represents the different types of items that can be used in a select menu.
 */
type Item =
	| 'edit'
	| 'delete'
	| 'custom'
	| 'edit-select'
	| 'edit-data-select'
	| 'export'
	| 'update-api'
	| 'calculate'
	| 'marketing-sms';

/**
 * Represents a prompt with an optional title and body.
 */
type Prompt = {
	title?: string;
	body?: string;
	successMsg?: string;
};

/**
 * Represents the base structure for a menu item.
 */
type BaseItem = {
	/**
	 * The title of the menu item.
	 */
	title: string;

	/**
	 * An optional key for the menu item.
	 */
	key?: string;

	/**
	 * The type of the menu item.
	 */
	type: Item;

	/**
	 * An optional prompt associated with the menu item.
	 */
	prompt?: Prompt;

	/**
	 * The type of the key, which can be a string, array, or object.
	 */
	keyType?: 'string' | 'array' | 'object';
};

/**
 * Represents a select menu item with options.
 */
type SelectMenuItem = BaseItem & {
	/**
	 * The type of the menu item, which is 'edit-select'.
	 */
	type: 'edit-select';

	/**
	 * The options available in the select menu.
	 */
	options: { label: string; value: any }[];
};

/**
 * Represents a data select menu item with a data path and optional data model.
 */
type DataSelectMenu = BaseItem & {
	/**
	 * The type of the menu item, which is 'edit-data-select'.
	 */
	type: 'edit-data-select';

	/**
	 * The path to the data used in the select menu.
	 */
	dataPath: string;

	/**
	 * An optional data model associated with the select menu.
	 */
	dataModel?: any;
};

/**
 * Represents other types of menu items that are not select or data select.
 */
type OtherMenuItem = BaseItem & {
	/**
	 * The type of the menu item, excluding 'edit-select' and 'edit-data-select'.
	 */
	type: Exclude<Item, 'edit-select' | 'edit-data-select'>;

	/**
	 * Options are not applicable for other menu items.
	 */
	options?: never;

	/**
	 * Data path is not applicable for other menu items.
	 */
	dataPath?: never;

	/**
	 * Data model is not applicable for other menu items.
	 */
	dataModel?: never;

	/**
	 * An optional value associated with the menu item.
	 */
	value?: any;
	/**
	 * An optional icon associated with the menu item.
	 */
	icon?: string;
};

/**
 * Represents a select menu item, data select menu item, or other menu item.
 */
export type SelectmenuItem = SelectMenuItem | DataSelectMenu | OtherMenuItem;
