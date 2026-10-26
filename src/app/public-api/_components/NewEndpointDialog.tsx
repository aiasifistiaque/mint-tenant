'use client';

import { FC, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Dialog, Flex, Grid, Input, Portal, Text } from '@chakra-ui/react';
import { Check } from 'lucide-react';
import { AlertDialogContent, AlertDialogHeader, ModalFooter } from '@/components/library';
import { Dropdown } from '@/components/library/cl';
import GuideLink from '@/components/library/tenant/GuideLink';
import { toaster } from '@/components/ui/toaster';
import { useCreateApiEndpointMutation } from '@/components/library/store/services/apiBuilderApi';
import type { ApiModel, EndpointAction, EndpointWho } from '@/components/library/store/services/apiBuilderApi';
import { ACTIONS, MethodBadge, actionOf, apiHref, errorOf } from './shared';
import WhoCards from './WhoCards';
import { errCss, labelCss } from './GenerateDialog';

/**
 * Endpoints → New endpoint: four short steps — the model, what it does, its
 * address, who can call it — then the endpoint's own page opens for its rules,
 * fields and filters. The server checks the path (backend apiEndpoints
 * normalizePath: lowercase parts, `/:id` last for one record, MINT's own first
 * parts kept).
 */

const STEPS = ['Model', 'What it does', 'Address', 'Who'];

/** Paths that read well for an action, to start from. */
const suggestions = (route: string, action: EndpointAction) =>
	({
		list: [`/${route}/featured`, `/${route}/latest`, `/my/${route}`],
		get: [`/${route}/view/:id`, `/my/${route}/:id`],
		create: [`/${route}/submit`, `/my/${route}`],
		update: [`/${route}/edit/:id`, `/my/${route}/:id`],
		delete: [`/${route}/remove/:id`, `/my/${route}/:id`],
		upload: [`/${route}/files`, `/${route}/attachments`],
	})[action];

const Stepper: FC<{ step: number }> = ({ step }) => (
	<Flex
		gap={2}
		mb={5}
		align='center'
		wrap='wrap'>
		{STEPS.map((s, i) => (
			<Flex
				key={s}
				align='center'
				gap={1.5}
				color={i <= step ? 'fg' : 'fg.subtle'}>
				<Flex
					align='center'
					justify='center'
					boxSize='20px'
					borderRadius='full'
					borderWidth='1px'
					borderColor={i <= step ? 'fg' : 'border'}
					bg={i < step ? 'fg' : 'transparent'}
					color={i < step ? 'bg' : 'inherit'}
					fontSize='11px'
					fontFamily='mono'>
					{i < step ? <Check size={11} /> : i + 1}
				</Flex>
				<Text
					fontSize='12px'
					display={{ base: i === step ? 'block' : 'none', sm: 'block' }}>
					{s}
				</Text>
				{i < STEPS.length - 1 && (
					<Box
						w='14px'
						h='1px'
						bg='border'
					/>
				)}
			</Flex>
		))}
	</Flex>
);

const NewEndpointDialog: FC<{ open: boolean; onClose: () => void; models: ApiModel[]; base: string; model?: string }> = ({
	open,
	onClose,
	models,
	base,
	model: preset,
}) => {
	const router = useRouter();
	const [step, setStep] = useState(0);
	const [model, setModel] = useState('');
	const [action, setAction] = useState<EndpointAction>('list');
	const [path, setPath] = useState('');
	const [who, setWho] = useState<EndpointWho>('anyone');
	const [name, setName] = useState('');
	const [error, setError] = useState<{ message: string; on?: string } | null>(null);
	const [create, { isLoading }] = useCreateApiEndpointMutation();
	const m = models.find(x => x.route === model);
	const a = actionOf(action);

	useEffect(() => {
		if (!open) return;
		setStep(0);
		setModel(preset || models[0]?.route || '');
		setAction('list');
		setWho('anyone');
		setError(null);
	}, [open]);
	// A path to start from whenever the model or action changes.
	useEffect(() => {
		if (model) setPath(suggestions(model, action)[0]);
	}, [model, action]);
	useEffect(() => {
		if (m) setName(`${a.label} ${m.title.toLowerCase()}`);
	}, [model, action]);

	const tidy = useMemo(() => {
		let p = path.trim().toLowerCase().replace(/\s+/g, '-');
		if (p && !p.startsWith('/')) p = `/${p}`;
		return p;
	}, [path]);
	const idOk = a.one ? tidy.endsWith('/:id') : !tidy.endsWith('/:id');

	const submit = async () => {
		setError(null);
		const res = await create({ name, model, action, path: tidy, access: { who, when: [], match: 'all' } });
		if ('error' in res) {
			const e = errorOf(res.error, 'Couldn’t make it — try again.');
			setError(e);
			if (e.on === 'path') setStep(2);
			if (e.on === 'model') setStep(0);
			return;
		}
		toaster.create({ type: 'success', title: 'Endpoint made', description: 'Now set its rules, fields and filters.' });
		onClose();
		router.push(apiHref(`/endpoints/${res.data._id}`));
	};

	return (
		<Dialog.Root
			placement='center'
			size='md'
			scrollBehavior='inside'
			open={open}
			onOpenChange={e => !e.open && onClose()}>
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<AlertDialogContent
						borderWidth='1px'
						borderColor='border'
						_dark={{ bg: 'background.dark' }}>
						<AlertDialogHeader>New endpoint</AlertDialogHeader>
						<Dialog.Body
							p={4}
							pb={5}>
							<Stepper step={step} />

							{step === 0 && (
								<>
									<Text {...labelCss}>Which model does it work on?</Text>
									<Dropdown
										size='sm'
										value={model}
										onChange={(v: string) => setModel(v)}
										items={models.map(x => ({ value: x.route, label: x.title }))}
									/>
									<Text
										fontSize='12px'
										color='fg.muted'
										mt={2}>
										An endpoint reads or writes one model’s records. Make another endpoint for another model.
									</Text>
									{error?.on === 'model' && <Text {...errCss}>{error.message}</Text>}
								</>
							)}

							{step === 1 && (
								<>
									<Text {...labelCss}>What does it do?</Text>
									<Grid
										role='radiogroup'
										aria-label='What it does'
										gap={2}>
										{ACTIONS.map(x => (
											<Flex
												key={x.value}
												as='button'
												role='radio'
												aria-checked={action === x.value}
												onClick={() => setAction(x.value)}
												align='center'
												gap={3}
												p={2.5}
												textAlign='left'
												borderWidth='1px'
												borderRadius='lg'
												borderColor={action === x.value ? 'fg.muted' : 'border'}
												bg={action === x.value ? 'bg.subtle' : 'transparent'}
												_hover={{ borderColor: 'fg.muted' }}>
												<MethodBadge method={x.method} />
												<Box
													flex={1}
													minW={0}>
													<Text
														fontSize='13.5px'
														fontWeight='500'>
														{x.label}
													</Text>
													<Text
														fontSize='12px'
														color='fg.muted'>
														{x.does}
													</Text>
												</Box>
												{action === x.value && <Check size={15} />}
											</Flex>
										))}
									</Grid>
								</>
							)}

							{step === 2 && (
								<>
									<Text {...labelCss}>Its address</Text>
									<Flex
										align='center'
										borderWidth='1px'
										borderColor={error?.on === 'path' ? 'red.solid' : 'border'}
										borderRadius='md'
										overflow='hidden'>
										<Box
											px={2}
											alignSelf='stretch'
											display='flex'
											alignItems='center'
											bg='bg.subtle'
											borderRightWidth='1px'
											borderColor='border'>
											<MethodBadge method={a.method} />
										</Box>
										<Input
											size='sm'
											border='none'
											fontFamily='mono'
											value={path}
											onChange={e => setPath(e.target.value)}
											placeholder={`/${model}/featured`}
											aria-label='Path'
											autoFocus
										/>
									</Flex>
									{error?.on === 'path' && <Text {...errCss}>{error.message}</Text>}
									{!idOk && tidy && (
										<Text
											fontSize='12px'
											color='orange.fg'
											mt={1.5}>
											{a.one ? `${a.label} works on one record — end it with /:id.` : 'Only Read one, Update and Delete end with /:id.'}
										</Text>
									)}
									<Flex
										gap={1.5}
										wrap='wrap'
										mt={2.5}>
										{suggestions(model, action).map(s => (
											<Button
												key={s}
												size='xs'
												variant='outline'
												fontFamily='mono'
												fontWeight='400'
												onClick={() => setPath(s)}>
												{s}
											</Button>
										))}
									</Flex>
									<Text
										fontSize='12px'
										color='fg.muted'
										mt={3}>
										Lowercase words and dashes, up to 4 parts{a.one ? ', then /:id for the record' : ''}. Called as:
									</Text>
									<Text
										fontSize='12px'
										fontFamily='mono'
										mt={1}
										wordBreak='break-all'>
										{a.method} {base}
										{tidy}
									</Text>
								</>
							)}

							{step === 3 && (
								<>
									<Text {...labelCss}>Who can call it?</Text>
									<WhoCards
										value={who}
										onChange={setWho}
										compact
									/>
									<Text
										{...labelCss}
										mt={4}>
										Name
									</Text>
									<Input
										size='sm'
										value={name}
										onChange={e => setName(e.target.value)}
										maxLength={80}
										aria-label='Name'
									/>
									<Text
										fontSize='12px'
										color='fg.muted'
										mt={1.5}>
										For you and your team — shown in the list and the reference.
									</Text>
									{error && error.on !== 'path' && error.on !== 'model' && <Text {...errCss}>{error.message}</Text>}
								</>
							)}
							<Box mt={4}>
								<GuideLink
									section='api-new-endpoint'
									label='How endpoints work'
								/>
							</Box>
						</Dialog.Body>
						<ModalFooter>
							<Button
								variant='outline'
								size='sm'
								px={3}
								onClick={() => (step ? setStep(step - 1) : onClose())}>
								{step ? 'Back' : 'Cancel'}
							</Button>
							{step < 3 ? (
								<Button
									size='sm'
									px={3}
									disabled={(step === 0 && !model) || (step === 2 && (!tidy || !idOk))}
									onClick={() => setStep(step + 1)}>
									Next
								</Button>
							) : (
								<Button
									size='sm'
									px={3}
									loading={isLoading}
									disabled={!name.trim()}
									onClick={submit}>
									Make endpoint
								</Button>
							)}
						</ModalFooter>
					</AlertDialogContent>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
};

export default NewEndpointDialog;
