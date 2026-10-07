'use client';

import { Slider } from '@chakra-ui/react';
import { FC } from 'react';
import { FormControl } from '../../../..';
import { labelStyle, variables, SliderProps, toolTipStyle } from '../styles';

const BSlider: FC<
	SliderProps & { values: number[]; threshold: number; min?: number; max?: number; step?: number }
> = ({
	label,
	isRequired,
	placeholder,
	value,
	helper,
	hideNew = false,
	type = 'value',
	unselect = true,
	values,
	threshold,
	min,
	max,
	step,
	...props
}) => {
	const handleChange = (details: any) => {
		props?.onChange({
			target: {
				name: props.name,
				value: details.value / threshold,
			},
		});
	};

	return (
		<FormControl
			isRequired={isRequired}
			label={label}
			helper={helper}
			h={variables?.height}>
			<Slider.Root
				min={min || 0}
				max={max || threshold}
				value={[value ? value * threshold : threshold]}
				step={step || 10}
				mb={3}
				onValueChange={handleChange}>
				<Slider.Control>
					{values?.map((val: number) => (
						<Slider.MarkerGroup key={val}>
							<Slider.Marker
								value={val * threshold}
								{...labelStyle}>
								{val}
							</Slider.Marker>
						</Slider.MarkerGroup>
					))}

					<Slider.ValueText {...toolTipStyle}>{value} px</Slider.ValueText>

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

export default BSlider;
