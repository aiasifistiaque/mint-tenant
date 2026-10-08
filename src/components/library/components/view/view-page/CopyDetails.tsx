'use client';

import { FC, useEffect, useState } from 'react';
import { Button } from '@chakra-ui/react';
import { Check, Copy } from 'lucide-react';
import { affixOf } from '../../../functions/affix';

/**
 * "Copy details" at the top right of a record section: its fields as plain
 * text, one per line — "Bank Name: City Bank" — ready to paste into a message
 * or an email. Fields with no value are left out; a value reads as on the
 * page (a linked record's name, Yes/No, a date, its words around it).
 */

export type DetailLine = { title: string; value: string };

const words = (v: any, type?: string): string => {
	if (v === null || v === undefined || v === '' || v === '--' || v === 'n/a') return '';
	if (Array.isArray(v)) return v.map(x => words(x, type)).filter(Boolean).join(', ');
	if (typeof v === 'boolean') return v ? 'Yes' : 'No';
	if (typeof v === 'object') return String(v.name || v.title || v.label || v.code || '');
	if (typeof v === 'number') return v.toLocaleString();
	if (type && /date/.test(type) && !Number.isNaN(Date.parse(String(v)))) {
		const d = new Date(String(v));
		return type === 'date-only' || /T00:00:00(\.000)?Z$/.test(String(v)) ? d.toLocaleDateString() : d.toLocaleString();
	}
	return String(v);
};

/** One field as a line of text, or null when it has no value. */
export const detailLine = (field: any, value: any, doc: any): DetailLine | null => {
	const text = words(value, field?.type);
	if (!text || !field?.title) return null;
	const { before, after } = affixOf(field.affix, doc);
	return { title: String(field.title), value: [before, text, after].filter(Boolean).join(' ') };
};

const CopyDetails: FC<{ lines: (DetailLine | null)[] }> = ({ lines }) => {
	const [copied, setCopied] = useState(false);
	useEffect(() => {
		if (!copied) return;
		const t = setTimeout(() => setCopied(false), 1600);
		return () => clearTimeout(t);
	}, [copied]);
	const shown = lines.filter(Boolean) as DetailLine[];
	if (!shown.length) return null;

	const copy = async () => {
		const text = shown.map(l => `${l.title}: ${l.value}`).join('\n');
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			// No clipboard permission (an http page, an old browser): the textarea way.
			const ta = document.createElement('textarea');
			ta.value = text;
			ta.style.position = 'fixed';
			ta.style.opacity = '0';
			document.body.appendChild(ta);
			ta.select();
			document.execCommand('copy');
			ta.remove();
		}
		setCopied(true);
	};

	return (
		<Button
			size='xs'
			variant='ghost'
			color={copied ? 'green.fg' : 'fg.muted'}
			_hover={{ color: copied ? 'green.fg' : 'fg' }}
			gap={1.5}
			title='Copy these details as text, one “Title: value” per line'
			onClick={copy}>
			{copied ? <Check size={14} /> : <Copy size={14} />}
			{copied ? 'Copied' : 'Copy details'}
		</Button>
	);
};

export default CopyDetails;
