'use client';

import { FC, ReactNode, useEffect, useState } from 'react';
import { Badge, Box, Button, Flex, Input, Link, Switch, Text, Textarea } from '@chakra-ui/react';
import { ExternalLink, Plus, Trash2 } from 'lucide-react';
import { useUpdateSiteConfigMutation } from '@/components/library';
import { radius } from '@/components/library/config';
import { toaster } from '@/components/ui/toaster';
import type { SiteConfigPatch } from '@/components/library/store/services/tenantApi';

/** Small pieces the Site setup tabs share. */

export const errorText = (e: any) => e?.data?.message || 'Something went wrong — try again.';
export const same = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);
export const imageValue = (v: any) => (typeof v === 'string' ? v : v?.url || '');

/** The keys of `draft` that differ from `saved`. */
export const changed = <T extends Record<string, any>>(draft: T, saved: T): Partial<T> =>
	Object.fromEntries(Object.entries(draft).filter(([k, v]) => !same(v, saved[k]))) as Partial<T>;

/** A card's own copy of what's saved: edited freely, reset when the saved value changes. */
export const useDraft = <T,>(saved: T) => {
	const key = JSON.stringify(saved);
	const [draft, setDraft] = useState<T>(saved);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(() => setDraft(saved), [key]);
	return {
		draft,
		set: (patch: Partial<T>) => setDraft(d => ({ ...d, ...patch })),
		replace: setDraft,
		reset: () => setDraft(saved),
		dirty: !same(draft, saved),
	};
};

/** Saves a change to the settings and says so; each card has its own, so its button and error are its own. */
export const useSave = (what: string) => {
	const [update, state] = useUpdateSiteConfigMutation();
	const save = async (patch: SiteConfigPatch) => {
		const res: any = await update(patch);
		if ('data' in res) toaster.create({ type: 'success', title: `${what} saved`, description: 'Your site picks it up within a minute.' });
		return 'data' in res;
	};
	return { save, saving: state.isLoading, error: state.error, reset: state.reset };
};

/**
 * One setting on its own card (the AGS / Vercel settings pattern): a title,
 * what it does, the inputs, and a footer with where to get the value and the
 * card's own Save — enabled once something changed.
 */
export const SettingCard: FC<{
	id?: string;
	title: ReactNode;
	description?: ReactNode;
	badge?: ReactNode;
	/** Where the value comes from, e.g. the provider's dashboard. */
	source?: { href: string; label?: string };
	aside?: ReactNode;
	dirty?: boolean;
	saving?: boolean;
	error?: any;
	onSave?: () => void;
	onReset?: () => void;
	disabled?: boolean;
	saveLabel?: string;
	/** The button works without a change (an action, not a save). */
	ready?: boolean;
	children?: ReactNode;
}> = ({ id, title, description, badge, source, aside, dirty, saving, error, onSave, onReset, disabled, saveLabel = 'Save', ready, children }) => (
	<Box
		id={id}
		borderWidth='1px'
		borderColor='border'
		borderRadius={radius.CONTAINER}
		bg='bg.panel'
		overflow='hidden'>
		<Box
			px={{ base: 4, md: 5 }}
			pt={4}
			pb={children ? 5 : 4}>
			<Flex
				align='center'
				justify='space-between'
				gap={3}
				wrap='wrap'>
				<Text
					fontSize='14px'
					fontWeight='600'>
					{title}
				</Text>
				{badge}
			</Flex>
			{description && (
				<Text
					fontSize='12.5px'
					color='fg.muted'
					mt={1}
					maxW='720px'>
					{description}
				</Text>
			)}
			{children && <Box mt={4}>{children}</Box>}
		</Box>
		{(onSave || source || aside) && (
			<Flex
				align='center'
				justify='space-between'
				gap={3}
				px={{ base: 4, md: 5 }}
				py={2.5}
				minH='52px'
				borderTopWidth='1px'
				borderColor='border.muted'
				bg='bg.subtle'
				wrap='wrap'>
				<Box
					flex={1}
					minW={0}
					fontSize='12px'
					color={error ? 'red.fg' : 'fg.muted'}>
					{error ? (
						errorText(error)
					) : dirty ? (
						'Unsaved changes'
					) : source ? (
						<Link
							href={source.href}
							target='_blank'
							rel='noopener noreferrer'
							color='fg.muted'
							_hover={{ color: 'fg' }}
							display='inline-flex'
							alignItems='center'
							gap={1}>
							{source.label || `Get this from ${new URL(source.href).hostname.replace(/^www\./, '')}`}
							<ExternalLink size={11} />
						</Link>
					) : (
						aside
					)}
				</Box>
				{onSave && (
					<Flex gap={2}>
						{dirty && onReset && (
							<Button
								size='sm'
								variant='ghost'
								onClick={onReset}
								disabled={saving}>
								Discard
							</Button>
						)}
						<Button
							size='sm'
							onClick={onSave}
							loading={saving}
							disabled={(!dirty && !ready) || disabled}>
							{saveLabel}
						</Button>
					</Flex>
				)}
			</Flex>
		)}
	</Box>
);

/** A labelled field with its help text. */
export const Field: FC<{ label: string; help?: ReactNode; children: ReactNode }> = ({ label, help, children }) => (
	<Box>
		<Text
			fontSize='13px'
			fontWeight='600'
			mb={1}>
			{label}
		</Text>
		{children}
		{help && (
			<Text
				fontSize='12px'
				color='fg.muted'
				mt={1}>
				{help}
			</Text>
		)}
	</Box>
);

export const TextField: FC<{
	label: string;
	help?: ReactNode;
	value: string;
	onChange: (v: string) => void;
	placeholder?: string;
	long?: boolean;
	mono?: boolean;
	rows?: number;
	type?: string;
}> = ({ label, help, value, onChange, placeholder, long, mono, rows = 3, type }) => (
	<Field
		label={label}
		help={help}>
		{long ? (
			<Textarea
				size='sm'
				rows={rows}
				fontFamily={mono ? 'mono' : undefined}
				fontSize={mono ? '12px' : undefined}
				spellCheck={!mono}
				placeholder={placeholder}
				value={value}
				onChange={e => onChange(e.target.value)}
			/>
		) : (
			<Input
				size='sm'
				type={type}
				fontFamily={mono ? 'mono' : undefined}
				fontSize={mono ? '12.5px' : undefined}
				placeholder={placeholder}
				value={value}
				onChange={e => onChange(e.target.value)}
			/>
		)}
	</Field>
);

export const Toggle: FC<{ label: string; help?: ReactNode; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }> = ({
	label,
	help,
	checked,
	onChange,
	disabled,
}) => (
	<Flex
		gap={3}
		align='flex-start'>
		<Switch.Root
			checked={checked}
			disabled={disabled}
			colorPalette='brand'
			onCheckedChange={d => onChange(d.checked)}>
			<Switch.HiddenInput />
			<Switch.Control />
		</Switch.Root>
		<Box>
			<Text
				fontSize='13px'
				fontWeight='600'>
				{label}
			</Text>
			{help && (
				<Text
					fontSize='12px'
					color='fg.muted'>
					{help}
				</Text>
			)}
		</Box>
	</Flex>
);

/** The result of the last check for one tag, beside its title. */
export const CheckBadge: FC<{ status?: 'ok' | 'warning' | 'missing' | 'idle'; title?: string }> = ({ status, title }) => {
	if (!status || status === 'idle') return null;
	const look = { ok: ['green', 'On the site'], warning: ['orange', 'Check this'], missing: ['red', 'Not on the site'] }[status] as [string, string];
	return (
		<Badge
			size='sm'
			variant='subtle'
			colorPalette={look[0]}
			title={title}>
			{look[1]}
		</Badge>
	);
};

/** Rows of inputs (redirects, headers, domains): add, edit, remove. */
export const Rows = <T extends Record<string, any>>({
	rows,
	onChange,
	blank,
	columns,
	addLabel,
	empty,
	extra,
}: {
	rows: T[];
	onChange: (rows: T[]) => void;
	blank: T;
	columns: { key: keyof T; placeholder: string; width?: string; mono?: boolean }[];
	addLabel: string;
	empty: string;
	extra?: (row: T, set: (patch: Partial<T>) => void) => ReactNode;
}) => (
	<Flex
		direction='column'
		gap={2}>
		{!rows.length && (
			<Text
				fontSize='12.5px'
				color='fg.muted'>
				{empty}
			</Text>
		)}
		{rows.map((row, i) => {
			const set = (patch: Partial<T>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
			return (
				<Flex
					key={i}
					gap={2}
					align='center'
					wrap={{ base: 'wrap', md: 'nowrap' }}>
					{columns.map(c => (
						<Input
							key={String(c.key)}
							size='sm'
							flex={c.width ? `0 0 ${c.width}` : 1}
							minW={{ base: '100%', md: 0 }}
							fontFamily={c.mono ? 'mono' : undefined}
							fontSize={c.mono ? '12.5px' : undefined}
							placeholder={c.placeholder}
							value={row[c.key] ?? ''}
							onChange={e => set({ [c.key]: e.target.value } as Partial<T>)}
						/>
					))}
					{extra?.(row, set)}
					<Button
						size='sm'
						variant='ghost'
						aria-label='Remove'
						onClick={() => onChange(rows.filter((_, j) => j !== i))}>
						<Trash2 size={14} />
					</Button>
				</Flex>
			);
		})}
		<Box>
			<Button
				size='xs'
				variant='outline'
				onClick={() => onChange([...rows, { ...blank }])}>
				<Plus size={13} />
				{addLabel}
			</Button>
		</Box>
	</Flex>
);

