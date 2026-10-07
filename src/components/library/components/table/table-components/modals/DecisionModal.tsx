'use client';

import { FC } from 'react';

import { useCustomToast, useUpdateByIdMutation, ConfirmModal } from '../../../..';

type DecisionModalProps = {
	itemId: string;
	path: string;
	icon?: string;
	item: {
		title?: string;
		id?: (doc: any) => string;
		path: string;
		invalidate?: string[];
		body?: object;
		bodyFn?: any;

		prompt?: {
			title: string;
			body: string;
			btnText?: string;
			successMsg?: string;
		};
	};
	doc: any;
	// Controlled mode: forwarded straight to ConfirmModal — see its comment.
	open?: boolean;
	onClose?: () => void;
};

const DecisionModal: FC<DecisionModalProps> = ({ item, doc, path, icon, itemId, open, onClose }) => {
	const { title, id, prompt, invalidate, body, bodyFn } = item;
	const getId = id ? id(doc) : itemId;
	const getBody = bodyFn ? bodyFn(doc) : body;

	const [trigger, result] = useUpdateByIdMutation();
	const { isSuccess, isLoading } = result;

	const handleSubmit = (e: any) => {
		e.preventDefault();
		trigger({ path: path, id: getId, body: getBody, invalidate });
	};

	useCustomToast({
		successText: prompt?.successMsg || `Updated Successfully`,
		...result,
	});

	const closeItem = () => {
		result.reset();
		onClose?.();
	};

	return (
		<ConfirmModal
			title={title}
			icon={icon}
			prompt={prompt}
			isLoading={isLoading}
			isSuccess={isSuccess}
			onConfirm={handleSubmit}
			open={open}
			onClose={closeItem}
		/>
	);
};

export default DecisionModal;
