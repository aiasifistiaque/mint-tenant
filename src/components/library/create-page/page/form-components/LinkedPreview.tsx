'use client';

import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { useLinkedPreviewMutation } from '../../../store/services/commonApi';

/**
 * Linked Relationships (docs/linked-relationships): under the form, what
 * saving it will also change — "Will also update Invoice INV-0042: Status →
 * Paid, Payment date → 11 Oct 2026" — or why it would be refused. Asked of
 * the server (POST /<route>/linked/preview, nothing written) when a field a
 * rule reads changes, a moment after typing stops. Fields a rule still needs
 * aren't errors here — only a quiet "fill in …"; the save says so if they're
 * still blank. Only on forms whose fields
 * carry `linkedReads`; renders nothing otherwise.
 */

type Props = { fields: any[]; formData: any };

const DELAY = 500;

/** Picked records and dates as plain values the server reads. */
const plain = (v: any): any => {
	if (Array.isArray(v)) return v.map(plain);
	if (v && typeof v === 'object' && !(v instanceof Date)) return v._id ?? v.value ?? v;
	return v;
};

/** "A", "A and B", "A, B and C". */
const listOf = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

const shown = (v: string) => {
	if (/^\d{4}-\d{2}-\d{2}T/.test(v)) {
		const d = new Date(v);
		if (!isNaN(d.getTime())) return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
	}
	return v === 'empty' ? '—' : v;
};

const LinkedPreview: FC<Props> = ({ fields, formData }) => {
	const reads = useMemo(() => (fields || []).filter((f: any) => f?.name && f?.linkedReads?.length), [fields]);
	const route: string | undefined = reads[0]?.linkedRoute;
	const [ask, { data, isLoading }] = useLinkedPreviewMutation();
	const [asked, setAsked] = useState(false);
	const timer = useRef<any>(null);

	// Only the fields the rules read decide what changes.
	const key = useMemo(
		() => JSON.stringify(reads.map((f: any) => plain(formData?.[f.name]))) + String(formData?._id || ''),
		[reads, formData]
	);
	const values = useMemo(() => {
		const out: Record<string, any> = {};
		for (const [k, v] of Object.entries(formData || {})) out[k] = plain(v);
		return out;
	}, [formData]);

	useEffect(() => {
		if (!route) return;
		clearTimeout(timer.current);
		timer.current = setTimeout(() => {
			setAsked(true);
			ask({ path: route, id: formData?._id, values }).catch(() => {});
		}, DELAY);
		return () => clearTimeout(timer.current);
		// `key` stands for the values the rules read; the rest of the form doesn't matter here.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [key, route]);

	if (!route || !asked) return null;
	// One line per record, however many rules change it.
	const byRecord = new Map<string, any>();
	for (const c of (data?.changes || []) as any[]) {
		const recordKey = `${c.route}:${c.id}:${c.undo ? 'undo' : 'do'}`;
		const at = byRecord.get(recordKey) || { ...c, changes: [], rules: [] as string[] };
		for (const x of c.changes || []) if (!at.changes.some((y: any) => y.field === x.field)) at.changes.push(x);
		if (!at.rules.includes(c.rule)) at.rules.push(c.rule);
		byRecord.set(recordKey, at);
	}
	const changes: any[] = [...byRecord.values()];
	const error: string | null = data?.error?.message || null;
	const missing: string[] = data?.missing || [];
	if (!changes.length && !error && !missing.length) return null;

	if (!error && !changes.length)
		return (
			<Text
				mt={3}
				fontSize='sm'
				color='fg.muted'
				aria-live='polite'>
				Fill in {listOf(missing)} to see what saving will also change.
			</Text>
		);

	return (
		<Box
			mt={3}
			px={4}
			py={3}
			borderWidth='1px'
			borderColor={error ? 'border.error' : 'border.info'}
			bg={error ? 'bg.error' : 'bg.info'}
			borderRadius='md'
			fontSize='sm'
			opacity={isLoading ? 0.6 : 1}
			aria-live='polite'>
			{error ? (
				<Text color='fg.error'>{error}</Text>
			) : (
				<Flex
					direction='column'
					gap={1}>
					{changes.map((c: any, i: number) => (
						<Text key={i}>
							{c.undo ? 'Will put back ' : 'Will also update '}
							<strong>
								{c.model} {c.name}
							</strong>
							:{' '}
							{(c.changes || []).map((x: any, j: number) => (
								<span key={j}>
									{j > 0 && ', '}
									{x.label} → {shown(String(x.to))}
								</span>
							))}
							<Text
								as='span'
								color='fg.muted'>
								{' '}
								— {c.rules.join(', ')}
							</Text>
						</Text>
					))}
					{missing.length > 0 && <Text color='fg.muted'>Fill in {listOf(missing)} to see the rest.</Text>}
				</Flex>
			)}
		</Box>
	);
};

export default LinkedPreview;
