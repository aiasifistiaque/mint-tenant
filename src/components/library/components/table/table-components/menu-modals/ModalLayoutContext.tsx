'use client';
import { createContext, useContext } from 'react';
import { useModalLayout } from '../../../..';
import { ModalLayout } from '../../../../hooks/useModalLayout';

// `MenuModal`/`Dialog` (the two root wrappers) resolve once whether THIS
// modal instance renders as a dialog or a drawer — factoring in `forceModal`,
// not just the admin's raw preference — and provide that resolved value here.
// The header/body/footer/close-button each used to call `useModalLayout()`
// independently, so a `forceModal` root rendering a Dialog could still have
// its chrome render Drawer.Header/Drawer.Footer (reading the raw, un-forced
// preference), crashing with "forgot to wrap in <Drawer.Root />". Reading the
// same resolved value here keeps every piece of one modal in agreement.
const ModalLayoutContext = createContext<ModalLayout | null>(null);

export const ModalLayoutProvider = ModalLayoutContext.Provider;

export const useResolvedModalLayout = (): ModalLayout => {
	const ctx = useContext(ModalLayoutContext);
	// Always called (hooks can't be conditional) — only used as a fallback for
	// header/body/footer instances rendered outside a MenuModal/Dialog root.
	const preference = useModalLayout();
	return ctx ?? preference;
};
