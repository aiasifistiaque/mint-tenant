'use client';

import { Center } from '@chakra-ui/react';
import React from 'react';
import { IoSunnyOutline, IoMoonOutline } from 'react-icons/io5';
import { useColorMode } from '../ui/color-mode';

const SIZE = '24px';

const ColorMode = () => {
	const { colorMode, toggleColorMode } = useColorMode();

	const icon =
		colorMode === 'light' ? <IoMoonOutline size={SIZE} /> : <IoSunnyOutline size={SIZE} />;

	return (
		<Center
			css={styles.container}
			onClick={toggleColorMode}>
			{icon}
		</Center>
	);
};

const styles = {
	container: {
		zIndex: 999,
		h: '44px',
		w: '44px',
		bg: 'container.light',
		_dark: { bg: 'sidebar.dark' },
		position: 'fixed',
		cursor: 'pointer',
		borderLeftRadius: '8px',
		right: 0,
		bottom: 14,
		boxShadow: 'lg',
	},
};

export default ColorMode;
