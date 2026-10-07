'use client';

import { FC, ReactNode } from 'react';
import { Badge, Box, Flex, Grid, Text } from '@chakra-ui/react';
import { Calculator, Calendar, ChevronDown, Lock, Plus, Upload } from 'lucide-react';
import { EditableField, REFERENCE_KINDS, SELF, kindLabel } from './modelKinds';

/**
 * What the model's form will look like, drawn from the working copy as it's
 * edited: the fields in order, each as the input people will fill in. Nothing
 * here can be typed into — it's a picture, so a change in the list shows up
 * here before anything is saved.
 */

type Props = {
	fields: EditableField[];
	/** "Invoice" — for the form's title. */
	recordName: string;
	code?: { enabled: boolean; preview: string };
	access?: boolean;
};

const ICON = { size: 12, strokeWidth: 1.75 };

/** A fake input: an outlined box with a muted placeholder. */
const Box_: FC<{ children?: ReactNode; h?: string; dashed?: boolean; muted?: boolean }> = ({ children, h = '28px', dashed, muted }) => (
	<Flex
		align='center'
		justify='space-between'
		gap={2}
		minH={h}
		px={2}
		borderWidth='1px'
		borderStyle={dashed ? 'dashed' : 'solid'}
		borderColor='border'
		borderRadius='md'
		bg={muted ? 'bg.subtle' : 'bg.panel'}
		color='fg.subtle'
		fontSize='11px'
		overflow='hidden'
		// The theme paints every p and span in the page's text colour at 15px; a placeholder is muted.
		css={{ '& p, & span': { color: 'inherit', fontSize: 'inherit' } }}>
		{children}
	</Flex>
);

const optionLabels = (f: EditableField) => (f.options || []).filter(o => o.value?.trim()).map(o => o.label || o.value);

const Control: FC<{ f: EditableField; targetTitle: (ref?: string) => string }> = ({ f, targetTitle }) => {
	const opts = optionLabels(f);
	switch (f.kind) {
		case 'textarea':
		case 'editor':
			return (
				<Box_ h='52px'>
					<Text
						alignSelf='flex-start'
						pt={1.5}
						fontSize='inherit'>
						{f.kind === 'editor' ? 'B  I  •  Formatted text…' : 'Several lines…'}
					</Text>
				</Box_>
			);
		case 'boolean':
			return (
				<Flex
					align='center'
					gap={2}>
					<Box
						w='26px'
						h='15px'
						borderRadius='full'
						bg={f.default === true ? 'fg' : 'border'}
						position='relative'>
						<Box
							position='absolute'
							top='2px'
							left={f.default === true ? '13px' : '2px'}
							w='11px'
							h='11px'
							borderRadius='full'
							bg='bg.panel'
						/>
					</Box>
					<Text
						fontSize='11px'
						color='fg.muted'>
						{f.default === true ? 'Yes' : 'No'}
					</Text>
				</Flex>
			);
		case 'date':
			return (
				<Box_>
					<Text fontSize='inherit'>{f.default === 'now' ? 'Today' : 'Pick a date'}</Text>
					<Calendar {...ICON} />
				</Box_>
			);
		case 'select':
		case 'multiselect':
			return (
				<Box_>
					<Text
						fontSize='inherit'
						truncate>
						{opts.length ? (f.kind === 'multiselect' ? opts.slice(0, 3).join(', ') : opts.join(' / ')) : 'Pick one'}
					</Text>
					<ChevronDown {...ICON} />
				</Box_>
			);
		case 'tags':
			return (
				<Box_>
					<Flex
						gap={1}
						overflow='hidden'>
						{(opts.length ? opts.slice(0, 3) : ['tag', 'another']).map(t => (
							<Badge
								key={t}
								size='xs'
								variant='subtle'>
								{t}
							</Badge>
						))}
					</Flex>
				</Box_>
			);
		case 'color':
			return (
				<Flex
					align='center'
					gap={2}>
					<Box
						w='22px'
						h='22px'
						borderRadius='md'
						borderWidth='1px'
						borderColor='border'
						bg={typeof f.default === 'string' && /^#[0-9a-f]{3,8}$/i.test(f.default) ? f.default : 'bg.subtle'}
					/>
					<Text
						fontSize='11px'
						color='fg.subtle'
						fontFamily='mono'>
						{f.default || '#000000'}
					</Text>
				</Flex>
			);
		case 'password':
			return (
				<Box_>
					<Text
						fontSize='inherit'
						letterSpacing='0.2em'>
						••••••••
					</Text>
					<Lock {...ICON} />
				</Box_>
			);
		case 'formula':
			return (
				<Box_ muted>
					<Text
						fontSize='inherit'
						fontFamily='mono'
						truncate>
						= {f.formula?.trim() || 'calculated'}
					</Text>
					<Calculator {...ICON} />
				</Box_>
			);
		case 'image':
		case 'images':
		case 'file':
		case 'files':
		case 'video':
			return (
				<Box_
					h='40px'
					dashed>
					<Flex
						align='center'
						gap={1.5}
						mx='auto'>
						<Upload {...ICON} />
						<Text fontSize='inherit'>Upload {kindLabel(f.kind).toLowerCase()}</Text>
					</Flex>
				</Box_>
			);
		case 'reference':
		case 'references':
			return (
				<Box_>
					<Text
						fontSize='inherit'
						truncate>
						{f.ref ? `Choose ${f.kind === 'references' ? 'some' : 'a'} ${targetTitle(f.ref)}…` : 'Choose a record…'}
					</Text>
					<ChevronDown {...ICON} />
				</Box_>
			);
		default:
			return (
				<Box_>
					<Text
						fontSize='inherit'
						truncate>
						{f.default !== undefined && f.default !== '' ? String(f.default) : kindLabel(f.kind)}
					</Text>
				</Box_>
			);
	}
};

const Label: FC<{ f: EditableField }> = ({ f }) => (
	<Text
		fontSize='11px'
		fontWeight='600'
		mb={1}
		truncate>
		{f.label || f.key || <em>Unnamed field</em>}
		{f.required && (
			<Text
				as='span'
				color='red.fg'
				ml={0.5}>
				*
			</Text>
		)}
	</Text>
);

const Helper: FC<{ f: EditableField }> = ({ f }) =>
	f.helper ? (
		<Text
			fontSize='10.5px'
			color='fg.muted'
			mt={1}>
			{f.helper}
		</Text>
	) : null;

const Field: FC<{ f: EditableField; targetTitle: (ref?: string) => string }> = ({ f, targetTitle }) => {
	const subs = f.fields || [];
	if (f.kind === 'section')
		return (
			<Box
				borderWidth='1px'
				borderColor='border.muted'
				borderRadius='md'
				p={2.5}>
				<Text
					fontSize='11px'
					fontWeight='600'
					mb={2}>
					{f.label || f.key || 'Section'}
				</Text>
				<Flex
					direction='column'
					gap={2}>
					{subs.map(s => (
						<Box key={s.uid}>
							<Label f={s} />
							<Control
								f={s}
								targetTitle={targetTitle}
							/>
						</Box>
					))}
				</Flex>
			</Box>
		);
	if (f.kind === 'sectionlist')
		return (
			<Box>
				<Label f={f} />
				<Box
					borderWidth='1px'
					borderColor='border'
					borderRadius='md'
					overflow='hidden'>
					<Grid
						templateColumns={`repeat(${Math.max(subs.length, 1)}, minmax(0, 1fr))`}
						bg='bg.subtle'
						px={2}
						py={1}
						gap={2}>
						{subs.map(s => (
							<Text
								key={s.uid}
								fontSize='10px'
								color='fg.muted'
								truncate>
								{s.label || s.key}
							</Text>
						))}
					</Grid>
					<Flex
						align='center'
						gap={1}
						px={2}
						py={1.5}
						fontSize='11px'
						color='fg.muted'>
						<Plus {...ICON} />
						{f.addLabel || 'Add row'}
					</Flex>
				</Box>
				<Helper f={f} />
			</Box>
		);
	return (
		<Box>
			<Label f={f} />
			<Control
				f={f}
				targetTitle={targetTitle}
			/>
			<Helper f={f} />
		</Box>
	);
};

const FormPreview: FC<Props & { targets?: { name: string; title?: string }[] }> = ({ fields, recordName, code, access, targets = [] }) => {
	const targetTitle = (ref?: string) => {
		if (!ref || ref === SELF) return recordName.toLowerCase() || 'record';
		const t = targets.find(x => x.name === ref);
		return (t?.title || ref).toLowerCase();
	};
	const shown = fields.filter(f => f.label || f.key || REFERENCE_KINDS.includes(f.kind));

	return (
		<Box
			borderWidth='1px'
			borderColor='border'
			borderRadius='lg'
			bg='bg.panel'
			overflow='hidden'
			aria-hidden
			pointerEvents='none'
			userSelect='none'>
			<Flex
				align='center'
				justify='space-between'
				px={3}
				py={2}
				borderBottomWidth='1px'
				borderColor='border.muted'>
				<Text
					fontSize='xs'
					fontWeight='600'>
					New {recordName || 'record'}
				</Text>
				{code?.enabled && (
					<Text
						fontSize='10.5px'
						fontFamily='mono'
						color='fg.muted'>
						{code.preview}
					</Text>
				)}
			</Flex>
			<Flex
				direction='column'
				gap={3}
				p={3}>
				{shown.length ? (
					shown.map(f => (
						<Field
							key={f.uid}
							f={f}
							targetTitle={targetTitle}
						/>
					))
				) : (
					<Text
						fontSize='xs'
						color='fg.muted'>
						Add a field to see it here.
					</Text>
				)}
				{access && (
					<Box
						borderTopWidth='1px'
						borderColor='border.muted'
						pt={2.5}>
						<Text
							fontSize='11px'
							fontWeight='600'
							mb={1}>
							Manage access
						</Text>
						<Box_>
							<Text fontSize='inherit'>Private</Text>
							<ChevronDown {...ICON} />
						</Box_>
					</Box>
				)}
			</Flex>
			<Flex
				justify='flex-end'
				px={3}
				py={2}
				borderTopWidth='1px'
				borderColor='border.muted'>
				<Box
					px={2.5}
					py={1}
					borderRadius='md'
					bg='fg'
					color='bg'
					fontSize='11px'>
					Save
				</Box>
			</Flex>
		</Box>
	);
};

export default FormPreview;
