'use client';

import { FC, ReactNode, useEffect, useMemo, useState } from 'react';
import { Box, Flex, Grid, Input, Switch, Text, Textarea } from '@chakra-ui/react';
import { useCheckModelNameQuery } from '@/components/library';
import { Dropdown, Panel } from '@/components/library/cl';
import { DocLink } from '@/app/builder/_components/ui';
import { ToneTitle } from '@/app/builder/_components/areas';
import { Hash, ListChecks, Lock, NotebookPen, Tag } from 'lucide-react';
import { IS_TENANT_PANEL } from '@/components/library/config/lib/constants/panel';
import FieldsEditor, { LinkTarget } from './FieldsEditor';
import {
	EditableField,
	FieldKind,
	TEXT_KINDS,
	fromServer,
	newUid,
	singular,
	toModelName,
	toServer,
	validateFields,
} from './modelKinds';

/**
 * What a model is — its name, record code and fields — as the panels the
 * model editor and the wizard's first step share, plus the working-copy
 * helpers both keep their state in.
 */

export type ModelWorking = {
	title: string;
	name: string;
	route: string;
	description: string;
	displayField: string;
	code: { enabled: boolean; prefix: string; padding: number; start: number };
	/** Per-record access: an owner, a privacy and an access list on every record. */
	access: { enabled: boolean; default: string };
	fields: EditableField[];
	active: boolean;
	sidebarCategory: string;
};

export const emptyModel = (): ModelWorking => ({
	title: '',
	name: '',
	route: '',
	description: '',
	displayField: '',
	code: { enabled: false, prefix: '', padding: 4, start: 1 },
	access: { enabled: false, default: 'private' },
	fields: [{ uid: newUid(), key: 'name', label: 'Name', kind: 'text', required: true, showInTable: true, keyTouched: true }],
	active: true,
	sidebarCategory: '',
});

export const modelFromDoc = (doc: any): ModelWorking => ({
	title: doc.title || '',
	name: doc.name,
	route: doc.route,
	description: doc.description || '',
	displayField: doc.displayField || '',
	code: { enabled: false, prefix: '', padding: 4, start: 1, ...(doc.code || {}) },
	access: { enabled: !!doc.access?.enabled, default: doc.access?.default || 'private' },
	fields: fromServer(doc.fields),
	active: doc.active !== false,
	sidebarCategory: doc.sidebarCategory || '',
});

/** The definition as the API takes it. */
export const modelBody = (w: ModelWorking) => ({
	title: w.title.trim(),
	description: w.description,
	displayField: w.displayField,
	code: { ...w.code, prefix: w.code.prefix.trim() },
	// Privacy is chosen per record, in the form; new records start Private.
	access: { enabled: w.access.enabled, default: 'private' },
	fields: toServer(w.fields),
	active: w.active,
	sidebar: { category: w.sidebarCategory || '' },
});

/** The name a new model asks for: the one typed, or the title made singular. */
export const requestedName = (w: ModelWorking) => w.name.trim() || singular(w.title);

/** 'Invoices' -> 'INV': the prefix offered when codes are switched on. */
export const suggestPrefix = (title: string) => title.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase();

export const codePreview = (c: ModelWorking['code']) => {
	const digits = String(Math.max(c.start || 0, 0) || 1).padStart(Math.min(Math.max(c.padding || 1, 1), 12), '0');
	return c.prefix.trim() ? `${c.prefix.trim().toUpperCase()}-${digits}` : digits;
};

/** What a new model's name would register as — checked as it's typed. */
export const useNameAvailability = (w: ModelWorking | null, enabled: boolean) => {
	const [query, setQuery] = useState('');
	const wanted = w ? requestedName(w) : '';
	useEffect(() => {
		if (!enabled) return;
		const t = setTimeout(() => setQuery(wanted.trim()), 350);
		return () => clearTimeout(t);
	}, [enabled, wanted]);
	const { data, error, isFetching } = useCheckModelNameQuery(
		{ name: query, route: w?.route || undefined },
		{ skip: !enabled || !query }
	);
	return { availability: data, error, checking: isFetching || wanted.trim() !== query, query };
};


const Label: FC<{ children: ReactNode; hint?: string }> = ({ children, hint }) => (
	<Box mb={1.5}>
		<Text
			fontSize='xs'
			fontWeight='600'>
			{children}
		</Text>
		{hint && (
			<Text
				fontSize='xs'
				color='fg.muted'>
				{hint}
			</Text>
		)}
	</Box>
);

type Props = {
	working: ModelWorking;
	onChange: (w: ModelWorking) => void;
	mode: 'create' | 'edit';
	/** The saved model, when editing. */
	doc?: any;
	/** The last saved state, when editing — for "codes get assigned on save". */
	base?: ModelWorking | null;
	targets: LinkTarget[];
	categories?: { _id: string; name: string }[];
	/** The sidebar picker; the wizard asks about it in a step of its own. */
	showSidebar?: boolean;
	name?: ReturnType<typeof useNameAvailability>;
	/**
	 * Which panels to draw — all by default. The model page spreads them over
	 * tabs (fields on one, the rest under Settings); the wizard shows them all.
	 */
	only?: ModelPanelName[];
	/** The model page shows the name, address and collection on its Advanced tab instead. */
	hideIdentity?: boolean;
	/**
	 * Basics shows only the title and description, and the model name, route
	 * and record name get a panel of their own ('names') — the new-model
	 * wizard keeps them under More options.
	 */
	namesApart?: boolean;
};

export type ModelPanelName = 'basics' | 'names' | 'numbers' | 'privacy' | 'fields';

export const useFieldErrors = (fields: EditableField[], accessEnabled = false) =>
	useMemo(() => validateFields(fields, { accessEnabled }), [fields, accessEnabled]);

const ModelPanels: FC<Props> = ({ working, onChange, mode, doc, base, targets, categories = [], showSidebar, name, only, hideIdentity, namesApart }) => {
	const isNew = mode === 'create';
	const show = (panel: ModelPanelName) => !only || only.includes(panel);
	const set = (patch: Partial<ModelWorking>) => onChange({ ...working, ...patch });
	const setCode = (patch: Partial<ModelWorking['code']>) => onChange({ ...working, code: { ...working.code, ...patch } });
	const setAccess = (patch: Partial<ModelWorking['access']>) => onChange({ ...working, access: { ...working.access, ...patch } });
	const errors = useFieldErrors(working.fields, working.access.enabled);

	const availability = name?.availability;
	const selfName = isNew ? availability?.name || toModelName(requestedName(working)) : doc?.name;
	const savedKinds: Record<string, FieldKind> = Object.fromEntries((doc?.fields || []).map((f: any) => [f.key, f.kind]));
	const displayChoices = working.fields.filter(f => f.key && TEXT_KINDS.includes(f.kind));
	const records = doc?.records || 0;
	const removedWithData = !isNew && records > 0 ? (doc.fields || []).filter((f: any) => !working.fields.some(w => w.key === f.key)) : [];

	const nameFields = (
		<>
					{!(hideIdentity && !isNew) && (
					<Box>
						<Label hint='Other models link to it by this name. Fixed once created.'>Model name</Label>
						{isNew ? (
							<>
								<Input
									size='sm'
									fontFamily='mono'
									value={working.name}
									placeholder={toModelName(singular(working.title)) || 'Invoice'}
									onChange={e => set({ name: e.target.value })}
								/>
								<Text
									fontSize='xs'
									mt={1.5}
									color={name?.error ? 'red.fg' : availability?.changed ? 'orange.fg' : 'fg.muted'}>
									{!requestedName(working)
										? 'Type a title or a name.'
										: name?.checking
										? 'Checking…'
										: name?.error
										? (name.error as any)?.data?.message || 'Not a usable name'
										: availability
										? availability.changed
											? `${availability.reasons.join('; ')} — registers as ${availability.name} at /${availability.route}`
											: `Registers as ${availability.name} at /${availability.route}`
										: ''}
								</Text>
							</>
						) : (
							<Text
								fontSize='sm'
								fontFamily='mono'
								py={1.5}>
								{doc.name}
								<Text
									as='span'
									color='fg.muted'>
									{' '}
									· /{doc.route} · collection {doc.collectionName}
									{doc.requestedName && toModelName(doc.requestedName) !== doc.name ? ` · asked for ${doc.requestedName}` : ''}
								</Text>
							</Text>
						)}
					</Box>
					)}
					{isNew && (
						<Box>
							<Label hint='Leave empty to use the plural of the name.'>Route (optional)</Label>
							<Input
								size='sm'
								fontFamily='mono'
								value={working.route}
								placeholder={availability?.route || 'invoices'}
								onChange={e => set({ route: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
							/>
						</Box>
					)}
					<Box>
						<Label hint='The field that names a record wherever it’s linked from — pickers, tables, its own page.'>
							Record name (display field)
						</Label>
						<Dropdown
							value={working.displayField}
							onChange={v => set({ displayField: v })}>
							<option value=''>Automatic (the first text field)</option>
							{displayChoices.map(f => (
								<option
									key={f.uid}
									value={f.key}>
									{f.label || f.key}
								</option>
							))}
							{working.code.enabled && <option value='code'>The code</option>}
						</Dropdown>
					</Box>
		</>
	);

	return (
		<>
			{show('basics') && (
			<Panel
				title={
					<ToneTitle
						icon={NotebookPen}
						palette='blue'>
						Basics
					</ToneTitle>
				}
				subtitle='What it’s called, and where people find it.'
				actions={<DocLink section='models' />}>
				<Grid
					templateColumns={{ base: '1fr', md: 'repeat(2, minmax(0, 1fr))' }}
					gap={4}>
					<Box>
						<Label hint='The page heading and the sidebar entry, e.g. “Invoices”.'>Title</Label>
						<Input
							size='sm'
							value={working.title}
							placeholder='Invoices'
							onChange={e => set({ title: e.target.value })}
						/>
						{namesApart && isNew && requestedName(working) && (
							<Text
								fontSize='xs'
								mt={1.5}
								color={name?.error ? 'red.fg' : 'fg.muted'}>
								{name?.checking
									? 'Checking…'
									: name?.error
									? (name.error as any)?.data?.message || 'Not a usable name'
									: availability
									? `Its table page will be at /${availability.route}`
									: ''}
							</Text>
						)}
					</Box>
					{!namesApart && nameFields}
					{showSidebar && (
						<Box>
							<Label hint='The sidebar group it’s listed under, for roles allowed to view it.'>Sidebar</Label>
							<Dropdown
								value={working.sidebarCategory}
								onChange={v => set({ sidebarCategory: v })}>
								<option value=''>Not in the sidebar</option>
								{categories.map(c => (
									<option
										key={c._id}
										value={c._id}>
										{c.name}
									</option>
								))}
							</Dropdown>
						</Box>
					)}
					<Box gridColumn={{ md: 'span 2' }}>
						<Label>Description</Label>
						<Textarea
							size='sm'
							rows={2}
							value={working.description}
							placeholder='Shown under the page title'
							onChange={e => set({ description: e.target.value })}
						/>
					</Box>
				</Grid>
			</Panel>
			)}

			{namesApart && show('names') && (
			<Panel
				title={
					<ToneTitle
						icon={Tag}
						palette='cyan'>
						Names and address
					</ToneTitle>
				}
				subtitle='Filled in for you from the title — change them only if you need to.'
				actions={<DocLink section='models' />}>
				<Grid
					templateColumns={{ base: '1fr', md: 'repeat(2, minmax(0, 1fr))' }}
					gap={4}>
					{nameFields}
				</Grid>
			</Panel>
			)}

			{show('numbers') && (
			<Panel
				title={
					<ToneTitle
						icon={Hash}
						palette='orange'>
						Record numbers
					</ToneTitle>
				}
				subtitle='A readable number on every record, like INV-0001 — given when a record is created and never reused.'
				actions={<DocLink section='models-code' />}>
				<Flex
					direction='column'
					gap={4}>
					<Switch.Root
						size='sm'
						checked={working.code.enabled}
						// Switched on with no prefix, it offers one from the title — an empty box read as "INV" to people.
						onCheckedChange={e =>
							setCode({ enabled: e.checked, ...(e.checked && !working.code.prefix.trim() && { prefix: suggestPrefix(working.title || working.name || '') }) })
						}>
						<Switch.HiddenInput />
						<Switch.Control>
							<Switch.Thumb />
						</Switch.Control>
						<Switch.Label fontSize='sm'>Give every record a number (code)</Switch.Label>
					</Switch.Root>
					{working.code.enabled && (
						<Flex
							gap={4}
							align='flex-end'
							flexWrap='wrap'>
							<Box w='140px'>
								<Label>Prefix</Label>
								<Input
									size='sm'
									fontFamily='mono'
									maxLength={10}
									value={working.code.prefix}
									placeholder='None'
									onChange={e => setCode({ prefix: e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() })}
								/>
							</Box>
							<Box w='100px'>
								<Label>Digits</Label>
								<Input
									size='sm'
									type='number'
									min={1}
									max={12}
									value={working.code.padding}
									onChange={e => setCode({ padding: Number(e.target.value) || 1 })}
								/>
							</Box>
							<Box w='120px'>
								<Label>Start at</Label>
								<Input
									size='sm'
									type='number'
									min={0}
									value={working.code.start}
									onChange={e => setCode({ start: Math.max(Number(e.target.value) || 0, 0) })}
								/>
							</Box>
							<Box pb={1.5}>
								<Text
									fontSize='xs'
									color='fg.muted'>
									Next record gets
								</Text>
								<Text
									fontFamily='mono'
									fontWeight='600'>
									{codePreview(working.code)}
								</Text>
							</Box>
						</Flex>
					)}
					{!isNew && working.code.enabled && !base?.code.enabled && records > 0 && (
						<Text
							fontSize='xs'
							color='fg.muted'>
							The {records} existing records get codes when you save, oldest first.
						</Text>
					)}
					{!isNew && base?.code.enabled && (
						<Text
							fontSize='xs'
							color='fg.muted'>
							A new prefix or length applies to records created from now on; existing codes stay as they are.
						</Text>
					)}
				</Flex>
			</Panel>
			)}

			{/* Per-record access: admins in the super-admin panel, the organization's people in a project (multi-tenancy D19). */}
			{show('privacy') && (
			<Panel
					title={
						<ToneTitle
							icon={Lock}
							palette='purple'>
							Who sees each record
						</ToneTitle>
					}
					subtitle={
						IS_TENANT_PANEL
							? 'Whether every record decides who can see it (access). The role’s Records permissions still come first: without View, no record shows.'
							: 'Whether every record decides who can see it (access). The page permission still comes first: without it, no record shows.'
					}
					actions={<DocLink section='models-access' />}>
					<Flex
						direction='column'
						gap={4}>
						<Switch.Root
							size='sm'
							checked={working.access.enabled}
							onCheckedChange={e => setAccess({ enabled: e.checked })}>
							<Switch.HiddenInput />
							<Switch.Control>
								<Switch.Thumb />
							</Switch.Control>
							<Switch.Label fontSize='sm'>Let each record choose who can see it</Switch.Label>
						</Switch.Root>
						{working.access.enabled && (
							<>
								<Text
									fontSize='xs'
									color='fg.muted'>
									Every record gets an owner (whoever creates it), a privacy and an access list. The form gains a{' '}
									<em>Manage access</em> section where each record is set to Only me, Private or Public (Private to
									start with); the people picker shows when it&apos;s Private
									{IS_TENANT_PANEL
										? ' and lists the members who can open this project'
										: ', and everyone added is notified'}
									. Only the owner can change access or delete the record.
									{IS_TENANT_PANEL && ' Your public API only ever sees the records marked Public.'}
								</Text>
								{!isNew && !base?.access?.enabled && records > 0 && (
									<Text
										fontSize='xs'
										color='fg.muted'>
										The {records} existing records have no owner yet: they become Public when you save, so nobody loses
										sight of them.
									</Text>
								)}
							</>
						)}
						{!isNew && base?.access?.enabled && !working.access.enabled && (
							<Text
								fontSize='xs'
								color='orange.fg'>
								Turning it off shows every record to everyone who can open the page. The owners and access lists
								stay in the records, and come back if you turn it on again.
							</Text>
						)}
					</Flex>
				</Panel>
			)}

			{show('fields') && (
			<Panel
				title={
					<ToneTitle
						icon={ListChecks}
						palette='blue'>
						Fields
					</ToneTitle>
				}
				subtitle='What every record holds, in the order the form, table and record page show them. Drag ⋮⋮ to reorder; More opens a field’s other settings.'
				actions={<DocLink section='models-fields' />}>
				<FieldsEditor
					fields={working.fields}
					onChange={fields => set({ fields })}
					errors={errors}
					targets={targets}
					selfName={selfName}
					savedKinds={savedKinds}
					hasRecords={!isNew && records > 0}
				/>
				{removedWithData.length > 0 && (
					<Text
						fontSize='xs'
						color='orange.fg'
						mt={3}>
						Removing {removedWithData.map((f: any) => f.label || f.key).join(', ')}: the values stay in the existing
						records, but are no longer shown, edited or returned. Add the field back to see them again.
					</Text>
				)}
			</Panel>
			)}
		</>
	);
};

export default ModelPanels;
