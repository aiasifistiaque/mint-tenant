'use client';

import { FC, ReactNode, useEffect, useRef, useState } from 'react';
import { Box, Button, Dialog, Field, Flex, Grid, Input, Portal, Switch, Text, Textarea } from '@chakra-ui/react';
import { Monitor, Smartphone } from 'lucide-react';
import { ModalFooter, radius } from '@/components/library';
import { Dropdown } from '@/components/library/cl';
import { LogoField } from '@/components/library/tenant/BusinessDetails';
import GuideLink from '@/components/library/tenant/GuideLink';
import { toaster } from '@/components/ui/toaster';
import { useAddMailDesignMutation, usePreviewMailDesignMutation, useUpdateMailDesignMutation } from '@/components/library/store/services/tenantApi';
import type { MailDesign, MailDesignInput, MailDesignsView } from '@/components/library/store/services/tenantApi';

/**
 * Design how a project's emails look (docs/messaging M-03a): plain — just
 * the text and a signature — or designed: a header with the logo or name,
 * colours, corners, a footer. A form on the left, the sample email on the
 * right, redrawn by the server as you change it (the same renderer the
 * emails go out through), at desktop or phone width.
 */

const labelCss: any = { fontSize: '13px', fontWeight: '600', m: 0 };
const hint = { fontSize: '12px', color: 'fg.muted' } as const;

/** One click to a look: header, buttons and page colours together. */
const THEMES: { label: string; header: string; button: string; page: string }[] = [
	{ label: 'Ink', header: '#111827', button: '#111827', page: '#f4f4f5' },
	{ label: 'Forest', header: '#065f46', button: '#047857', page: '#ecfdf5' },
	{ label: 'Ocean', header: '#1e3a8a', button: '#2563eb', page: '#eff6ff' },
	{ label: 'Berry', header: '#831843', button: '#db2777', page: '#fdf2f8' },
	{ label: 'Sunset', header: '#9a3412', button: '#ea580c', page: '#fff7ed' },
	{ label: 'Light', header: '#ffffff', button: '#111827', page: '#f4f4f5' },
];

const RADII = [
	{ value: '0', label: 'Square' },
	{ value: '6', label: 'Soft' },
	{ value: '12', label: 'Round' },
	{ value: '20', label: 'Rounder' },
];
const LOGO_HEIGHTS = ['28', '40', '56', '72'];
const ALIGNS = [
	{ value: 'left', label: 'Left' },
	{ value: 'center', label: 'Centre' },
];
const PLACEHOLDER_LABEL: Record<string, string> = {
	'business.name': 'Business name',
	'business.address': 'Address',
	'business.phone': 'Phone',
	'business.email': 'Business email',
	'business.website': 'Website',
	project: 'Project name',
	year: 'This year',
};

const formOf = (d: MailDesign): MailDesignInput => ({ name: d.name, style: d.style, font: d.font, width: d.width, header: { ...d.header }, colors: { ...d.colors }, radius: d.radius, footer: { ...d.footer } });

/** A part of the form: its heading and guide link, then its inputs. */
const Part: FC<{ title: string; section: string; children: ReactNode }> = ({ title, section, children }) => (
	<Flex
		direction='column'
		gap={3}
		pt={4}
		borderTopWidth='1px'
		borderColor='border'>
		<Flex
			align='center'
			justify='space-between'
			gap={2}>
			<Text
				fontSize='12px'
				fontWeight='600'
				letterSpacing='0.06em'
				textTransform='uppercase'
				color='fg.muted'>
				{title}
			</Text>
			<GuideLink section={section} />
		</Flex>
		{children}
	</Flex>
);

/** A colour: the swatch to pick, and its #rrggbb to type. */
const ColorField: FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
	<Field.Root>
		<Field.Label {...labelCss}>{label}</Field.Label>
		<Flex
			align='center'
			gap={2}
			w='full'>
			<Box
				as='label'
				boxSize='30px'
				flexShrink={0}
				borderRadius='md'
				borderWidth='1px'
				borderColor='border'
				bg={/^#[0-9a-f]{6}$/i.test(value) ? value : 'transparent'}
				cursor='pointer'
				position='relative'
				overflow='hidden'>
				<input
					type='color'
					aria-label={label}
					value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'}
					onChange={e => onChange(e.target.value)}
					style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
				/>
			</Box>
			<Input
				size='sm'
				fontFamily='mono'
				maxLength={7}
				value={value}
				onChange={e => onChange(e.target.value.trim())}
			/>
		</Flex>
	</Field.Root>
);

/** A text that takes the business details: the input, and "Insert a detail". */
const DetailText: FC<{ value: string; onChange: (v: string) => void; placeholders: string[]; multiline?: boolean; placeholder?: string }> = ({ value, onChange, placeholders, multiline, placeholder }) => (
	<Box w='full'>
		{multiline ? (
			<Textarea
				size='sm'
				rows={4}
				value={value}
				placeholder={placeholder}
				onChange={e => onChange(e.target.value)}
			/>
		) : (
			<Input
				size='sm'
				value={value}
				placeholder={placeholder}
				onChange={e => onChange(e.target.value)}
			/>
		)}
		<Flex
			mt={1}
			justify='flex-end'>
			<Dropdown
				size='xs'
				w='190px'
				value=''
				placeholder='Insert a detail'
				aria-label='Insert a detail'
				items={placeholders.map(k => ({ value: k, label: PLACEHOLDER_LABEL[k] || k }))}
				onChange={k => onChange(multiline ? `${value}${value && !value.endsWith('\n') ? '\n' : ''}{{${k}}}` : `${value}${value && !/\s$/.test(value) ? ' ' : ''}{{${k}}}`)}
			/>
		</Flex>
	</Box>
);

/** Plain or designed, as two cards. */
const StyleChoice: FC<{ value: MailDesignInput['style']; onChange: (v: MailDesignInput['style']) => void }> = ({ value, onChange }) => (
	<Grid
		templateColumns='1fr 1fr'
		gap={2}>
		{(
			[
				['plain', 'Plain', 'Just your words and a signature — like an email you wrote yourself.'],
				['designed', 'Designed', 'Your logo on top, your colours, a footer with your details.'],
			] as const
		).map(([v, title, text]) => (
			<Box
				key={v}
				as='button'
				textAlign='left'
				p={3}
				borderRadius='lg'
				borderWidth='1px'
				borderColor={value === v ? 'fg' : 'border'}
				bg={value === v ? 'bg.muted' : 'transparent'}
				aria-pressed={value === v}
				onClick={() => onChange(v)}>
				<Text
					fontSize='13px'
					fontWeight='600'>
					{title}
				</Text>
				<Text
					fontSize='12px'
					color='fg.muted'
					mt={0.5}>
					{text}
				</Text>
			</Box>
		))}
	</Grid>
);

type Props = {
	open: boolean;
	/** The design to edit; none = a new one. */
	design: MailDesign | null;
	view: MailDesignsView;
	onClose: () => void;
};

const DesignDialog: FC<Props> = ({ open, design, view, onClose }) => {
	const [add, adding] = useAddMailDesignMutation();
	const [update, updating] = useUpdateMailDesignMutation();
	const [preview] = usePreviewMailDesignMutation();
	const [form, setForm] = useState<MailDesignInput>(view.defaults);
	const [html, setHtml] = useState('');
	const [phone, setPhone] = useState(false);
	const [error, setError] = useState('');
	const seq = useRef(0);

	useEffect(() => {
		if (!open) return;
		setForm(design ? formOf(design) : { ...view.defaults, name: view.doc.length ? '' : view.defaults.name });
		setError('');
	}, [open, design?._id]);

	// Redraw the sample a moment after the last change; an older answer never replaces a newer one.
	useEffect(() => {
		if (!open) return;
		const n = ++seq.current;
		const t = setTimeout(async () => {
			try {
				const r = await preview(form).unwrap();
				if (n === seq.current) setHtml(r.html);
			} catch {
				/* the last preview stays */
			}
		}, 250);
		return () => clearTimeout(t);
	}, [open, form]);

	const set = (patch: Partial<MailDesignInput>) => {
		setForm(f => ({ ...f, ...patch }));
		setError('');
	};
	const setHeader = (patch: Partial<MailDesignInput['header']>) => set({ header: { ...form.header, ...patch } });
	const setColors = (patch: Partial<MailDesignInput['colors']>) => set({ colors: { ...form.colors, ...patch } });
	const designed = form.style === 'designed';

	const save = async () => {
		setError('');
		try {
			const body = { ...form, name: form.name.trim() };
			if (design) await update({ ...body, id: design._id }).unwrap();
			else await add(body).unwrap();
			toaster.create({ type: 'success', title: design ? 'Saved.' : view.doc.length ? 'Design added.' : 'Design added — the project’s emails use it now.' });
			onClose();
		} catch (e: any) {
			setError(e?.data?.message || 'Not saved — try again.');
		}
	};

	return (
		<Dialog.Root
			placement='center'
			size='cover'
			open={open}
			onOpenChange={e => !e.open && onClose()}>
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<Dialog.Content
						borderRadius={radius.MODAL}
						bg='bg.panel'
						borderWidth='1px'
						borderColor='border'
						maxH='calc(100dvh - 32px)'
						overflow='hidden'>
						<Dialog.Header
							px={{ base: 4, md: 6 }}
							pt={{ base: 4, md: 5 }}
							pb={{ base: 3, md: 4 }}>
							<Flex
								align='center'
								justify='space-between'
								gap={3}
								pr={2}
								w='full'>
								<Dialog.Title fontSize='16px'>{design ? `Edit ${design.name}` : 'New email design'}</Dialog.Title>
								<GuideLink section='email-designs' />
							</Flex>
						</Dialog.Header>
						<Dialog.Body
							px={0}
							py={0}
							minH={0}
							overflow='hidden'
							display='flex'>
							<Grid
								templateColumns={{ base: '1fr', lg: '400px 1fr' }}
								w='full'
								minH={0}>
								{/* The form */}
								<Flex
									direction='column'
									gap={4}
									px={{ base: 4, md: 6 }}
									pb={6}
									overflowY='auto'
									minH={0}>
									<Field.Root required>
										<Field.Label {...labelCss}>Name</Field.Label>
										<Input
											size='sm'
											autoFocus
											maxLength={80}
											value={form.name}
											placeholder='e.g. Receipts, Newsletter'
											onChange={e => set({ name: e.target.value })}
										/>
										<Field.HelperText {...hint}>For your team — your customers never see it.</Field.HelperText>
									</Field.Root>

									<Part
										title='Look'
										section='design-look'>
										<StyleChoice
											value={form.style}
											onChange={style => set({ style })}
										/>
										<Field.Root>
											<Field.Label {...labelCss}>Font</Field.Label>
											<Dropdown
												size='sm'
												value={form.font}
												onChange={font => set({ font })}
												items={view.fonts}
											/>
											<Field.HelperText {...hint}>Fonts every email app has, so it looks the same everywhere.</Field.HelperText>
										</Field.Root>
										{designed && (
											<Field.Root>
												<Field.Label {...labelCss}>Start from colours</Field.Label>
												<Flex
													gap={1.5}
													wrap='wrap'>
													{THEMES.map(t => (
														<Button
															key={t.label}
															size='xs'
															variant='outline'
															onClick={() =>
																set({
																	header: { ...form.header, background: t.header, color: t.header === '#ffffff' ? '#111827' : '#ffffff' },
																	colors: { ...form.colors, button: t.button, page: t.page },
																})
															}>
															<Box
																boxSize='10px'
																borderRadius='full'
																bg={t.header}
																borderWidth='1px'
																borderColor='border'
															/>
															{t.label}
														</Button>
													))}
												</Flex>
											</Field.Root>
										)}
									</Part>

									{designed && (
										<Part
											title='Header'
											section='design-header'>
											<Switch.Root
												size='sm'
												checked={form.header.show}
												onCheckedChange={e => setHeader({ show: !!e.checked })}>
												<Switch.HiddenInput />
												<Switch.Control />
												<Switch.Label fontSize='13px'>Show a header</Switch.Label>
											</Switch.Root>
											{form.header.show && (
												<>
													<Field.Root>
														<Field.Label {...labelCss}>Logo</Field.Label>
														<LogoField
															size='64px'
															value={form.header.logo}
															onChange={logo => setHeader({ logo })}
														/>
														<Field.HelperText {...hint}>In emails use PNG or JPG — Gmail and Outlook don’t show SVG.</Field.HelperText>
													</Field.Root>
													<Field.Root>
														<Field.Label {...labelCss}>Title</Field.Label>
														<DetailText
															value={form.header.title}
															onChange={title => setHeader({ title })}
															placeholders={view.placeholders}
															placeholder='Your business name — empty for the logo alone'
														/>
													</Field.Root>
													<Grid
														templateColumns='1fr 1fr'
														gap={3}>
														<Field.Root>
															<Field.Label {...labelCss}>Logo height</Field.Label>
															<Dropdown
																size='sm'
																value={String(form.header.logoHeight)}
																onChange={v => setHeader({ logoHeight: Number(v) })}
																items={LOGO_HEIGHTS.map(h => ({ value: h, label: `${h} px` }))}
															/>
														</Field.Root>
														<Field.Root>
															<Field.Label {...labelCss}>Line up</Field.Label>
															<Dropdown
																size='sm'
																value={form.header.align}
																onChange={v => setHeader({ align: v as 'left' | 'center' })}
																items={ALIGNS}
															/>
														</Field.Root>
														<ColorField
															label='Background'
															value={form.header.background}
															onChange={background => setHeader({ background })}
														/>
														<ColorField
															label='Title colour'
															value={form.header.color}
															onChange={color => setHeader({ color })}
														/>
													</Grid>
												</>
											)}
										</Part>
									)}

									<Part
										title={designed ? 'Colours and shape' : 'Colours'}
										section='design-colours'>
										<Grid
											templateColumns='1fr 1fr'
											gap={3}>
											<ColorField
												label='Text'
												value={form.colors.text}
												onChange={text => setColors({ text })}
											/>
											<ColorField
												label={designed ? 'Buttons' : 'Links'}
												value={form.colors.button}
												onChange={button => setColors({ button })}
											/>
											{designed && (
												<>
													<ColorField
														label='Heading'
														value={form.colors.heading}
														onChange={heading => setColors({ heading })}
													/>
													<ColorField
														label='Button text'
														value={form.colors.buttonText}
														onChange={buttonText => setColors({ buttonText })}
													/>
													<ColorField
														label='Card'
														value={form.colors.card}
														onChange={card => setColors({ card })}
													/>
													<ColorField
														label='Around the card'
														value={form.colors.page}
														onChange={page => setColors({ page })}
													/>
													<Field.Root>
														<Field.Label {...labelCss}>Corners</Field.Label>
														<Dropdown
															size='sm'
															value={String(form.radius)}
															onChange={v => set({ radius: Number(v) })}
															items={RADII.some(r => r.value === String(form.radius)) ? RADII : [...RADII, { value: String(form.radius), label: `${form.radius} px` }]}
														/>
													</Field.Root>
													<Field.Root>
														<Field.Label {...labelCss}>Width</Field.Label>
														<Dropdown
															size='sm'
															value={String(form.width)}
															onChange={v => set({ width: Number(v) })}
															items={view.widths.map(w => ({ value: String(w), label: `${w} px${w === 560 ? ' (usual)' : ''}` }))}
														/>
													</Field.Root>
												</>
											)}
										</Grid>
									</Part>

									<Part
										title={designed ? 'Footer' : 'Signature'}
										section='design-footer'>
										<Field.Root>
											<DetailText
												multiline
												value={form.footer.text}
												onChange={text => set({ footer: { ...form.footer, text } })}
												placeholders={view.placeholders}
												placeholder={designed ? '{{business.name}}\n{{business.address}}' : 'Rita\n{{business.name}}'}
											/>
											<Field.HelperText {...hint}>
												{designed ? 'Under the card, small. ' : 'Under your text. '}A line whose detail is empty is left out — fill them in Project → Settings.
											</Field.HelperText>
										</Field.Root>
										{designed && (
											<Field.Root>
												<Field.Label {...labelCss}>Line up</Field.Label>
												<Dropdown
													size='sm'
													value={form.footer.align}
													onChange={v => set({ footer: { ...form.footer, align: v as 'left' | 'center' } })}
													items={ALIGNS}
												/>
											</Field.Root>
										)}
									</Part>

									{error && (
										<Text
											role='alert'
											fontSize='13px'
											color='red.fg'>
											{error}
										</Text>
									)}
								</Flex>

								{/* The preview */}
								<Flex
									direction='column'
									bg='bg.muted'
									borderLeftWidth={{ base: 0, lg: '1px' }}
									borderTopWidth={{ base: '1px', lg: 0 }}
									borderColor='border'
									minH={{ base: '520px', lg: 0 }}>
									<Flex
										align='center'
										justify='space-between'
										gap={2}
										px={4}
										py={2.5}>
										<Text
											fontSize='12px'
											color='fg.muted'>
											A sample email in this design — receipts, welcomes and automations look like this.
										</Text>
										<Flex gap={1}>
											<Button
												size='xs'
												variant={phone ? 'ghost' : 'outline'}
												aria-pressed={!phone}
												onClick={() => setPhone(false)}>
												<Monitor size={13} />
												Desktop
											</Button>
											<Button
												size='xs'
												variant={phone ? 'outline' : 'ghost'}
												aria-pressed={phone}
												onClick={() => setPhone(true)}>
												<Smartphone size={13} />
												Phone
											</Button>
										</Flex>
									</Flex>
									<Flex
										flex='1'
										justify='center'
										px={4}
										pb={4}
										minH={0}>
										<Box
											as='iframe'
											title='Email preview'
											{...({ srcDoc: html, sandbox: 'allow-same-origin' } as any)}
											w={phone ? '375px' : 'full'}
											maxW='full'
											h='full'
											minH='480px'
											bg='white'
											borderRadius='md'
											borderWidth='1px'
											borderColor='border'
										/>
									</Flex>
								</Flex>
							</Grid>
						</Dialog.Body>

						<ModalFooter>
							<Button
								size='sm'
								variant='outline'
								px={3}
								onClick={onClose}>
								Cancel
							</Button>
							<Button
								size='sm'
								px={3}
								loading={adding.isLoading || updating.isLoading}
								disabled={!form.name.trim()}
								onClick={save}>
								{design ? 'Save' : 'Add the design'}
							</Button>
						</ModalFooter>
					</Dialog.Content>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
};

export default DesignDialog;
