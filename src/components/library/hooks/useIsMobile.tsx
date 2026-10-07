'use client';

import { useSyncExternalStore } from 'react';

const MOBILE_BREAKPOINT = 800;
const DEBOUNCE_DELAY = 200;

/**
 * Is the viewport narrower than the mobile breakpoint?
 *
 * `useSyncExternalStore` rather than `useState` + `useEffect`, because this has
 * to give two different answers to two different questions and React is the
 * only thing that knows which is being asked:
 *
 * - While hydrating, the answer has to match what the server rendered (which
 *   has no `window`, so: `false`). React calls `getServerSnapshot` for that.
 * - For a component mounting *after* hydration — a dialog opened by a click —
 *   the answer should be the real viewport straight away, with no first render
 *   claiming `false` and correcting a frame later. React calls `getSnapshot`.
 *
 * The previous version tried to tell those apart with a module-level
 * `hasHydrated` flag set from the first mount effect. Hydration isn't one
 * synchronous pass though: anything hydrating after that first effect ran read
 * the real width on its first render while its server markup said otherwise,
 * which is a hydration mismatch. On a narrow viewport the filter chips rendered
 * `<PopoverTrigger>` (a <button>) on the server and the mobile `<Flex onClick>`
 * (a <div>) on the client, and React threw out the tree.
 */

const getSnapshot = () => window.innerWidth < MOBILE_BREAKPOINT;

// The server has no viewport, and this is also what React hydrates against.
const getServerSnapshot = () => false;

const subscribe = (onStoreChange: () => void) => {
	let timeout: ReturnType<typeof setTimeout>;

	// Resize fires continuously while a window is dragged; the breakpoint only
	// crosses once, so let it settle before telling React anything.
	const handleResize = () => {
		clearTimeout(timeout);
		timeout = setTimeout(onStoreChange, DEBOUNCE_DELAY);
	};

	window.addEventListener('resize', handleResize);
	return () => {
		clearTimeout(timeout);
		window.removeEventListener('resize', handleResize);
	};
};

const useIsMobile = () => useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

export default useIsMobile;
