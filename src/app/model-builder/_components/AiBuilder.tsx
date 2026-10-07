'use client';

import { FC, useState } from 'react';
import { Box, Button, Flex, Switch, Text, Textarea } from '@chakra-ui/react';
import { Sparkles } from 'lucide-react';
import { useBuildModelWithAiMutation } from '@/components/library';
import { Panel } from '@/components/library/cl';

/**
 * "Build with AI" — the wizard's first step, above the model panels. A
 * description goes to POST /builder/models/ai, where Claude drafts the model
 * and its settings, form, table, view and filters; the draft fills every step
 * of the wizard, and nothing is created until the last one.
 *
 * With a model already on the page, the description can change it instead of
 * starting over ("add a due date", "make status a multi-select").
 */

const EXAMPLES = [
	'Service requests from customers: a title, the customer, priority (low, normal, urgent), status (open, in progress, done — open by default), a due date, attachments and notes.',
	'Suppliers: company name, contact person, email, phone, address, the product categories they supply, a rating from 1 to 5 and whether they are active.',
	'Events: title, a cover image, a gallery, start and end dates, venue, capacity, ticket price, and status draft / published / cancelled. Give each event a code like EVT-0001.',
];

type Props = {
	/** The definition so far — sent when changing the current model. */
	current: any;
	hasModel: boolean;
	disabled?: boolean;
	onBuilt: (result: any) => void;
};

const AiBuilder: FC<Props> = ({ current, hasModel, disabled, onBuilt }) => {
	const [build, { isLoading }] = useBuildModelWithAiMutation();
	const [prompt, setPrompt] = useState('');
	const [refine, setRefine] = useState(true);
	const [error, setError] = useState<{ message: string; problems?: string[] } | null>(null);

	const changing = hasModel && refine;

	const run = async () => {
		setError(null);
		try {
			const res = await build({ prompt: prompt.trim(), ...(changing && { current }) }).unwrap();
			onBuilt(res);
			setPrompt('');
		} catch (e: any) {
			setError({
				message: e?.data?.message || (e?.status === 'FETCH_ERROR' ? 'The server didn’t answer' : 'Could not build the model'),
				problems: e?.data?.problems,
			});
		}
	};

	return (
		<Panel
			title='Build with AI'
			actions={
				<Flex
					align='center'
					gap={1.5}
					fontSize='xs'
					color='fg.muted'>
					<Sparkles size={14} />
					Claude
				</Flex>
			}
			subtitle={
				changing
					? 'Describe what to change. Claude updates the model and rebuilds its pages; edits you made in the later steps are replaced.'
					: 'Describe what you need to manage. Claude drafts the model with its settings, form, table, view and filters — you review every step before anything is created.'
			}>
			<Flex
				direction='column'
				gap={3}>
				<Textarea
					size='sm'
					rows={3}
					value={prompt}
					disabled={isLoading || disabled}
					placeholder={
						changing
							? 'e.g. Add a due date and a list of attachments; make priority required'
							: 'e.g. Service requests: title, customer, priority (low, normal, urgent), status, due date…'
					}
					onChange={e => setPrompt(e.target.value)}
					onKeyDown={e => {
						if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && prompt.trim()) run();
					}}
				/>

				{!changing && !prompt && (
					<Flex
						gap={2}
						flexWrap='wrap'>
						{EXAMPLES.map(x => (
							<Button
								key={x}
								size='2xs'
								variant='outline'
								maxW='100%'
								title={x}
								onClick={() => setPrompt(x)}>
								<Text truncate>{x.split(':')[0]}</Text>
							</Button>
						))}
					</Flex>
				)}

				<Flex
					align='center'
					gap={4}
					flexWrap='wrap'>
					<Button
						size='sm'
						loading={isLoading}
						loadingText='Claude is building it…'
						disabled={!prompt.trim() || disabled}
						onClick={run}>
						<Sparkles size={14} />
						{changing ? 'Update with AI' : 'Build with AI'}
					</Button>
					{hasModel && (
						<Switch.Root
							size='sm'
							checked={refine}
							disabled={isLoading}
							onCheckedChange={e => setRefine(e.checked)}>
							<Switch.HiddenInput />
							<Switch.Control>
								<Switch.Thumb />
							</Switch.Control>
							<Switch.Label fontSize='sm'>Change the current model instead of starting over</Switch.Label>
						</Switch.Root>
					)}
					{isLoading && (
						<Text
							fontSize='xs'
							color='fg.muted'>
							Usually 20–60 seconds.
						</Text>
					)}
				</Flex>

				{error && (
					<Box
						fontSize='sm'
						color='red.fg'>
						<Text>{error.message}</Text>
						{error.problems?.length ? (
							<Box
								as='ul'
								pl={5}
								mt={1}
								listStyleType='disc'>
								{error.problems.map(p => (
									<li key={p}>{p}</li>
								))}
							</Box>
						) : null}
					</Box>
				)}
			</Flex>
		</Panel>
	);
};

export default AiBuilder;
