'use client';

import { FC, ReactNode, useEffect, useState } from 'react';
import { Button, ButtonProps, Dialog, Portal } from '@chakra-ui/react';
import AlertDialogContent from '../../../../modals/modal-components/AlertContent';
import AlertDialogHeader from '../../../../modals/modal-components/AlertDialogHeader';
import ModalFooter from '../../../../modals/modal-components/CustomModalFooter';
import { useAppDispatch } from '../../../../hooks/useReduxHooks';
import { selectAll } from '../../../../store/slices/tableSlice';
import { userApi as commonApi } from '../../../../store/services/commonApi';
import getValue from '../../../../functions/getValue';
import renderViewItem from '../../../view/utils/render-view-item/renderViewItem';
import { linkFor } from '../../../view/utils/record-link/linked';

/** The small buttons every bulk dialog's footer uses. */
export const COMPACT: ButtonProps = { size: 'xs', h: '28px', px: 3 };

/** What every bulk action is handed by the selection bar's menu. */
export type BulkProps = {
	path: string;
	/** The ticked rows' ids. */
	items: string[];
	/** The menu item's label, from the route's config. */
	title?: string;
	/** The route's config (`route` block): its status, archive, totals… */
	route?: any;
};

/** The portalled dialog the bulk actions share: header, scrolling body, footer. */
export const BulkDialog: FC<{
	open: boolean;
	onClose: () => void;
	title: ReactNode;
	children: ReactNode;
	footer?: ReactNode;
	size?: 'sm' | 'md' | 'lg' | 'xl' | 'cover';
	busy?: boolean;
}> = ({ open, onClose, title, children, footer, size = 'md', busy }) => (
	<Dialog.Root
		lazyMount
		unmountOnExit
		open={open}
		size={size}
		placement='center'
		scrollBehavior='inside'
		onOpenChange={e => !e.open && !busy && onClose()}>
		<Portal>
			<Dialog.Backdrop />
			<Dialog.Positioner>
				<AlertDialogContent>
					<AlertDialogHeader>{title}</AlertDialogHeader>
					<Dialog.Body
						px={5}
						pt={1}
						pb={5}>
						{children}
					</Dialog.Body>
					{footer && <ModalFooter>{footer}</ModalFooter>}
				</AlertDialogContent>
			</Dialog.Positioner>
		</Portal>
	</Dialog.Root>
);

export const CancelButton: FC<{ onClick: () => void; disabled?: boolean; children?: ReactNode }> = ({
	onClick,
	disabled,
	children = 'Cancel',
}) => (
	<Button
		{...COMPACT}
		variant='outline'
		disabled={disabled}
		onClick={onClick}>
		{children}
	</Button>
);

/** Clears the table's selection — after an action has used it. */
export const useClearSelection = () => {
	const dispatch = useAppDispatch();
	return () => dispatch(selectAll({ ids: [], isSelected: false }));
};

/** "1 row" / "3 rows". */
export const rows = (n: number, word = 'row') => `${n.toLocaleString()} ${word}${n === 1 ? '' : 's'}`;

/** The message from a failed request. */
export const errorOf = (e: any, fallback: string) => e?.data?.message || e?.message || fallback;

/** A record's display name. */
export const nameOf = (doc: any) => doc?.name || doc?.title || doc?.code || doc?._id || '';

/**
 * The selected records themselves, fetched once each when `enabled` (Compare,
 * Merge). In selection order.
 */
export const useRecords = (path: string, ids: string[], enabled: boolean) => {
	const dispatch = useAppDispatch();
	const [docs, setDocs] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const key = ids.join(',');
	useEffect(() => {
		if (!enabled || !path || !ids.length) return;
		let live = true;
		setLoading(true);
		setError(null);
		Promise.all(ids.map(id => dispatch(commonApi.endpoints.getById.initiate({ path, id })).unwrap()))
			.then(list => live && setDocs(list.filter(Boolean)))
			.catch(e => live && setError(errorOf(e, 'Could not load these records')))
			.finally(() => live && setLoading(false));
		return () => {
			live = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [enabled, path, key]);
	return { docs, loading, error };
};

/** A value as short comparable text — for "do these differ?". */
export const comparable = (v: any): string => {
	if (v === undefined || v === null || v === '') return '';
	if (Array.isArray(v)) return v.map(comparable).join('|');
	if (typeof v === 'object') return String(v._id ?? JSON.stringify(v));
	return String(v);
};

/**
 * One field of one record, drawn the way the view page draws it (ViewRow) —
 * a linked record as its name with a link, a tag list, a date, a masked password.
 */
export const renderField = (f: any, doc: any): ReactNode =>
	renderViewItem({
		type: f.type,
		children: getValue({ dataKey: f.dataKey, type: f.type, data: doc }),
		colorPalette: f.colorPalette,
		path: f.model || f.path,
		originalType: f.originalType,
		id: f.idKey ? getValue({ dataKey: f.idKey, type: f.type, data: doc }) : undefined,
		link: !f.noLink && linkFor(f, doc),
		dataModel: f.dataModel,
	});
