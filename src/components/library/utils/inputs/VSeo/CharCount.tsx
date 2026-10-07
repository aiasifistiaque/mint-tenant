'use client';

import { FC } from 'react';
import { Flex, Text } from '@chakra-ui/react';

import { DANGER, SUCCESS, TEXT_FAINT, WARNING, tone } from './constants';

type Props = {
	value?: string;
	min: number;
	max: number;
	hardMax: number;
};

/**
 * "42 / 60" with a colour that says whether the length is in the window Google
 * will actually render. Green inside the window, amber below it, red past the
 * hard limit where the field gets truncated in results.
 */
const CharCount: FC<Props> = ({ value, min, max, hardMax }) => {
	const length = value?.length || 0;

	let pair = TEXT_FAINT;
	let hint = '';
	if (length === 0) {
		hint = `aim for ${min}–${max}`;
	} else if (length < min) {
		pair = WARNING;
		hint = 'a little short';
	} else if (length <= max) {
		pair = SUCCESS;
		hint = 'good length';
	} else if (length <= hardMax) {
		pair = WARNING;
		hint = 'may be truncated';
	} else {
		pair = DANGER;
		hint = 'too long, will be cut';
	}

	return (
		<Flex
			justify='space-between'
			align='center'
			mt={1}>
			<Text
				fontSize='11px'
				{...tone(pair)}>
				{hint}
			</Text>
			<Text
				fontSize='11px'
				{...tone(pair)}>
				{length} / {max}
			</Text>
		</Flex>
	);
};

export default CharCount;
