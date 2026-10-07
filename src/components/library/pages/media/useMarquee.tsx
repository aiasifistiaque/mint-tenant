'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Box } from '@chakra-ui/react';

/** Pixels the pointer must travel before a press on empty space becomes a drag. */
const THRESHOLD = 4;
/** How close to the top or bottom of the window the pointer must be to scroll it. */
const EDGE = 48;
/** Presses here start their own thing (a click, typing, a menu), never a drag. */
const INTERACTIVE = 'button, a, input, textarea, select, label, [role="menuitem"], [role="dialog"], [data-media-item]';

type Point = { x: number; y: number };

/**
 * Rubber-band selection: press on empty space and drag, and every item the box
 * touches is selected. Holding ⌘/Ctrl/Shift adds to what's already selected.
 * Mouse and pen only — on a touch screen the same gesture scrolls the page.
 *
 * Items are found by `[data-key]` inside the container, so it works the same
 * for grid tiles and list rows. The start point is kept in page coordinates,
 * so the box stays anchored while the window scrolls under it.
 */
const useMarquee = ({
	selected,
	onSelect,
	disabled,
}: {
	selected: Set<string>;
	onSelect: (keys: Set<string>) => void;
	disabled?: boolean;
}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const start = useRef<Point | null>(null);
	const pointer = useRef<Point>({ x: 0, y: 0 });
	const base = useRef<Set<string>>(new Set());
	const active = useRef(false);
	/** Set when a drag ends, so the click that follows doesn't clear the selection. */
	const justDragged = useRef(false);
	const [box, setBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

	const latest = useRef({ selected, onSelect });
	latest.current = { selected, onSelect };

	const update = useCallback(() => {
		const s = start.current;
		const root = containerRef.current;
		if (!s || !root) return;
		const { x, y } = pointer.current;
		// The start point back in window coordinates, after any scrolling.
		const sx = s.x - window.scrollX;
		const sy = s.y - window.scrollY;
		const rect = {
			left: Math.min(sx, x),
			top: Math.min(sy, y),
			right: Math.max(sx, x),
			bottom: Math.max(sy, y),
		};
		setBox({ left: rect.left, top: rect.top, width: rect.right - rect.left, height: rect.bottom - rect.top });

		const next = new Set(base.current);
		root.querySelectorAll<HTMLElement>('[data-key]').forEach(el => {
			const r = el.getBoundingClientRect();
			const hit = r.left < rect.right && r.right > rect.left && r.top < rect.bottom && r.bottom > rect.top;
			if (hit) next.add(el.dataset.key as string);
		});
		const prev = latest.current.selected;
		const same = prev.size === next.size && [...next].every(k => prev.has(k));
		if (!same) latest.current.onSelect(next);
	}, []);

	useEffect(() => {
		let frame = 0;
		const scrollLoop = () => {
			if (!active.current) return;
			const { y } = pointer.current;
			const dy = y < EDGE ? -(EDGE - y) / 3 : y > window.innerHeight - EDGE ? (y - (window.innerHeight - EDGE)) / 3 : 0;
			if (dy) {
				window.scrollBy(0, dy);
				update();
			}
			frame = requestAnimationFrame(scrollLoop);
		};

		const onMove = (e: PointerEvent) => {
			if (!start.current) return;
			pointer.current = { x: e.clientX, y: e.clientY };
			if (!active.current) {
				const dx = e.clientX + window.scrollX - start.current.x;
				const dy = e.clientY + window.scrollY - start.current.y;
				if (Math.hypot(dx, dy) < THRESHOLD) return;
				active.current = true;
				frame = requestAnimationFrame(scrollLoop);
			}
			update();
		};

		const onUp = () => {
			if (active.current) {
				justDragged.current = true;
				// The click fires right after pointerup; forget the drag after it.
				setTimeout(() => (justDragged.current = false), 0);
			}
			start.current = null;
			active.current = false;
			cancelAnimationFrame(frame);
			setBox(null);
		};

		const onScroll = () => active.current && update();

		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
		window.addEventListener('pointercancel', onUp);
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => {
			cancelAnimationFrame(frame);
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
			window.removeEventListener('pointercancel', onUp);
			window.removeEventListener('scroll', onScroll);
		};
	}, [update]);

	const onPointerDown = (e: React.PointerEvent) => {
		if (disabled || e.button !== 0 || e.pointerType === 'touch') return;
		const target = e.target as HTMLElement;
		// React bubbles events out of portals (menus, dialogs) through the tree
		// they were opened from; only presses really inside the page count.
		if (!containerRef.current?.contains(target) || target.closest(INTERACTIVE)) return;
		// No text selection while dragging the box.
		e.preventDefault();
		(document.activeElement as HTMLElement | null)?.blur?.();
		start.current = { x: e.clientX + window.scrollX, y: e.clientY + window.scrollY };
		pointer.current = { x: e.clientX, y: e.clientY };
		base.current = e.shiftKey || e.metaKey || e.ctrlKey ? new Set(latest.current.selected) : new Set();
	};

	const overlay = box ? (
		<Box
			position='fixed'
			zIndex={20}
			pointerEvents='none'
			left={`${box.left}px`}
			top={`${box.top}px`}
			w={`${box.width}px`}
			h={`${box.height}px`}
			borderWidth='1px'
			borderColor='blue.500'
			bg='rgba(59, 130, 246, 0.12)'
			borderRadius='2px'
			_dark={{ borderColor: 'blue.400', bg: 'rgba(96, 165, 250, 0.16)' }}
		/>
	) : null;

	return { containerRef, onPointerDown, overlay, justDragged, dragging: !!box };
};

export default useMarquee;
