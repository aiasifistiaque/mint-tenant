'use client';

import { FC, useEffect, useState } from 'react';
import { chakra } from '@chakra-ui/react';
import { Maximize, Minimize } from 'lucide-react';
import MenuIconContainer from './MenuIconContainer';

/**
 * Full screen for the whole panel, beside the notifications and account
 * buttons. Computers only: phones and tablets hide the browser's chrome on
 * their own, and iPhone Safari has no full-screen API at all. Esc (or the
 * button again) leaves it; the icon follows either way.
 */
const FullScreenButton: FC<{ iconSize?: number }> = ({ iconSize = 16 }) => {
	const [supported, setSupported] = useState(false);
	const [on, setOn] = useState(false);

	useEffect(() => {
		setSupported(!!document.fullscreenEnabled);
		const sync = () => setOn(!!document.fullscreenElement);
		sync();
		document.addEventListener('fullscreenchange', sync);
		return () => document.removeEventListener('fullscreenchange', sync);
	}, []);

	if (!supported) return null;

	const toggle = () => {
		const done = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
		done?.catch(() => {});
	};
	const label = on ? 'Exit full screen' : 'Full screen';
	const Icon = on ? Minimize : Maximize;

	return (
		<MenuIconContainer
			asChild
			display={{ base: 'none', lg: 'flex' }}>
			<chakra.button
				type='button'
				aria-label={label}
				title={label}
				onClick={toggle}>
				<Icon
					size={(iconSize || 16) - 1}
					strokeWidth={1.75}
				/>
			</chakra.button>
		</MenuIconContainer>
	);
};

export default FullScreenButton;
