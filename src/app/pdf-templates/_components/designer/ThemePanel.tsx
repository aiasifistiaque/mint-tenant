'use client';

import { FC, useState } from 'react';
import { Box, Flex, Grid, Text } from '@chakra-ui/react';
import { Check, Palette as PaletteIcon } from 'lucide-react';
import { PdfTemplate } from '@/components/library/pdf/types';
import { fontStack, usePdfFonts } from '@/components/library/pdf/PdfPage';
import { LOOKS, PAIRINGS, PALETTES, ROLES, ROLE_INFO, Palette, applyLook, familyLabel, pairingOf, paletteMatches, paletteOf, roleColors } from '@/components/library/pdf/theme';
import { Color, FONT, Pick, Row, Section } from './controls';
import { DocLink } from '../ui';

/**
 * The Theme tab (docs/pdf-templates D24): ready looks, then colours and
 * fonts to mix and match, then each colour and font on its own. Picking a
 * preset recolours the whole page — blocks whose colours are theme roles
 * follow it, and literal colours that play a role become roles first.
 */

/** Text, muted and accent always have a colour; the newer roles go back to following the accent when cleared. */
const REQUIRED: Record<string, string | undefined> = { text: '#111111', muted: '#6b7280', accent: '#2563eb' };

const Swatches: FC<{ p: Record<string, string>; size?: number }> = ({ p, size = 14 }) => (
	<Flex gap='3px'>
		{(['accent', 'dark', 'soft', 'text', 'line'] as const).map(r => (
			<Box
				key={r}
				w={`${size}px`}
				h={`${size}px`}
				borderRadius='full'
				borderWidth='1px'
				borderColor='blackAlpha.200'
				style={{ background: p[r] }}
			/>
		))}
	</Flex>
);

const Card: FC<{ on: boolean; onClick: () => void; children: React.ReactNode; label: string }> = ({ on, onClick, children, label }) => (
	<Box
		as='button'
		aria-label={label}
		aria-pressed={on}
		onClick={onClick}
		textAlign='left'
		w='full'
		minW={0}
		p={2}
		borderRadius='md'
		borderWidth='1px'
		borderColor={on ? 'blue.500' : 'border'}
		boxShadow={on ? '0 0 0 1px var(--chakra-colors-blue-500)' : undefined}
		bg='bg'
		cursor='pointer'
		position='relative'
		_hover={{ borderColor: on ? 'blue.500' : 'border.emphasized', bg: 'bg.subtle' }}>
		{on && (
			<Box
				position='absolute'
				top={1.5}
				right={1.5}
				color='blue.500'>
				<Check size={13} />
			</Box>
		)}
		{children}
	</Box>
);

const ThemePanel: FC<{ template: PdfTemplate; onChange: (t: PdfTemplate) => void }> = ({ template: t, onChange }) => {
	usePdfFonts();
	const [note, setNote] = useState('');
	const s = t.style as any;
	const roles = roleColors(s);
	const apply = (pick: { look?: string; palette?: string; pairing?: string }) => {
		const { template, adopted } = applyLook(t as any, pick);
		onChange(template as PdfTemplate);
		setNote(adopted ? `${adopted} colour${adopted === 1 ? '' : 's'} and fonts on the page now follow the theme — before, they were fixed.` : '');
	};
	const setStyle = (p: Record<string, any>) => onChange({ ...t, style: { ...t.style, ...p } });
	const palettePicked = (p: Palette) => paletteMatches(s, p);
	const pairingPicked = (k: string) => {
		const p = pairingOf(k);
		return !!p && p.font === s.font && p.heading === (s.heading || s.font);
	};

	return (
		<Box>
			<Flex
				align='center'
				mb={2}>
				<Text
					fontSize='xs'
					color='fg.muted'
					flex='1'>
					A look changes the colours and fonts of the whole page.
				</Text>
				<DocLink
					section='themes'
					label='?'
				/>
			</Flex>
			{note && (
				<Text
					fontSize='xs'
					color='green.fg'
					mb={2}>
					{note}
				</Text>
			)}

			<Section title='Looks'>
				<Grid
					templateColumns='repeat(2, minmax(0, 1fr))'
					gap={2}>
					{LOOKS.map(l => {
						const p = paletteOf(l.palette)!;
						const f = pairingOf(l.pairing)!;
						return (
							<Card
								key={l.key}
								label={`Look: ${l.name}`}
								on={palettePicked(p) && pairingPicked(l.pairing)}
								onClick={() => apply({ look: l.key })}>
								<Box
									h='38px'
									borderRadius='sm'
									mb={1.5}
									px={2}
									display='flex'
									alignItems='center'
									justifyContent='space-between'
									style={{ background: p.soft }}>
									<Text
										fontSize='17px'
										fontWeight='700'
										lineHeight='1'
										style={{ fontFamily: fontStack(f.heading), color: p.accent }}>
										Aa
									</Text>
									<Box
										w='22px'
										h='8px'
										borderRadius='full'
										style={{ background: p.dark }}
									/>
								</Box>
								<Text
									fontSize='xs'
									fontWeight='600'>
									{l.name}
								</Text>
								<Text
									fontSize='10px'
									color='fg.muted'
									truncate>
									{familyLabel(f.heading)}
									{f.heading !== f.font ? ` + ${familyLabel(f.font)}` : ''}
								</Text>
							</Card>
						);
					})}
				</Grid>
			</Section>

			<Section title='Colours'>
				<Grid
					templateColumns='repeat(2, minmax(0, 1fr))'
					gap={1.5}>
					{PALETTES.map(p => (
						<Card
							key={p.key}
							label={`Colours: ${p.name}`}
							on={palettePicked(p)}
							onClick={() => apply({ palette: p.key })}>
							<Swatches p={p} />
							<Text
								fontSize='xs'
								mt={1}>
								{p.name}
							</Text>
						</Card>
					))}
				</Grid>
			</Section>

			<Section title='Fonts'>
				{PAIRINGS.map(p => (
					<Card
						key={p.key}
						label={`Fonts: ${p.name}`}
						on={pairingPicked(p.key)}
						onClick={() => apply({ pairing: p.key })}>
						<Text
							fontSize='15px'
							fontWeight='700'
							lineHeight='1.2'
							style={{ fontFamily: fontStack(p.heading) }}>
							{p.name}
						</Text>
						<Text
							fontSize='11px'
							color='fg.muted'
							style={{ fontFamily: fontStack(p.font) }}>
							Invoice no. 0042 · Total ₹1,250.00
						</Text>
					</Card>
				))}
			</Section>

			<Section title='Your own'>
				<Row
					label='Headings'
					hint='Titles and the business name in the starters; any text block can use it (Font → Heading font).'>
					<Pick
						value={s.heading || s.font}
						options={FONT}
						onChange={v => setStyle({ heading: v, pairing: undefined })}
					/>
				</Row>
				<Row label='Text'>
					<Pick
						value={s.font}
						options={FONT}
						onChange={v => setStyle({ font: v, pairing: undefined })}
					/>
				</Row>
				{ROLES.map(r => (
					<Row
						key={r}
						label={ROLE_INFO[r].label}
						hint={ROLE_INFO[r].hint}>
						<Color
							roles={false}
							value={roles[r]}
							onChange={v => setStyle({ [r === 'text' ? 'color' : r]: v ? v.toLowerCase() : REQUIRED[r], palette: undefined })}
						/>
					</Row>
				))}
				<Text
					fontSize='xs'
					color='fg.muted'>
					A block’s colour picked from the theme dots follows these; a typed hex stays as it is.
				</Text>
			</Section>
		</Box>
	);
};

/** The bar above the left panel's tabs: the theme in use (colours, fonts) — opens the Theme view. */
export const ThemeBar: FC<{ template: PdfTemplate; on: boolean; onClick: () => void }> = ({ template: t, on, onClick }) => {
	const s = t.style as any;
	const heading = s.heading || s.font;
	return (
		<Box
			as='button'
			aria-pressed={on}
			onClick={onClick}
			w='full'
			mb={3}
			px={2.5}
			py={2}
			display='flex'
			alignItems='center'
			gap={2.5}
			borderRadius='md'
			borderWidth='1px'
			borderColor={on ? 'blue.500' : 'border'}
			bg={on ? 'bg.subtle' : 'bg'}
			cursor='pointer'
			textAlign='left'
			_hover={{ bg: 'bg.subtle' }}>
			<PaletteIcon size={15} />
			<Box
				flex='1'
				minW={0}>
				<Text
					fontSize='xs'
					fontWeight='600'>
					Theme
				</Text>
				<Text
					fontSize='11px'
					color='fg.muted'
					truncate>
					{familyLabel(heading)}
					{heading !== s.font ? ` + ${familyLabel(s.font)}` : ''}
				</Text>
			</Box>
			<Swatches
				p={roleColors(s)}
				size={12}
			/>
		</Box>
	);
};

export default ThemePanel;
