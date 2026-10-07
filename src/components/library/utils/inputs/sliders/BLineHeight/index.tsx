'use client';

import { Slider } from '@chakra-ui/react';
import { FC } from 'react';
import { FormControl } from '../../../..';
import { labelStyle, variables, toolTipStyle } from '../styles';

const BLineHeight = ({
	label,
	isRequired,
	placeholder,
	value,
	helper,
	hideNew = false,
	type = 'value',
	unselect = true,
	...props
}: any) => {
	const handleChange = (details: any) => {
		props?.onChange({
			target: {
				name: props.name,
				value: details.value / 100,
			},
		});
	};

	const values = [100, 115, 150, 170, 200, 220];

	return (
		<FormControl
			isRequired={isRequired}
			label={label}
			helper={helper}
			h={variables?.height}>
			<Slider.Root
				min={80}
				max={250}
				value={[value ? value * 100 : 100]}
				step={5}
				mb={2}
				onValueChange={handleChange}>
				<Slider.Control>
					{values.map(val => (
						<Slider.MarkerGroup key={val}>
							<Slider.Marker
								value={val}
								{...labelStyle}>
								{val / 100}
							</Slider.Marker>
						</Slider.MarkerGroup>
					))}

					<Slider.ValueText {...toolTipStyle}>{value}</Slider.ValueText>

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
