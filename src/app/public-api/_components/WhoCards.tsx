'use client';

import { FC } from 'react';
import { Box, Flex, Grid, Text, chakra } from '@chakra-ui/react';
import { Check } from 'lucide-react';
import { TONES } from '@/theme/tones';
import type { EndpointWho } from '@/components/library/store/services/apiBuilderApi';
import { WHO } from './shared';

/** Who can call an endpoint, as three cards — anyone, signed-in customers, a server key. */
const WhoCards: FC<{ value: EndpointWho; onChange: (w: EndpointWho) => void; compact?: boolean; disabled?: boolean }> = ({
	value,
	onChange,
	compact,
	disabled,
}) => (
	<Grid
		role='radiogroup'
		aria-label='Who can call it'
		templateColumns={{ base: '1fr', md: compact ? '1fr' : 'repeat(3, minmax(0, 1fr))' }}
		gap={2}>
		{WHO.map(w => {
			const on = value === w.value;
			const t = TONES[w.tone];
			return (
				<chakra.button
					key={w.value}
					type='button'
					role='radio'
					aria-checked={on}
					disabled={disabled}
					onClick={() => onChange(w.value)}
					textAlign='left'
					p={compact ? 2.5 : 3.5}
					borderWidth='1px'
					borderRadius='lg'
					borderColor={on ? t.solid : 'border'}
					bg={on ? t.soft : 'transparent'}
					cursor={disabled ? 'not-allowed' : 'pointer'}
					opacity={disabled ? 0.6 : 1}
					transition='border-color .12s, background .12s'
					_hover={disabled ? undefined : { borderColor: on ? t.solid : 'fg.muted' }}>
					<Flex
						align='center'
						gap={2}>
						<Box color={t.fg}>{w.icon}</Box>
						<Text
							fontSize='13.5px'
							fontWeight='500'
							flex={1}>
							{w.label}
						</Text>
						{on && (
							<Box color={t.fg}>
								<Check size={15} />
							</Box>
						)}
					</Flex>
					<Text
						fontSize='12px'
						color='fg.muted'
						mt={1}
						lineHeight='1.5'>
						{w.does}
					</Text>
				</chakra.button>
			);
		})}
	</Grid>
);

export default WhoCards;
