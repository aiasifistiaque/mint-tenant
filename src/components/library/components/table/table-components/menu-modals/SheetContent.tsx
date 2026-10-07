'use client';

import { FC, ReactNode, useEffect, useRef } from 'react';
import { Box, Drawer, DrawerContentProps, useDrawerContext } from '@chakra-ui/react';
import { useDrag } from '@use-gesture/react';

/**
 * Where a drag may start: the grabber and the header, not the form under them.
 * Chakra's Drawer.Header carries no data-part, only its recipe class.
 */
const HANDLE = '[data-sheet-handle], .chakra-drawer__header';
/** Taps on these still work as taps; a drag never starts on them. */
const INTERACTIVE = 'button, a, input, textarea, select, [role="button"], [contenteditable="true"]';

const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';
const SETTLE_MS = 280;
const DISMISS_MS = 220;
/** Pulled down past this share of its height, the sheet closes on release… */
const CLOSE_DISTANCE = 0.25;
/** …or flicked down faster than this (px/ms), however short the pull. */
const CLOSE_VELOCITY = 0.5;

/** The pill at the top of a sheet. A 20px-tall touch target around a 4px bar. */
export const SheetGrabber = () => (
	<Box
		data-sheet-handle=''
		flexShrink={0}
		pt='10px'
		pb='6px'>
		<Box
			mx='auto'
			w='36px'
			h='4px'
			borderRadius='full'
			bg='border.emphasized'
		/>
	</Box>
);

type SheetContentProps = DrawerContentProps & {
	children: ReactNode;
	/** Draw the grabber pill at the top. On by default. */
	grabber?: boolean;
};

/**
 * A phone bottom sheet that closes with a swipe down, like a native sheet.
 *
 * Drags start on the top bar — the grabber and the header — so scrolling the
 * form or pressing into a field never moves the sheet. The sheet follows the
 * finger with the backdrop fading along; let go past a quarter of its height
 * (or flick it down) and it slides away, otherwise it springs back.
 *
 * Built on @use-gesture's `useDrag` over Chakra's own Drawer.Content, so the
 * Chakra Drawer parts (Title, CloseTrigger, Footer…) inside every modal keep
 * working. Must sit inside a `Drawer.Root`.
 */
const SheetContent: FC<SheetContentProps> = ({ children, grabber = true, css, ...props }) => {
	const drawer = useDrawerContext();
	const ref = useRef<HTMLDivElement>(null);

	const backdrop = () => {
		const id = (drawer.getBackdropProps() as any)?.id;
		return id ? document.getElementById(id) : null;
	};

	const place = (y: number, ms: number) => {
		const el = ref.current;
		if (!el) return;
		el.style.transition = ms ? `transform ${ms}ms ${EASE}` : 'none';
		el.style.transform = y ? `translate3d(0, ${y}px, 0)` : '';
		const bd = backdrop();
		if (bd) {
			bd.style.transition = ms ? `opacity ${ms}ms ${EASE}` : 'none';
			bd.style.opacity = y > 0 ? String(Math.max(0, 1 - y / el.offsetHeight)) : '';
		}
	};

	// A sheet that stays mounted between openings starts each one clean.
	useEffect(() => {
		if (!drawer.open) return;
		const el = ref.current;
		if (el) {
			el.style.animation = '';
			place(0, 0);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [drawer.open]);

	const bind = useDrag(
		({ first, last, tap, event, movement: [, my], velocity: [, vy], direction: [, dy], memo }) => {
			if (first) {
				const target = event.target as Element | null;
				memo = !!target?.closest?.(HANDLE) && !target.closest(INTERACTIVE);
			}
			if (!memo) return memo;

			const el = ref.current;
			if (!el) return memo;
			// Downward follows the finger; upward only gives a little, as a native sheet does.
			const y = my > 0 ? my : -Math.sqrt(-my) * 2;

			if (!last) {
				// The opening slide-in has run; drop it so it can't fight the drag.
				el.style.animation = 'none';
				place(y, 0);
				return memo;
			}

			const height = el.offsetHeight;
			const dismiss = !tap && my > 0 && (my > height * CLOSE_DISTANCE || (vy > CLOSE_VELOCITY && dy > 0 && my > 24));

			if (!dismiss) {
				place(0, SETTLE_MS);
				return memo;
			}

			// Slide the rest of the way out, then close with the exit animation
			// turned off — Chakra's would start again from the top and bounce.
			place(height + 32, DISMISS_MS);
			const bd = backdrop();
			if (bd) bd.style.opacity = '0';
			window.setTimeout(() => {
				if (bd) bd.style.animation = 'none';
				el.style.animation = 'none';
				drawer.setOpen(false);
			}, DISMISS_MS);
			return memo;
		},
		{ axis: 'y', filterTaps: true },
	);

	return (
		<Drawer.Content
			ref={ref}
			{...bind()}
			css={{
				// The top bar belongs to the gesture, not to the page's scrolling.
				'& [data-sheet-handle], & .chakra-drawer__header': { touchAction: 'none' },
				...(css as any),
			}}
			{...props}>
			{grabber && <SheetGrabber />}
			{children}
		</Drawer.Content>
	);
};

export default SheetContent;
