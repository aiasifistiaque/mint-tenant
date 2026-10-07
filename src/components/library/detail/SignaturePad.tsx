'use client';

import { FC, PointerEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, Flex, Text } from '@chakra-ui/react';
import { Eraser, Undo2 } from 'lucide-react';

type Point = { x: number; y: number; p: number };
type Stroke = Point[];

const INK = '#111111';
const HEIGHT = 170;
/** Line width at normal pressure; a stylus goes thinner or thicker with how hard it presses. */
const BASE_WIDTH = 2.4;

const widthFor = (p: number) => BASE_WIDTH * (0.6 + Math.min(Math.max(p || 0.5, 0.1), 1) * 0.8);

/** One stroke, smoothed: a curve through the midpoints between samples. */
const drawStroke = (ctx: CanvasRenderingContext2D, s: Stroke) => {
	if (!s.length) return;
	ctx.strokeStyle = INK;
	ctx.fillStyle = INK;
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
	if (s.length === 1) {
		ctx.beginPath();
		ctx.arc(s[0].x, s[0].y, widthFor(s[0].p) / 2, 0, Math.PI * 2);
		ctx.fill();
		return;
	}
	for (let i = 1; i < s.length; i++) {
		const a = s[i - 1];
		const b = s[i];
		const prev = s[i - 2] || a;
		ctx.lineWidth = widthFor(b.p);
		ctx.beginPath();
		ctx.moveTo((prev.x + a.x) / 2, (prev.y + a.y) / 2);
		ctx.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2);
		ctx.stroke();
	}
};

/**
 * A hand-drawn signature. Pointer events, so it takes a finger or stylus on a
 * phone or tablet and a mouse or trackpad on a laptop (press and drag, or a
 * three-finger drag where that's turned on). `touch-action: none` keeps the
 * page from scrolling while signing on a phone.
 *
 * `onDone` gets a transparent PNG cropped to the ink, ready to upload like an
 * uploaded image.
 */
const SignaturePad: FC<{ onDone: (file: File) => void; busy?: boolean }> = ({ onDone, busy }) => {
	const wrapRef = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const strokes = useRef<Stroke[]>([]);
	const drawing = useRef<Stroke | null>(null);
	const [count, setCount] = useState(0);

	const redraw = useCallback(() => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext('2d');
		if (!canvas || !ctx) return;
		const dpr = window.devicePixelRatio || 1;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		strokes.current.forEach(s => drawStroke(ctx, s));
	}, []);

	// Sharp on high-density screens, and re-fitted when the box changes width.
	useEffect(() => {
		const fit = () => {
			const canvas = canvasRef.current;
			const wrap = wrapRef.current;
			if (!canvas || !wrap) return;
			const dpr = window.devicePixelRatio || 1;
			const w = wrap.getBoundingClientRect().width;
			canvas.width = Math.round(w * dpr);
			canvas.height = Math.round(HEIGHT * dpr);
			canvas.style.width = `${w}px`;
			canvas.style.height = `${HEIGHT}px`;
			redraw();
		};
		fit();
		const ro = new ResizeObserver(fit);
		if (wrapRef.current) ro.observe(wrapRef.current);
		return () => ro.disconnect();
	}, [redraw]);

	const pointOf = (e: PointerEvent<HTMLCanvasElement>): Point => {
		const r = e.currentTarget.getBoundingClientRect();
		// A mouse or trackpad reports 0.5 while pressed; touch without pressure reports 0.
		return { x: e.clientX - r.left, y: e.clientY - r.top, p: e.pressure || 0.5 };
	};

	const onDown = (e: PointerEvent<HTMLCanvasElement>) => {
		if (busy || (e.pointerType === 'mouse' && e.button !== 0)) return;
		e.preventDefault();
		// Keep receiving the stroke if it strays outside the box. Can throw for a
		// pointer the browser no longer tracks; drawing works without it.
		try {
			e.currentTarget.setPointerCapture(e.pointerId);
		} catch {}
		drawing.current = [pointOf(e)];
		strokes.current.push(drawing.current);
		redraw();
	};

	const onMove = (e: PointerEvent<HTMLCanvasElement>) => {
		if (!drawing.current) return;
		e.preventDefault();
		// Coalesced events: every sample the device took between frames, so fast
		// strokes stay smooth instead of turning into straight segments.
		const coalesced = (e.nativeEvent as any).getCoalescedEvents?.() as any[] | undefined;
		const events = coalesced?.length ? coalesced : [e.nativeEvent];
		const r = e.currentTarget.getBoundingClientRect();
		events.forEach((ev: any) => drawing.current!.push({ x: ev.clientX - r.left, y: ev.clientY - r.top, p: ev.pressure || 0.5 }));
		redraw();
	};

	const onUp = () => {
		if (!drawing.current) return;
		drawing.current = null;
		setCount(strokes.current.length);
	};

	const clear = () => {
		strokes.current = [];
		setCount(0);
		redraw();
	};

	const undo = () => {
		strokes.current.pop();
		setCount(strokes.current.length);
		redraw();
	};

	/** The ink alone: cropped to its bounds with a margin, on a transparent background. */
	const save = () => {
		const all = strokes.current.flat();
		if (!all.length) return;
		const pad = 12;
		const minX = Math.max(0, Math.min(...all.map(p => p.x)) - pad);
		const minY = Math.max(0, Math.min(...all.map(p => p.y)) - pad);
		const maxX = Math.max(...all.map(p => p.x)) + pad;
		const maxY = Math.max(...all.map(p => p.y)) + pad;
		const scale = 2;
		const out = document.createElement('canvas');
		out.width = Math.max(1, Math.round((maxX - minX) * scale));
		out.height = Math.max(1, Math.round((maxY - minY) * scale));
		const ctx = out.getContext('2d');
		if (!ctx) return;
		ctx.setTransform(scale, 0, 0, scale, -minX * scale, -minY * scale);
		strokes.current.forEach(s => drawStroke(ctx, s));
		out.toBlob(blob => {
			if (blob) onDone(new File([blob], 'signature.png', { type: 'image/png' }));
		}, 'image/png');
	};

	return (
		<Flex
			direction='column'
			gap={2}>
			<Box
				ref={wrapRef}
				position='relative'
				h={`${HEIGHT}px`}
				borderRadius='lg'
				borderWidth='1px'
				borderColor='border.emphasized'
				// Paper in both themes: the ink is dark, as on the saved image.
				bg='white'
				overflow='hidden'>
				{/* The line to sign on, behind the canvas. */}
				<Box
					position='absolute'
					left='24px'
					right='24px'
					bottom='42px'
					borderBottomWidth='1px'
					borderColor='gray.300'
					pointerEvents='none'
				/>
				<Text
					position='absolute'
					left='24px'
					bottom='20px'
					fontSize='11px'
					color='gray.500'
					pointerEvents='none'>
					{count ? '' : 'Sign here'}
				</Text>
				<canvas
					ref={canvasRef}
					aria-label='Signature pad — draw your signature'
					role='img'
					style={{ position: 'absolute', inset: 0, touchAction: 'none', cursor: 'crosshair' }}
					onPointerDown={onDown}
					onPointerMove={onMove}
					onPointerUp={onUp}
					onPointerCancel={onUp}
					onPointerLeave={onUp}
				/>
			</Box>
			<Flex
				align='center'
				justify='space-between'
				gap={2}
				flexWrap='wrap'>
				<Text
					fontSize='12px'
					color='fg.muted'>
					Draw with your finger, a stylus, a mouse or the trackpad.
				</Text>
				<Flex gap={1.5}>
					<Button
						size='xs'
						variant='ghost'
						disabled={!count || busy}
						onClick={undo}>
						<Undo2 size={13} />
						Undo
					</Button>
					<Button
						size='xs'
						variant='ghost'
						disabled={!count || busy}
						onClick={clear}>
						<Eraser size={13} />
						Clear
					</Button>
					<Button
						size='xs'
						disabled={!count}
						loading={busy}
						loadingText='Saving'
						onClick={save}>
						Use this signature
					</Button>
				</Flex>
			</Flex>
		</Flex>
	);
};

export default SignaturePad;
