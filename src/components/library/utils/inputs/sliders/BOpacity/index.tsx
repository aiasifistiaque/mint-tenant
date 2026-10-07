'use client';

import { Slider, Box, Text } from '@chakra-ui/react';
import { FC } from 'react';
import { FormControl } from '../../../..';
import { labelStyle, variables, SliderProps, toolTipStyle } from '../styles';

const BLineHeight: FC<SliderProps> = ({
	label,
	isRequired,
	placeholder,
	value,
	helper,
	hideNew = false,
	type = 'value',
	unselect = true,
	...props
}) => {
	const handleChange = (val: any) => {
		props?.onChange({
			target: {
				name: props.name,
				value: val / 1000,
			},
		});
	};

	const values = [0, 250, 500, 750, 1000];

	return (
		<FormControl
			isRequired={isRequired}
			label={label}
			helper={helper}
			h={variables?.height}>
			<Slider.Root
				min={0}
				max={1000}
				value={[value ? value * 1000 : 1000]}
				step={10}
				onValueChange={details => handleChange(details.value[0])}>
				{values.map(val => (
					<Slider.Marker
						key={val}
						value={val * 1000}
						{...labelStyle}>
						<Slider.MarkerIndicator>
							<Text fontSize='sm'>{val / 1000}</Text>
						</Slider.MarkerIndicator>
					</Slider.Marker>
				))}

				<Slider.Label
					{...toolTipStyle}
					position='absolute'
					top='-30px'
					left='50%'
					transform='translateX(-50%)'>
					{value}
				</Slider.Label>

				<Slider.Control>
					<Slider.Track bg={variables?.track}>
						<Slider.Range bg={variables?.filledTrack} />
					</Slider.Track>
					<Slider.Thumb
						index={0}
						boxSize={variables?.boxSize}
					/>
				</Slider.Control>
			</Slider.Root>
		</FormControl>
	);
};

export default BLineHeight;
