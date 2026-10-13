'use client';

import { FC, ReactNode } from 'react';
import { Box, Flex, IconButton, Input, Switch, Text } from '@chakra-ui/react';
import { AlignCenter, AlignLeft, AlignRight, LucideIcon } from 'lucide-react';
import { Dropdown } from '@/components/library/cl';
import { Tooltip } from '@/components/ui/tooltip';

/** The designer's small inputs: a label beside or above, values in pt. */

export const Row: FC<{ label: string; children: ReactNode; hint?: string }> = ({ label, children, hint }) => (
	<Box>
		<Flex
			align='center'
			gap={3}>
			<Text
				fontSize='xs'
				color='fg.muted'
				w='92px'
				flexShrink={0}>
				{label}
			</Text>
			<Box
				flex='1'
				minW={0}>
				{children}
			</Box>
		</Flex>
		{hint && (
			<Text
				fontSize='11px'
				color='fg.subtle'
				mt={1}
				ml='104px'>
				{hint}
			</Text>
		)}
	</Box>
);

export const Num: FC<{ value: any; onChange: (v: number | undefined) => void; min?: number; max?: number; step?: number; placeholder?: string; unit?: string }> = ({
	value,
	onChange,
	min = 0,
	max = 1000,
	step = 1,
	placeholder,
	unit = 'pt',
}) => (
	<Flex
		align='center'
		gap={1.5}>
		<Input
			size='xs'
			type='number'
			min={min}
			max={max}
			step={step}
			value={value ?? ''}
			placeholder={placeholder}
			onChange={e => onChange(e.target.value === '' ? undefined : Math.min(max, Math.max(min, Number(e.target.value))))}
		/>
		{unit && (
			<Text
				fontSize='11px'
				color='fg.subtle'>
				{unit}
			</Text>
		)}
	</Flex>
);

export const Color: FC<{ value?: string; onChange: (v: string | undefined) => void; placeholder?: string }> = ({ value, onChange, placeholder = 'Default' }) => (
	<Flex
		align='center'
		gap={1.5}>
		<Box
			as='label'
			w='24px'
			h='24px'
			borderRadius='sm'
			borderWidth='1px'
			borderColor='border'
			flexShrink={0}
			cursor='pointer'
			position='relative'
			overflow='hidden'
			style={{ background: value || 'transparent' }}>
			<input
				type='color'
				value={value || '#000000'}
				onChange={e => onChange(e.target.value)}
				style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }}
			/>
		</Box>
		<Input
			size='xs'
			fontFamily='mono'
			value={value || ''}
			placeholder={placeholder}
			onChange={e => onChange(e.target.value.trim() || undefined)}
		/>
	</Flex>
);

export const Pick: FC<{ value: any; onChange: (v: string) => void; options: [string, string][] }> = ({ value, onChange, options }) => (
	<Dropdown
		size='xs'
		value={value == null ? '' : String(value)}
		onChange={onChange}>
		{options.map(([v, l]) => (
			<option
				key={v}
				value={v}>
				{l}
			</option>
		))}
	</Dropdown>
);

/** One choice of an IconPick: its icon, and the name + one line the hover card explains it with. */
export type IconOption = { value: string; label: string; hint?: string; icon: LucideIcon };

/**
 * A row of icon buttons, like Figma's alignment pickers: one is on, and
 * hovering any of them shows what it does.
 */
export const IconPick: FC<{ value: string; onChange: (v: string) => void; options: IconOption[]; label: string }> = ({ value, onChange, options, label }) => (
	<Flex
		role='radiogroup'
		aria-label={label}
		display='inline-flex'
		gap='2px'
		p='2px'
		bg='bg.muted'
		borderRadius='md'>
		{options.map(o => {
			const on = o.value === value;
			const Icon = o.icon;
			return (
				<Tooltip
					key={o.value}
					openDelay={150}
					showArrow
					positioning={{ placement: 'top' }}
					content={
						<Box
							maxW='200px'
							py={0.5}>
							{/* `inherit`: Text's own colour is the page's, unreadable on the card. */}
							<Text
								color='inherit'
								fontWeight='600'>
								{o.label}
							</Text>
							{o.hint && (
								<Text
									color='inherit'
									opacity={0.75}
									mt={0.5}>
									{o.hint}
								</Text>
							)}
						</Box>
					}>
					<IconButton
						role='radio'
						aria-checked={on}
						aria-label={o.label}
						size='xs'
						h='26px'
						minW='30px'
						variant='ghost'
						color={on ? 'fg' : 'fg.muted'}
						bg={on ? 'bg' : 'transparent'}
						boxShadow={on ? 'xs' : 'none'}
						_hover={{ bg: on ? 'bg' : 'bg.emphasized', color: 'fg' }}
						onClick={() => onChange(o.value)}>
						<Icon
							size={15}
							strokeWidth={1.75}
						/>
					</IconButton>
				</Tooltip>
			);
		})}
	</Flex>
);

export const Toggle: FC<{ checked: boolean; onChange: (v: boolean) => void; label: string }> = ({ checked, onChange, label }) => (
	<Switch.Root
		size='sm'
		checked={!!checked}
		onCheckedChange={e => onChange(!!e.checked)}>
		<Switch.HiddenInput />
		<Switch.Control />
		<Switch.Label fontSize='xs'>{label}</Switch.Label>
	</Switch.Root>
);

export const Section: FC<{ title: string; children: ReactNode; action?: ReactNode }> = ({ title, children, action }) => (
	<Box
		py={3}
		borderTopWidth='1px'
		borderColor='border'>
		<Flex
			align='center'
			mb={2.5}>
			<Text
				fontSize='11px'
				fontWeight='600'
				textTransform='uppercase'
				letterSpacing='0.05em'
				color='fg.muted'
				flex='1'>
				{title}
			</Text>
			{action}
		</Flex>
		<Flex
			direction='column'
			gap={2.5}>
			{children}
		</Flex>
	</Box>
);

export const ALIGN: IconOption[] = [
	{ value: 'left', label: 'Left', icon: AlignLeft },
	{ value: 'center', label: 'Centre', icon: AlignCenter },
	{ value: 'right', label: 'Right', icon: AlignRight },
];
/** The fonts a template can print in (backend fonts.ts). */
export const FONT: [string, string][] = [
	['sans', 'Geist (sans)'],
	['mono', 'Geist Mono'],
	['helvetica', 'Helvetica'],
	['times', 'Times'],
	['courier', 'Courier'],
];

export const WEIGHT: [string, string][] = [
	['400', 'Regular'],
	['500', 'Medium'],
	['600', 'Semibold'],
	['700', 'Bold'],
];
