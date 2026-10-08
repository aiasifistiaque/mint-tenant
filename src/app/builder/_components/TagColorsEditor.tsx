'use client';

import { FC } from 'react';
import { Badge, Box, Button, Flex, Switch, Text } from '@chakra-ui/react';
import { RotateCcw } from 'lucide-react';
import { TAG_PALETTES, choicesOf, defaultTagColor } from '@/components/library/functions/optionColors';

/**
 * A choice field's coloured tags (settings `schema.colorTags`,
 * `schema.optionColors`): a switch, then each option with its colour — a
 * default to start with (paid green, void red…), any of the palettes on a
 * click. Only picked colours are stored; the rest follow the defaults.
 */

type Props = {
	schema: any;
	/** The model's own choices for the field (an enum), when the settings list none. */
	enumValues?: any[];
	isBoolean?: boolean;
	disabled?: boolean;
	onChange: (patch: Record<string, any>) => void;
};

/** Whether a field has options to colour. */
export const hasChoices = (schema: any, enumValues?: any[], isBoolean?: boolean) =>
	choicesOf(schema, { enum: enumValues, boolean: isBoolean }).length > 0;

const TagColorsEditor: FC<Props> = ({ schema, enumValues, isBoolean, disabled, onChange }) => {
	const options = choicesOf(schema, { enum: enumValues, boolean: isBoolean });
	const on = !!schema?.colorTags;
	const picked: Record<string, string> = schema?.optionColors || {};
	const setColor = (value: any, color: string | undefined) => {
		const next = { ...picked };
		if (color) next[String(value)] = color;
		else delete next[String(value)];
		onChange({ optionColors: Object.keys(next).length ? next : undefined });
	};

	return (
		<Box>
			<Switch.Root
				size='sm'
				checked={on}
				disabled={disabled}
				onCheckedChange={e => onChange({ colorTags: e.checked || undefined })}>
				<Switch.HiddenInput />
				<Switch.Control>
					<Switch.Thumb />
				</Switch.Control>
				<Switch.Label fontSize='xs'>
					{on ? 'Shown as coloured tags in the table and on the record page' : 'Show as coloured tags'}
				</Switch.Label>
			</Switch.Root>

			{on && (
				<Flex
					direction='column'
					gap={2}
					mt={3}>
					{options.map((o, i) => {
						const key = String(o.value);
						const color = picked[key] || defaultTagColor(o.value, i);
						return (
							<Flex
								key={key}
								align='center'
								gap={3}
								flexWrap='wrap'>
								<Box w='140px'>
									<Badge
										size='sm'
										variant='subtle'
										colorPalette={color}
										textTransform='none'>
										{String(o.label)}
									</Badge>
								</Box>
								<Flex
									gap={1}
									flexWrap='wrap'
									role='radiogroup'
									aria-label={`Colour of ${o.label}`}>
									{TAG_PALETTES.map(p => (
										<Box
											as='button'
											key={p}
											role='radio'
											aria-checked={color === p}
											aria-label={p}
											title={p}
											w='18px'
											h='18px'
											borderRadius='full'
											// .fg, not .solid: the theme maps gray and green .solid onto the brand black.
											bg={p === 'gray' ? 'fg.muted' : `${p}.fg`}
											cursor={disabled ? 'not-allowed' : 'pointer'}
											opacity={disabled ? 0.5 : 1}
											outline={color === p ? '2px solid' : 'none'}
											outlineColor='fg'
											outlineOffset='2px'
											onClick={() => !disabled && setColor(o.value, p === defaultTagColor(o.value, i) ? undefined : p)}
										/>
									))}
								</Flex>
								{picked[key] && (
									<Button
										size='2xs'
										variant='ghost'
										disabled={disabled}
										title='Back to the default colour'
										onClick={() => setColor(o.value, undefined)}>
										<RotateCcw size={12} />
										Default
									</Button>
								)}
							</Flex>
						);
					})}
					<Text
						fontSize='11px'
						color='fg.muted'>
						Colours start from what an option means — paid and active green, void and cancelled red, due and pending
						orange. Pick another for any of them.
					</Text>
				</Flex>
			)}
		</Box>
	);
};

export default TagColorsEditor;
