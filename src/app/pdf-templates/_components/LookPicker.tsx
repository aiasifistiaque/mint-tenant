'use client';

import { FC, useMemo } from 'react';
import { Box, Flex, Grid, Text } from '@chakra-ui/react';
import { Check } from 'lucide-react';
import { PdfTemplate } from '@/components/library/pdf/types';
import { fontStack, usePdfFonts } from '@/components/library/pdf/PdfPage';
import { LOOKS, applyLook, familyLabel, pairingOf, paletteOf } from '@/components/library/pdf/theme';
import Thumb from './Thumb';

/**
 * "Pick a look" when a template is made (docs/pdf-templates D24): the
 * starter drawn in each ready look — colours and fonts for the whole page —
 * or as designed. Without a starter (blank) the looks show as swatches.
 * '' = as designed. The Theme tab in the designer changes it later.
 */
const LookPicker: FC<{ base?: PdfTemplate; settings?: any; value: string; onChange: (look: string) => void }> = ({ base, settings, value, onChange }) => {
	usePdfFonts();
	const variants = useMemo(() => (base ? LOOKS.map(l => ({ look: l, template: applyLook(base as any, { look: l.key }).template as PdfTemplate })) : []), [base]);

	const frame = (key: string, name: string, sub: string, body: React.ReactNode) => {
		const on = value === key;
		return (
			<Box
				key={key || 'designed'}
				as='button'
				aria-pressed={on}
				aria-label={`Look: ${name}`}
				onClick={() => onChange(key)}
				textAlign='left'
				borderRadius='md'
				borderWidth='1px'
				borderColor={on ? 'blue.500' : 'border'}
				boxShadow={on ? '0 0 0 1px var(--chakra-colors-blue-500)' : undefined}
				overflow='hidden'
				bg='bg'
				cursor='pointer'
				position='relative'
				_hover={{ borderColor: on ? 'blue.500' : 'border.emphasized' }}>
				{body}
				<Flex
					align='center'
					gap={2}
					px={2.5}
					py={2}>
					<Box
						flex='1'
						minW={0}>
						<Text
							fontSize='sm'
							fontWeight='600'>
							{name}
						</Text>
						<Text
							fontSize='xs'
							color='fg.muted'
							truncate>
							{sub}
						</Text>
					</Box>
					{on && (
						<Box color='blue.500'>
							<Check size={15} />
						</Box>
					)}
				</Flex>
			</Box>
		);
	};

	const fonts = (pairing: string) => {
		const f = pairingOf(pairing)!;
		return `${familyLabel(f.heading)}${f.heading !== f.font ? ` + ${familyLabel(f.font)}` : ''}`;
	};

	return (
		<Grid
			templateColumns={{ base: '1fr 1fr', md: 'repeat(4, 1fr)' }}
			gap={3}>
			{base &&
				frame(
					'',
					'As designed',
					'The starter’s own colours and fonts',
					<Thumb
						template={base}
						settings={settings}
						height={170}
					/>
				)}
			{base
				? variants.map(({ look, template }) =>
						frame(
							look.key,
							look.name,
							`${paletteOf(look.palette)!.name} · ${fonts(look.pairing)}`,
							<Thumb
								template={template}
								settings={settings}
								height={170}
							/>
						)
					)
				: LOOKS.map(l => {
						const p = paletteOf(l.palette)!;
						const f = pairingOf(l.pairing)!;
						return frame(
							l.key,
							l.name,
							`${p.name} · ${fonts(l.pairing)}`,
							<Flex
								h='86px'
								px={4}
								align='center'
								justify='space-between'
								style={{ background: p.soft }}>
								<Text
									fontSize='26px'
									fontWeight='700'
									style={{ fontFamily: fontStack(f.heading), color: p.accent }}>
									Aa
								</Text>
								<Flex gap='4px'>
									{[p.accent, p.dark, p.text].map(c => (
										<Box
											key={c}
											w='14px'
											h='14px'
											borderRadius='full'
											style={{ background: c }}
										/>
									))}
								</Flex>
							</Flex>
						);
					})}
		</Grid>
	);
};

export default LookPicker;
