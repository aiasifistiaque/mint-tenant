'use client';

import { FC, ReactNode, useRef } from 'react';
import { Box, Checkbox, Flex, IconButton, Input, Text, Textarea } from '@chakra-ui/react';
import { ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react';
import { Dropdown } from '@/components/library/cl';
import { useGetMailDesignsQuery } from '@/components/library/store/services/tenantApi';
import { useGetPdfTemplatesQuery } from '@/components/library/store/services/pdfTemplatesApi';
import type { AutomationAction, AutomationSet } from '@/components/library/store/services/tenantApi';
import { ACTION_HINT, ACTION_LABEL, Page, REFERENCE_KINDS, addressSources, pageOfRef, placeholdersOf, writable } from './model';
import { insertToken } from './textEdit';
import MessageEditor from './MessageEditor';

/**
 * One action of an automation, as a card: its kind, then the form for it —
 * who to notify or email, the webhook's address, which record to update or
 * which page to add to and the fields to set. Text inputs take placeholders
 * ({{Title}}); "Insert a field" puts one where the cursor is. A server error for an input of this
 * action (`on` = "actions.<i>.…") shows under it.
 */

export type Person = { _id: string; name: string; email: string };

const labelCss: any = { fontSize: '12.5px', fontWeight: '600', mb: 1 };
/** The email action's "use the project's default design" choice (no `design` saved). */
const DEFAULT_DESIGN = '__default';

export const ErrorLine: FC<{ text?: string }> = ({ text }) =>
	text ? (
		<Text
			role='alert'
			fontSize='12px'
			color='red.fg'
			mt={1}>
			{text}
		</Text>
	) : null;

const Part: FC<{ label: string; hint?: string; error?: string; children: ReactNode }> = ({ label, hint, error, children }) => (
	<Box>
		<Text {...labelCss}>{label}</Text>
		{hint && (
			<Text
				fontSize='12px'
				color='fg.muted'
				mb={1.5}>
				{hint}
			</Text>
		)}
		{children}
		<ErrorLine text={error} />
	</Box>
);

/** A text that takes placeholders, with "Insert a field" — in at the cursor, or over the selected words. */
export const PlaceholderText: FC<{
	value: string;
	onChange: (v: string) => void;
	page?: Page;
	multiline?: boolean;
	placeholder?: string;
	mono?: boolean;
}> = ({ value, onChange, page, multiline, placeholder }) => {
	const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
	// Only once the box has had the cursor does its selection mean anything; before that, a field goes at the end.
	const touched = useRef(false);
	const insert = (key: string) => {
		const el = ref.current;
		const [s, e] = el && touched.current ? [el.selectionStart ?? value.length, el.selectionEnd ?? value.length] : [value.length, value.length];
		const next = insertToken(value, s, e, `{{${key}}}`);
		onChange(next.value);
		touched.current = true;
		// Back in the box, the cursor just after the field — once the Dropdown has let go of the focus.
		setTimeout(() => {
			ref.current?.focus();
			ref.current?.setSelectionRange(next.start, next.end);
		}, 0);
	};
	const common = {
		ref,
		size: 'sm' as const,
		value,
		placeholder,
		onFocus: () => (touched.current = true),
		onChange: (e: any) => onChange(e.target.value),
	};
	return (
		<Box>
			{multiline ? (
				<Textarea
					{...common}
					rows={5}
				/>
			) : (
				<Input {...common} />
			)}
			<Flex
				mt={1}
				justify='flex-end'>
				<Dropdown
					size='xs'
					w='190px'
					value=''
					placeholder='Insert a field'
					aria-label='Insert a field'
					items={placeholdersOf(page).map(p => ({ value: p.key, label: p.label }))}
					onChange={insert}
				/>
			</Flex>
		</Box>
	);
};

const Check: FC<{ checked: boolean; onChange: (v: boolean) => void; children: ReactNode }> = ({ checked, onChange, children }) => (
	<Checkbox.Root
		size='sm'
		checked={checked}
		onCheckedChange={e => onChange(!!e.checked)}>
		<Checkbox.HiddenInput />
		<Checkbox.Control />
		<Checkbox.Label fontSize='13px'>{children}</Checkbox.Label>
	</Checkbox.Root>
);

const toggle = (list: string[] = [], v: string, on: boolean) => (on ? [...new Set([...list, v])] : list.filter(x => x !== v));

/** Who gets it: people in the project, and whoever saved. */
const People: FC<{ people: Person[]; value: string[]; actor: boolean; onChange: (people: string[], actor: boolean) => void }> = ({ people, value, actor, onChange }) => (
	<Flex
		direction='column'
		gap={1.5}>
		<Check
			checked={actor}
			onChange={v => onChange(value, v)}>
			Whoever made the change
		</Check>
		{people.map(p => (
			<Check
				key={p._id}
				checked={value.includes(p._id)}
				onChange={v => onChange(toggle(value, p._id, v), actor)}>
				{p.name}{' '}
				<Text
					as='span'
					fontSize='12px'
					color='fg.muted'>
					{p.email}
				</Text>
			</Check>
		))}
	</Flex>
);

/** The fields an update or create sets: a field of the target, and a value, a copy or (update) empty. */
const SetRows: FC<{
	set: AutomationSet[];
	onChange: (s: AutomationSet[]) => void;
	source?: Page;
	target?: Page;
	allowClear: boolean;
	errorAt: (path: string) => string | undefined;
	at: string;
}> = ({ set, onChange, source, target, allowClear, errorAt, at }) => {
	const fields = writable(target);
	const put = (i: number, s: AutomationSet) => onChange(set.map((x, j) => (j === i ? s : x)));
	const mode = (s: AutomationSet) => (s.clear ? 'clear' : s.from !== undefined ? 'copy' : 'value');
	return (
		<Flex
			direction='column'
			gap={2}>
			{set.map((s, i) => {
				const f = fields.find(x => x.key === s.field);
				return (
					<Box key={i}>
						<Flex
							gap={2}
							align='flex-start'
							wrap='wrap'>
							<Dropdown
								size='sm'
								w='170px'
								value={s.field}
								placeholder='Field'
								aria-label='Field to set'
								items={fields.map(x => ({ value: x.key, label: x.label }))}
								onChange={v => put(i, { ...s, field: v })}
							/>
							<Dropdown
								size='sm'
								w='200px'
								value={mode(s)}
								aria-label='How to set it'
								items={[
									{ value: 'value', label: 'to a value' },
									{ value: 'copy', label: `copied from this ${source?.noun || 'record'}` },
									...(allowClear ? [{ value: 'clear', label: 'emptied' }] : []),
								]}
								onChange={v => put(i, v === 'clear' ? { field: s.field, clear: true } : v === 'copy' ? { field: s.field, from: '' } : { field: s.field, value: '' })}
							/>
							<Box
								flex={1}
								minW='200px'>
								{mode(s) === 'copy' ? (
									<Dropdown
										size='sm'
										value={s.from || ''}
										placeholder='Its field'
										aria-label='Copy from'
										items={[{ value: '_id', label: `This ${source?.noun || 'record'} itself (a link to it)` }, ...(source?.fields || []).map(x => ({ value: x.key, label: x.label }))]}
										onChange={v => put(i, { field: s.field, from: v })}
									/>
								) : mode(s) === 'value' ? (
									f?.options?.length ? (
										<Dropdown
											size='sm'
											value={String(s.value ?? '')}
											placeholder='Value'
											aria-label='Value'
											items={f.options.map(o => ({ value: o.value, label: o.label || o.value }))}
											onChange={v => put(i, { field: s.field, value: v })}
										/>
									) : f?.kind === 'boolean' ? (
										<Dropdown
											size='sm'
											value={String(s.value ?? '')}
											placeholder='Value'
											aria-label='Value'
											items={[
												{ value: 'true', label: 'Yes' },
												{ value: 'false', label: 'No' },
											]}
											onChange={v => put(i, { field: s.field, value: v === 'true' })}
										/>
									) : (
										<PlaceholderText
											value={String(s.value ?? '')}
											onChange={v => put(i, { field: s.field, value: v })}
											page={source}
											placeholder={f?.kind === 'date' ? '{{today}} or 2026-12-31' : 'Value'}
										/>
									)
								) : null}
							</Box>
							<IconButton
								size='xs'
								variant='ghost'
								aria-label='Remove this field'
								onClick={() => onChange(set.filter((_, j) => j !== i))}>
								<X size={14} />
							</IconButton>
						</Flex>
						<ErrorLine text={errorAt(`${at}.${i}.field`) || errorAt(`${at}.${i}.from`) || errorAt(`${at}.${i}.value`)} />
					</Box>
				);
			})}
			<Box>
				<IconButton
					size='xs'
					variant='outline'
					px={2}
					aria-label='Set another field'
					onClick={() => onChange([...set, { field: '', value: '' }])}>
					<Plus size={13} /> Set another field
				</IconButton>
			</Box>
			<ErrorLine text={errorAt(at)} />
		</Flex>
	);
};

const ActionEditor: FC<{
	index: number;
	count: number;
	action: AutomationAction;
	onChange: (a: AutomationAction) => void;
	onRemove: () => void;
	onMove: (by: -1 | 1) => void;
	page?: Page;
	pages: Page[];
	people: Person[];
	errorAt: (path: string) => string | undefined;
}> = ({ index, count, action: a, onChange, onRemove, onMove, page, pages, people, errorAt }) => {
	const at = `actions.${index}`;
	const err = (p: string) => errorAt(`${at}.${p}`);
	const refFields = (page?.fields || []).filter(f => REFERENCE_KINDS.includes(f.kind));
	const { data: designs } = useGetMailDesignsQuery(undefined, { skip: a.type !== 'email' });
	// The page's published PDF templates — what an email can attach, printed for the record.
	const { data: pdfs } = useGetPdfTemplatesQuery({ route: page?.route, published: true }, { skip: a.type !== 'email' || !page?.route });

	let body: ReactNode = null;
	if (a.type === 'notify')
		body = (
			<>
				<Part
					label='Who'
					error={err('to') || err('to.people')}>
					<People
						people={people}
						value={a.to.people || []}
						actor={!!a.to.actor}
						onChange={(p, actor) => onChange({ ...a, to: { people: p, actor } })}
					/>
				</Part>
				<Part
					label='Title'
					error={err('title')}>
					<PlaceholderText
						value={a.title}
						onChange={v => onChange({ ...a, title: v })}
						page={page}
						placeholder='{{title}} was won'
					/>
				</Part>
				<Part
					label='Message'
					error={err('message')}>
					<PlaceholderText
						value={a.message || ''}
						onChange={v => onChange({ ...a, message: v })}
						page={page}
						placeholder='Optional — a line under the title'
					/>
				</Part>
			</>
		);
	else if (a.type === 'email') {
		const sources = addressSources(page, pages);
		const chosen = a.to.fields || [];
		body = (
			<>
				<Part
					label='To'
					hint='People in the project, the address in a field — the record’s own, or a linked record’s (a bill’s Customer → Email) — or addresses you type.'
					error={err('to') || err('to.people')}>
					<People
						people={people}
						value={a.to.people || []}
						actor={!!a.to.actor}
						onChange={(p, actor) => onChange({ ...a, to: { ...a.to, people: p, actor } })}
					/>
					{chosen.length > 0 && (
						<Flex
							direction='column'
							gap={1.5}
							mt={2}>
							{chosen.map(k => (
								<Flex
									key={k}
									align='center'
									gap={2}
									fontSize='13px'>
									<Text flex={1}>
										The address in {sources.find(x => x.value === k)?.label || k}
									</Text>
									<IconButton
										size='2xs'
										variant='ghost'
										aria-label='Remove this address field'
										onClick={() => onChange({ ...a, to: { ...a.to, fields: toggle(chosen, k, false) } })}>
										<X />
									</IconButton>
								</Flex>
							))}
						</Flex>
					)}
					{sources.some(x => !chosen.includes(x.value)) && (
						<Dropdown
							mt={2}
							size='sm'
							value=''
							placeholder='Send to the address in a field…'
							aria-label='Send to the address in a field'
							items={sources.filter(x => !chosen.includes(x.value))}
							onChange={k => onChange({ ...a, to: { ...a.to, fields: toggle(chosen, k, true) } })}
						/>
					)}
					{!sources.length && (
						<Text
							mt={2}
							fontSize='12px'
							color='fg.muted'>
							To email a customer, give this page or the page it links to (Customers) an Email field.
						</Text>
					)}
					<Input
						mt={2}
						size='sm'
						value={(a.to.emails || []).join(', ')}
						placeholder='Other addresses, separated by commas (up to 10)'
						onChange={e =>
							onChange({
								...a,
								to: {
									...a.to,
									emails: e.target.value
										.split(',')
										.map(x => x.trim())
										.filter((x, i, all) => x || i === all.length - 1),
								},
							})
						}
					/>
					<ErrorLine text={err('to.fields') || err('to.emails')} />
				</Part>
				{!!designs?.doc.length && (
					<Part
						label='Design'
						hint='How the email looks — Project → Email → How your emails look.'
						error={err('design')}>
						<Dropdown
							size='sm'
							value={a.design || DEFAULT_DESIGN}
							aria-label='Email design'
							items={[
								{ value: DEFAULT_DESIGN, label: `The default (${designs.doc.find(d => d.isDefault)?.name || 'classic'})` },
								...designs.doc.map(d => ({ value: d._id, label: `${d.name}${d.style === 'plain' ? ' — plain' : ''}` })),
							]}
							onChange={v => {
								const { design: _, ...rest } = a;
								onChange(v === DEFAULT_DESIGN ? rest : { ...rest, design: v });
							}}
						/>
					</Part>
				)}
				<Part
					label='Subject'
					error={err('subject')}>
					<PlaceholderText
						value={a.subject}
						onChange={v => onChange({ ...a, subject: v })}
						page={page}
						placeholder='Thanks for your order {{title}}'
					/>
				</Part>
				<Part
					label='Message'
					hint='A blank line starts a new paragraph.'
					error={err('body')}>
					<MessageEditor
						value={a.body}
						onChange={v => onChange({ ...a, body: v })}
						page={page}
						placeholder={'Hello,\n\nWe got your order {{title}}.'}
					/>
				</Part>
				<Part
					label='Attach PDFs'
					hint={`Printed for the ${page?.noun || 'record'} and sent with the email — an invoice for a bill. Up to 3.`}
					error={err('attach')}>
					{pdfs?.templates?.length ? (
						<Flex
							direction='column'
							gap={1.5}>
							{pdfs.templates.map((t: any) => {
								const on = (a.attach || []).includes(t._id);
								return (
									<Check
										key={t._id}
										checked={on}
										onChange={v => {
											const attach = toggle(a.attach, t._id, v);
											const { attach: _, ...rest } = a;
											onChange(attach.length ? { ...rest, attach } : rest);
										}}>
										{t.name}
									</Check>
								);
							})}
						</Flex>
					) : (
						<Text
							fontSize='12px'
							color='fg.muted'>
							{page ? `${page.title} has no published PDF template yet — make one under Build → PDF templates.` : 'Choose the page first.'}
						</Text>
					)}
				</Part>
			</>
		);
	} else if (a.type === 'webhook')
		body = (
			<Part
				label='Address'
				hint='Your server, starting with https://. It gets the record as JSON, signed (x-mint-signature) with the secret shown after saving.'
				error={err('url')}>
				<Input
					size='sm'
					fontFamily='mono'
					value={a.url}
					placeholder='https://example.com/hooks/won-deal'
					onChange={e => onChange({ ...a, url: e.target.value })}
				/>
			</Part>
		);
	else if (a.type === 'update') {
		const targetPage = a.target === 'this' ? page : pageOfRef(pages, refFields.find(f => f.key === a.target)?.ref);
		body = (
			<>
				<Part
					label='Which record'
					error={err('target')}>
					<Dropdown
						size='sm'
						value={a.target}
						aria-label='Which record'
						items={[
							{ value: 'this', label: `This ${page?.noun || 'record'}` },
							...refFields.map(f => ({ value: f.key, label: `The ${f.label} it links to` })),
						]}
						onChange={v => onChange({ ...a, target: v, set: [{ field: '', value: '' }] })}
					/>
				</Part>
				<Part label={`Set on the ${targetPage?.noun || 'record'}`}>
					<SetRows
						set={a.set}
						onChange={s => onChange({ ...a, set: s })}
						source={page}
						target={targetPage}
						allowClear
						errorAt={errorAt}
						at={`${at}.set`}
					/>
				</Part>
			</>
		);
	} else if (a.type === 'create') {
		const target = pages.find(p => p.route === a.route);
		body = (
			<>
				<Part
					label='Add a record to'
					error={err('route')}>
					<Dropdown
						size='sm'
						value={a.route}
						placeholder='Choose a page'
						aria-label='Page to add a record to'
						items={pages.map(p => ({ value: p.route, label: p.title }))}
						onChange={v => onChange({ ...a, route: v, set: [{ field: '', value: '' }] })}
					/>
				</Part>
				{target && (
					<Part
						label={`The new ${target.noun}`}
						hint={
							target.fields.some(f => f.required)
								? `Set at least: ${target.fields
										.filter(f => f.required)
										.map(f => f.label)
										.join(', ')}.`
								: undefined
						}>
						<SetRows
							set={a.set}
							onChange={s => onChange({ ...a, set: s })}
							source={page}
							target={target}
							allowClear={false}
							errorAt={errorAt}
							at={`${at}.set`}
						/>
					</Part>
				)}
			</>
		);
	}

	return (
		<Box
			borderWidth='1px'
			borderColor='border'
			borderRadius='lg'
			p={4}>
			<Flex
				align='center'
				gap={2}
				mb={3}>
				<Text
					fontSize='12px'
					fontWeight='600'
					color='fg.muted'
					w='22px'>
					{index + 1}.
				</Text>
				<Text
					fontSize='13.5px'
					fontWeight='600'>
					{ACTION_LABEL[a.type]}
				</Text>
				<Text
					flex={1}
					fontSize='12px'
					color='fg.muted'
					minW={0}>
					{ACTION_HINT[a.type]}
				</Text>
				<IconButton
					size='xs'
					variant='ghost'
					aria-label='Move up'
					disabled={index === 0}
					onClick={() => onMove(-1)}>
					<ArrowUp size={13} />
				</IconButton>
				<IconButton
					size='xs'
					variant='ghost'
					aria-label='Move down'
					disabled={index === count - 1}
					onClick={() => onMove(1)}>
					<ArrowDown size={13} />
				</IconButton>
				<IconButton
					size='xs'
					variant='ghost'
					aria-label='Remove this action'
					onClick={onRemove}>
					<Trash2 size={13} />
				</IconButton>
			</Flex>
			<Flex
				direction='column'
				gap={3.5}
				pl={{ base: 0, md: '30px' }}>
				{body}
				<ErrorLine text={err('type')} />
			</Flex>
		</Box>
	);
};

export default ActionEditor;
