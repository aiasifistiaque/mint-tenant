'use client';

import { FC, ReactNode } from 'react';
import { Box, Flex, Link, Switch, Text } from '@chakra-ui/react';
import { ExternalLink } from 'lucide-react';
import { docsPath } from '@/components/library/config/lib/constants/panel';

/**
 * Small pieces shared by the route builder and the model wizard, so a panel
 * reads the same wherever it's edited.
 */

/** The builder guide, opened beside the editor rather than in place of it. */
export const DocLink: FC<{ section: string; label?: string }> = ({ section, label = 'How it works' }) => (
	<Link
		href={docsPath(`/docs/builder#${section}`)}
		target='_blank'
		rel='noopener noreferrer'
		display='inline-flex'
		alignItems='center'
		gap={1}
		fontSize='xs'
		color='fg.muted'
		_hover={{ color: 'fg', textDecoration: 'underline' }}>
		{label}
		<ExternalLink size={11} />
	</Link>
);

/** A labelled switch row: what it does, what the code has, and the switch. */
export const Toggle: FC<{ label: string; hint: string; code?: boolean; checked: boolean; onChange: (v: boolean) => void }> = ({
	label,
	hint,
	code,
	checked,
	onChange,
}) => (
	<Flex
		align='center'
		justify='space-between'
		gap={4}>
		<Box>
			<Text
				fontSize='sm'
				fontWeight='500'>
				{label}
			</Text>
			<Text
				fontSize='xs'
				color='fg.muted'>
				{hint}
				{code !== undefined && ` The code has it ${code ? 'on' : 'off'}.`}
			</Text>
		</Box>
		<Switch.Root
			checked={checked}
			onCheckedChange={d => onChange(d.checked)}>
			<Switch.HiddenInput />
			<Switch.Control />
			<Switch.Label fontSize='sm'>{checked ? 'On' : 'Off'}</Switch.Label>
		</Switch.Root>
	</Flex>
);

export const FieldLabel: FC<{ children: ReactNode }> = ({ children }) => (
	<Text
		fontSize='xs'
		fontWeight='600'
		mb={1.5}>
		{children}
	</Text>
);

/** Problems in a view layout that the server would refuse, as messages. */
export const viewProblems = (view: any[] = []) => {
	const out: string[] = [];
	view.forEach((s, si) =>
		(s.fields || []).forEach((it: any) => {
			if (typeof it !== 'object') return;
			const where = s.title || `section ${si + 1}`;
			if ('field' in it && !it.show?.length) out.push(`${where}: pick fields of ${it.field}`);
			if ('related' in it && !it.foreignField) out.push(`${where}: pick the field linking ${it.related}`);
			if ('related' in it && !it.columns?.length) out.push(`${where}: pick columns for ${it.related}`);
		})
	);
	return out;
};
