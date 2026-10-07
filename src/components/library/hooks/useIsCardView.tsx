'use client';

import { useAppSelector } from './useReduxHooks';
import useIsMobile from './useIsMobile';

/**
 * Should rows render as cards rather than as table rows?
 *
 * Two reasons they might. On a phone there is no room for columns, so cards are
 * the only workable layout and the viewport decides. On a desktop it is a
 * choice, made per table from the Preferences menu and remembered per browser.
 *
 * Table components ask this instead of `useIsMobile()` so the card layout has
 * one switch rather than a viewport check repeated in six places — which is
 * what made "cards on desktop" impossible to express before.
 */
const useIsCardView = (): boolean => {
	const isMobile = useIsMobile();
	const viewMode = useAppSelector((state: any) => state.table?.viewMode);

	return isMobile || viewMode === 'cards';
};

export default useIsCardView;
