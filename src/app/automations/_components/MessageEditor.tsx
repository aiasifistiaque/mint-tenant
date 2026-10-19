'use client';

import { FC, ReactNode, useEffect, useRef, useState } from 'react';
import { Box, Button, chakra, Flex, Text, Textarea } from '@chakra-ui/react';
import { Bold, Braces, Eye, Italic, List, PenLine } from 'lucide-react';
import { Dropdown } from '@/components/library/cl';
import { Page, placeholdersOf } from './model';
import { Edit, insertToken, marksAt, previewHtml, toggleList, toggleMark } from './textEdit';

/**
 * The email's message (docs/automations AU-03c): a plain text box where a
 * click — or a right-click — opens a small menu at the pointer: put a field
 * in where the cursor is, make the selected words bold or italic, make lines
 * a list. The click still places the cursor (the menu opens after it lands),
 * and the menu's buttons never take the focus, so the selection stays put.
 * Typing or Escape closes it; ⌘B / ⌘I work without it. The marks are
 * **bold**, *italic* and "- " — the server turns them into the email's look.
 */

const MENU_W = 236;

const MessageEditor: FC<{ value: string; onChange: (v: string) => void; page?: Page; placeholder?: string }> = ({ value, onChange, page, placeholder }) => {
	const ref = useRef<HTMLTextAreaElement>(null);
	const wrap = useRef<HTMLDivElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);
	const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
	const [fieldsOpen, setFieldsOpen] = useState(false);
	const [marks, setMarks] = useState({ bold: false, italic: false, list: false });
	const [preview, setPreview] = useState(false);
	const fields = placeholdersOf(page);
	// Where the cursor was when the box last had it — a field picked from the Dropdown below goes there.
	const touched = useRef(false);

	// A change not yet back in the box: its text and selection. A second press (⌘B then ⌘I) before
	// the box has caught up works on these, not on the box's half-updated cursor.
	const pending = useRef<Edit | null>(null);
	const current = () => pending.current?.value ?? value;

	const range = (): [number, number] => {
		if (pending.current) return [pending.current.start, pending.current.end];
		const el = ref.current;
		const end = current().length;
		if (!el || !touched.current) return [end, end];
		return [el.selectionStart ?? end, el.selectionEnd ?? end];
	};

	/** Puts the change in, then the cursor (or selection) where it belongs. */
	const apply = (e: Edit) => {
		pending.current = e;
		onChange(e.value);
		touched.current = true;
		// After React has put the new text in the box — setting it sooner is undone by the render.
		requestAnimationFrame(() => {
			const el = ref.current;
			if (pending.current !== e) return; // a later change will place the cursor
			pending.current = null;
			if (!el) return;
			el.focus();
			el.setSelectionRange(e.start, e.end);
			setMarks(marksAt(e.value, e.start, e.end));
		});
	};

	const openAt = (clientX: number, clientY: number) => {
		const box = wrap.current?.getBoundingClientRect();
		if (!box) return;
		const [s, e] = range();
		setMarks(marksAt(value, s, e));
		setFieldsOpen(false);
		setMenu({ x: Math.max(0, Math.min(clientX - box.left - 16, box.width - MENU_W)), y: clientY - box.top + 14 });
	};

	// A press anywhere outside the menu closes it (a press in the box opens it again where it lands).
	useEffect(() => {
		if (!menu) return;
		const down = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && setMenu(null);
		document.addEventListener('mousedown', down, true);
		return () => document.removeEventListener('mousedown', down, true);
	}, [menu]);

	const mark = (m: '**' | '*') => apply(toggleMark(current(), ...range(), m));
	const list = () => apply(toggleList(current(), ...range()));
	const insert = (key: string) => {
		apply(insertToken(current(), ...range(), `{{${key}}}`));
		setMenu(null);
	};

	// The menu's buttons keep the focus (and the selection) in the box.
	const keep = (e: any) => e.preventDefault();
	const btn = (label: string, on: boolean, onClick: () => void, icon: ReactNode, text?: string) => (
		<chakra.button
			type='button'
			title={label}
			aria-label={label}
			aria-pressed={on}
			onMouseDown={keep}
			onClick={onClick}
			display='flex'
			alignItems='center'
			gap={1}
			px={text ? 2 : 0}
			justifyContent='center'
			minW='28px'
			h='28px'
			borderRadius='6px'
			fontSize='12.5px'
			color={on ? 'fg' : 'fg.muted'}
			bg={on ? 'bg.emphasized' : 'transparent'}
			_hover={{ bg: 'bg.muted', color: 'fg' }}>
			{icon}
			{text}
		</chakra.button>
	);

	return (
		<Box>
			<Box
				ref={wrap}
				position='relative'>
				{preview ? (
					<Box
						borderWidth='1px'
						borderColor='border'
						borderRadius='md'
						px={3}
						py={2.5}
						minH='118px'
						fontSize='14px'
						lineHeight='1.6'
						css={{
							'& p': { marginBottom: '10px' },
							'& ul': { paddingLeft: '22px', marginBottom: '10px', listStyle: 'disc' },
							'& .mint-chip': { display: 'inline-block', px: '6px', borderRadius: '4px', bg: 'bg.muted', color: 'fg.muted', fontSize: '12.5px' },
						}}
						dangerouslySetInnerHTML={{
							__html: value.trim() ? previewHtml(value, k => fields.find(f => f.key === k)?.label || k) : '<p style="opacity:.6">Nothing written yet.</p>',
						}}
					/>
				) : (
					<Textarea
						ref={ref}
						size='sm'
						rows={7}
						value={value}
						placeholder={placeholder}
						onFocus={() => (touched.current = true)}
						onChange={e => {
							touched.current = true;
							setMenu(null);
							onChange(e.target.value);
						}}
						onMouseUp={e => {
							if (e.button !== 0) return;
							const { clientX, clientY } = e;
							// After the click has placed the cursor (or ended a drag selection).
							setTimeout(() => openAt(clientX, clientY), 0);
						}}
						onContextMenu={e => {
							e.preventDefault();
							openAt(e.clientX, e.clientY);
						}}
						onKeyDown={e => {
							const mod = e.metaKey || e.ctrlKey;
							if (mod && (e.key === 'b' || e.key === 'i')) {
								e.preventDefault();
								mark(e.key === 'b' ? '**' : '*');
								return;
							}
							if (menu && !['Shift', 'Meta', 'Control', 'Alt'].includes(e.key)) setMenu(null);
						}}
					/>
				)}
				{menu && !preview && (
					<Box
						ref={menuRef}
						role='menu'
						aria-label='Format and insert'
						position='absolute'
						zIndex={5}
						top={`${menu.y}px`}
						left={`${menu.x}px`}
						w={`${MENU_W}px`}
						bg='bg.panel'
						borderWidth='1px'
						borderColor='border'
						borderRadius='10px'
						boxShadow='0 6px 20px rgb(0 0 0 / 0.14)'
						p={1}
						onMouseDown={keep}
						onKeyDown={e => e.key === 'Escape' && setMenu(null)}>
						<Flex
							gap={0.5}
							align='center'>
							{btn('Insert a field here', fieldsOpen, () => setFieldsOpen(v => !v), <Braces size={14} />, 'Insert a field')}
							<Box
								w='1px'
								h='18px'
								bg='border'
								mx={1}
							/>
							{btn('Bold (⌘B)', marks.bold, () => mark('**'), <Bold size={15} />)}
							{btn('Italic (⌘I)', marks.italic, () => mark('*'), <Italic size={15} />)}
							{btn('Bulleted list', marks.list, list, <List size={15} />)}
						</Flex>
						{fieldsOpen && (
							<Box
								mt={1}
								pt={1}
								borderTopWidth='1px'
								borderColor='border'
								maxH='200px'
								overflowY='auto'>
								{fields.map(f => (
									<chakra.button
										key={f.key}
										type='button'
										role='menuitem'
										display='block'
										w='full'
										textAlign='left'
										px={2}
										py={1}
										borderRadius='6px'
										fontSize='13px'
										onMouseDown={keep}
										onClick={() => insert(f.key)}
										_hover={{ bg: 'bg.muted' }}>
										{f.label}
									</chakra.button>
								))}
							</Box>
						)}
					</Box>
				)}
			</Box>
			<Flex
				mt={1}
				gap={2}
				align='center'
				wrap='wrap'>
				<Text
					flex={1}
					minW='200px'
					fontSize='12px'
					color='fg.muted'>
					{preview ? 'How the message reads in the email (in your email design).' : 'Click in the message to insert a field there, or make words bold, italic or a list.'}
				</Text>
				<Button
					size='xs'
					variant='ghost'
					onClick={() => {
						setMenu(null);
						setPreview(v => !v);
					}}>
					{preview ? <PenLine size={13} /> : <Eye size={13} />}
					{preview ? 'Edit' : 'Preview'}
				</Button>
				{!preview && (
					<Dropdown
						size='xs'
						w='170px'
						value=''
						placeholder='Insert a field'
						aria-label='Insert a field'
						items={fields.map(p => ({ value: p.key, label: p.label }))}
						onChange={k => insert(k)}
					/>
				)}
			</Flex>
		</Box>
	);
};

export default MessageEditor;
