'use client';

import { FC, Fragment } from 'react';
import { Box, Flex, Text, chakra } from '@chakra-ui/react';
import { Check } from 'lucide-react';

/**
 * The steps across the top of a form in pages (docs/multi-page-forms): numbered
 * circles with their labels, joined by lines — the current one in the accent
 * colour, passed ones ticked. On a phone it folds to one line, "Step 2 of 6 ·
 * Pricing", over a thin progress bar (D9).
 */

type Props = {
	titles: string[];
	current: number;
	/** Steps the person may jump to now. */
	canGo: (i: number) => boolean;
	/** Steps already passed (ticked). */
	done: (i: number) => boolean;
	onGo: (i: number) => void;
};

const Stepper: FC<Props> = ({ titles, current, canGo, done, onGo }) => (
	<Box
		as='nav'
		aria-label='Form steps'
		bg='bg.panel'
		borderWidth='1px'
		borderColor='border'
		borderRadius='xl'
		px={{ base: 4, md: 6 }}
		py={{ base: 3, md: 4 }}>
		{/* Phone: one line and a bar. */}
		<Box display={{ base: 'block', md: 'none' }}>
			<Text
				fontSize='sm'
				color='fg.muted'>
				Step {current + 1} of {titles.length} ·{' '}
				<Box
					as='span'
					fontSize='inherit'
					color='fg'
					fontWeight='600'>
					{titles[current]}
				</Box>
			</Text>
			<Box
				mt={2}
				h='4px'
				borderRadius='full'
				bg='bg.muted'
				overflow='hidden'>
				<Box
					h='full'
					w={`${((current + 1) / titles.length) * 100}%`}
					bg='accent.solid'
					borderRadius='full'
					transition='width 0.2s'
				/>
			</Box>
		</Box>

		{/* Computer: every step. */}
		<Flex
			as='ol'
			display={{ base: 'none', md: 'flex' }}
			align='center'
			gap={3}
			listStyleType='none'
			m={0}
			p={0}>
			{titles.map((title, i) => {
				const isCurrent = i === current;
				const isDone = !isCurrent && done(i);
				const clickable = !isCurrent && canGo(i);
				return (
					<Fragment key={i}>
						{i > 0 && (
							<Box
								as='li'
								aria-hidden
								flex='1'
								minW='16px'
								h='1.5px'
								borderRadius='full'
								bg={done(i - 1) && (isDone || isCurrent) ? 'accent.solid' : 'border'}
							/>
						)}
						<Flex
							as='li'
							flexShrink={0}>
							<chakra.button
								type='button'
								display='flex'
								alignItems='center'
								gap={2.5}
								bg='transparent'
								p={0}
								disabled={!clickable}
								aria-current={isCurrent ? 'step' : undefined}
								cursor={clickable ? 'pointer' : 'default'}
								onClick={() => clickable && onGo(i)}
								_hover={clickable ? { '& .step-label': { color: 'fg' } } : undefined}>
								<Flex
									align='center'
									justify='center'
									w='34px'
									h='34px'
									borderRadius='full'
									borderWidth='1.5px'
									borderColor={isCurrent || isDone ? 'accent.solid' : 'border.emphasized'}
									bg={isDone ? 'accent.solid' : 'bg.panel'}
									color={isDone ? 'accent.contrast' : isCurrent ? 'accent.fg' : 'fg.muted'}
									fontSize='sm'
									fontWeight='600'
									transition='all 0.15s'>
									{isDone ? (
										<Check
											size={16}
											strokeWidth={2.5}
										/>
									) : (
										i + 1
									)}
								</Flex>
								<Text
									className='step-label'
									fontSize='sm'
									fontWeight={isCurrent ? '600' : '500'}
									color={isCurrent ? 'fg' : 'fg.muted'}
									whiteSpace='nowrap'>
									{title}
								</Text>
							</chakra.button>
						</Flex>
					</Fragment>
				);
			})}
		</Flex>
	</Box>
);

export default Stepper;
