'use client';

import { FC, ReactNode } from 'react';
import PromptDialog from '../modals/modal-components/PromptDialog';

type ConfirmActionProps = {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	/** What will actually happen. Plain language, no hedging. */
	consequence: ReactNode;
	confirmLabel?: string;
	destructive?: boolean;
	isLoading?: boolean;
	/**
	 * When set, the action stays disabled until the user types this exact
	 * string — the app's own name, normally.
	 */
	typeToConfirm?: string;
	children?: ReactNode;
};

/**
 * One confirm dialog for every action that changes something on Heroku.
 *
 * The `consequence` line is required rather than optional on purpose. "Are you
 * sure?" tells nobody anything; "this restarts all dynos and the app will be
 * briefly unavailable" is the thing that actually prevents the mistake.
 *
 * Drawn by PromptDialog, the same dialog as the table's delete prompts.
 */
const ConfirmAction: FC<ConfirmActionProps> = ({
	isOpen,
	onClose,
	onConfirm,
	title,
	consequence,
	confirmLabel = 'Confirm',
	destructive,
	isLoading,
	typeToConfirm,
	children,
}) => (
	<PromptDialog
		open={isOpen}
		onClose={onClose}
		onConfirm={onConfirm}
		title={title}
		description={consequence}
		tone={destructive ? 'danger' : 'default'}
		confirmLabel={confirmLabel}
		loading={isLoading}
		typeToConfirm={typeToConfirm}
		size={children ? 'md' : 'sm'}>
		{children}
	</PromptDialog>
);

export default ConfirmAction;
