'use client';

import { ReactNode } from 'react';
import { Tabs } from '@chakra-ui/react';
import { radius } from '../index';

export type ConsoleTab = {
	value: string;
	label: ReactNode;
};

type ConsoleTabsProps = {
	tabs: ConsoleTab[];
	value: string;
	onChange: (value: string) => void;
	children: ReactNode;
};

/**
 * The tab bar every console page uses.
 *
 * This was four hand-copied blocks — two Heroku pages and two Vercel ones — and
 * they had already drifted: the Vercel pair was missing the pill radius and the
 * inverted selected state, so the same control looked like a different control
 * one click away. The styling here is the Heroku original, which was the one
 * that matched the rest of the design language.
 *
 * `Tabs.Content` still lives at the call site, because what a tab contains is
 * the page's business. Only the chrome is shared.
 */
const ConsoleTabs = ({ tabs, value, onChange, children }: ConsoleTabsProps) => (
	<Tabs.Root
		size='sm'
		variant='subtle'
		lazyMount
		value={value}
		onValueChange={event => onChange(event.value)}>
		<Tabs.List
			border='none'
			gap={1}
			flexWrap='wrap'
			mb={4}>
			{tabs.map(tab => (
				<Tabs.Trigger
					key={tab.value}
					value={tab.value}
					px={3}
					fontSize='13px'
					borderRadius={radius.PILL}
					_selected={{ bg: 'bg.inverted', color: 'fg.inverted' }}>
					{tab.label}
				</Tabs.Trigger>
			))}
		</Tabs.List>

		{children}
	</Tabs.Root>
);

export default ConsoleTabs;
