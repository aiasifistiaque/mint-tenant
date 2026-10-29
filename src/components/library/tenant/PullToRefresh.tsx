'use client';

import { useEffect, useRef, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { RefreshCw } from 'lucide-react';

import { useIsMobile } from '../hooks';

/**
 * Pull down to refresh, as phone apps do: drag down from the top of any page
 * and a refresh icon follows the finger; let go past the mark and the page
 * reloads. Phones only; it stays out of the way inside windows and drawers,
 * and when the page (or the list under the finger) isn't scrolled to its top.
 */

const TRIGGER = 70;
const MAX = 120;

const scrolledAway = (el: EventTarget | null) => {
	let n = el as HTMLElement | null;
	while (n && n !== document.body && n !== document.documentElement) {
		if (n.scrollTop > 0) return true;
		n = n.parentElement;
	}
	return (window.scrollY || document.documentElement.scrollTop) > 0;
};

const PullToRefresh = () => {
	const isMobile = useIsMobile();
	const [pull, setPull] = useState(0);
	const [busy, setBusy] = useState(false);
	const start = useRef<{ x: number; y: number } | null>(null);
	const pulling = useRef(false);
	const dist = useRef(0);

	useEffect(() => {
		if (!isMobile) return;
		// Ours replaces the browser's own pull-to-refresh.
		const prev = document.documentElement.style.overscrollBehaviorY;
		document.documentElement.style.overscrollBehaviorY = 'contain';

		const onStart = (e: TouchEvent) => {
			const t = e.target as HTMLElement | null;
			start.current = null;
			if (e.touches.length !== 1 || !t) return;
			if (t.closest('[role="dialog"], [data-scope="dialog"], [data-scope="menu"], input, textarea, select, [contenteditable="true"]')) return;
			if (scrolledAway(t)) return;
			start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
			pulling.current = false;
			dist.current = 0;
		};

		const onMove = (e: TouchEvent) => {
			const s = start.current;
			if (!s) return;
			const dy = e.touches[0].clientY - s.y;
			const dx = e.touches[0].clientX - s.x;
			if (!pulling.current) {
				if (dy < 0 || Math.abs(dx) > Math.abs(dy)) {
					if (dy < -8 || Math.abs(dx) > 12) start.current = null;
					return;
				}
				if (dy < 10) return;
				pulling.current = true;
			}
			// A drag with some give: the further it goes, the harder it pulls.
			dist.current = Math.min(MAX, dy * 0.5);
			setPull(dist.current);
		};

		const onEnd = () => {
			if (!start.current) return;
			start.current = null;
			if (!pulling.current) return;
			pulling.current = false;
			if (dist.current >= TRIGGER) {
				setBusy(true);
				setPull(TRIGGER * 0.7);
				setTimeout(() => window.location.reload(), 150);
			} else setPull(0);
		};

		document.addEventListener('touchstart', onStart, { passive: true });
		document.addEventListener('touchmove', onMove, { passive: true });
		document.addEventListener('touchend', onEnd);
		document.addEventListener('touchcancel', onEnd);
		return () => {
			document.documentElement.style.overscrollBehaviorY = prev;
			document.removeEventListener('touchstart', onStart);
			document.removeEventListener('touchmove', onMove);
			document.removeEventListener('touchend', onEnd);
			document.removeEventListener('touchcancel', onEnd);
		};
	}, [isMobile]);

	if (!isMobile || (pull <= 0 && !busy)) return null;

	const ready = pull >= TRIGGER;
	return (
		<Box
			position='fixed'
			top={0}
			left='50%'
			zIndex={2000}
			pointerEvents='none'
			style={{ transform: `translate(-50%, ${pull - 44}px)`, transition: pulling.current ? 'none' : 'transform .2s ease' }}>
			<Box
				display='flex'
				alignItems='center'
				justifyContent='center'
				boxSize='36px'
				borderRadius='full'
				bg='bg.panel'
				borderWidth='1px'
				borderColor='border'
				boxShadow='md'
				color={ready || busy ? 'fg' : 'fg.muted'}>
				<RefreshCw
					size={18}
					style={{
						transform: busy ? undefined : `rotate(${pull * 3}deg)`,
						animation: busy ? 'ptr-spin .8s linear infinite' : undefined,
					}}
				/>
			</Box>
			<style>{'@keyframes ptr-spin{to{transform:rotate(360deg)}}'}</style>
		</Box>
	);
};

export default PullToRefresh;
