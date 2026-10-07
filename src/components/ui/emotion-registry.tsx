'use client';

import { ReactNode, useState } from 'react';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { useServerInsertedHTML } from 'next/navigation';

/**
 * Chakra's styles, collected on the server and sent in <head>.
 *
 * Without it Emotion writes each server-rendered style — Chakra's global
 * css first — as a <style> tag in the middle of the page, where the client
 * renders nothing: React reports a hydration mismatch on every load (the
 * `<style data-emotion="css-global …">` against next-themes' <script>) and
 * throws the server tree away. `compat` stops the inline tags; the styles
 * each render inserted go out through useServerInsertedHTML instead, marked
 * the way Emotion looks for them when it takes over in the browser.
 */
export default function EmotionRegistry({ children }: { children: ReactNode }) {
	const [{ cache, flush }] = useState(() => {
		const cache = createCache({ key: 'css' });
		cache.compat = true;
		const insert = cache.insert;
		let inserted: { name: string; global: boolean }[] = [];
		cache.insert = (...args) => {
			const [selector, serialized] = args;
			if (cache.inserted[serialized.name] === undefined) inserted.push({ name: serialized.name, global: !selector });
			return insert(...args);
		};
		const flush = () => {
			const out = inserted;
			inserted = [];
			return out;
		};
		return { cache, flush };
	});

	useServerInsertedHTML(() => {
		const names = flush();
		if (!names.length) return null;
		const globals: { name: string; css: string }[] = [];
		let css = '';
		let ids = cache.key;
		for (const { name, global } of names) {
			const style = cache.inserted[name];
			if (typeof style !== 'string') continue;
			if (global) globals.push({ name, css: style });
			else {
				css += style;
				ids += ` ${name}`;
			}
		}
		return (
			<>
				{globals.map(g => (
					<style
						key={g.name}
						data-emotion={`${cache.key}-global ${g.name}`}
						dangerouslySetInnerHTML={{ __html: g.css }}
					/>
				))}
				{css && (
					<style
						data-emotion={ids}
						dangerouslySetInnerHTML={{ __html: css }}
					/>
				)}
			</>
		);
	});

	return <CacheProvider value={cache}>{children}</CacheProvider>;
}
