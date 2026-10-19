'use client';

import { FC, useEffect, useState } from 'react';
import { Box, Button, Checkbox, Dialog, Flex, Grid, Portal, Text } from '@chakra-ui/react';
import { AlertDialogContent, AlertDialogHeader, ModalFooter } from '@/components/library';
import { Dropdown } from '@/components/library/cl';
import GuideLink from '@/components/library/tenant/GuideLink';
import { toaster } from '@/components/ui/toaster';
import { useGenerateApiEndpointsMutation } from '@/components/library/store/services/apiBuilderApi';
import type { ApiModel, Endpoint, EndpointAction, EndpointWho } from '@/components/library/store/services/apiBuilderApi';
import { ACTIONS, MethodBadge, WHO, errorOf } from './shared';
import WhoCards from './WhoCards';

/**
 * Endpoints → Generate from a model: a model's standard endpoints in one go —
 * List and Read one ticked to start with — at its own address (/<route>,
 * /<route>/:id), for the "who" picked here. What a model has already is left
 * alone (turned back on if it was off). Rules come after, on each endpoint.
 * For signed-in customers, "Only their own records" adds the owner condition
 * (a create makes the customer its owner) — how a customer's token reaches
 * just their data.
 */
const GenerateDialog: FC<{ open: boolean; onClose: () => void; models: ApiModel[]; endpoints: Endpoint[]; model?: string; who?: EndpointWho }> = ({
	open,
	onClose,
	models,
	endpoints,
	model: preset,
	who: presetWho,
}) => {
	const [model, setModel] = useState('');
	const [actions, setActions] = useState<EndpointAction[]>(['list', 'get']);
	const [who, setWho] = useState<EndpointWho>('anyone');
	const [own, setOwn] = useState(true);
	const [error, setError] = useState<{ message: string; on?: string } | null>(null);
	const [generate, { isLoading }] = useGenerateApiEndpointsMutation();

	useEffect(() => {
		if (!open) return;
		setModel(preset || models[0]?.route || '');
		setActions(['list', 'get']);
		setWho(presetWho || 'anyone');
		setOwn(true);
		setError(null);
	}, [open]);

	const has = (a: string) => endpoints.find(e => e.model === model && e.standard && e.action === a);
	const toggle = (a: EndpointAction) => setActions(list => (list.includes(a) ? list.filter(x => x !== a) : [...list, a]));
	const fresh = actions.filter(a => !has(a)?.enabled);

	const submit = async () => {
		setError(null);
		const res = await generate({ model, actions, who, ...(who === 'customer' && { own }) });
		if ('error' in res) return setError(errorOf(res.error, 'Couldn’t generate — try again.'));
		const n = res.data.made.length + res.data.turnedOn.length;
		toaster.create({
			type: 'success',
			title: n ? `${n} endpoint${n === 1 ? '' : 's'} ready` : 'Nothing new to make',
			description: res.data.skipped.length ? `Already there: ${res.data.skipped.join(', ')}` : undefined,
		});
		onClose();
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
						<AlertDialogHeader>Generate from a model</AlertDialogHeader>
						<Dialog.Body
							p={4}
							pb={5}>
							<Text
								fontSize='13px'
								color='fg.muted'
								mb={4}>
								Makes the model’s endpoints at its own address. Fine-tune each one afterwards — rules, fields, filters.
							</Text>

							<Text {...labelCss}>Model</Text>
							<Dropdown
								size='sm'
								value={model}
								onChange={(v: string) => setModel(v)}
								items={models.map(m => ({ value: m.route, label: m.title }))}
							/>
							{error?.on === 'model' && <Text {...errCss}>{error.message}</Text>}

							<Text
								{...labelCss}
								mt={5}>
								Endpoints
							</Text>
							<Grid
								templateColumns={{ base: '1fr', sm: '1fr 1fr' }}
								gap={2}>
								{ACTIONS.map(a => {
									const there = has(a.value);
									return (
										<Checkbox.Root
											key={a.value}
											size='sm'
											checked={actions.includes(a.value)}
											onCheckedChange={() => toggle(a.value)}
											alignItems='flex-start'
											borderWidth='1px'
											borderColor={actions.includes(a.value) ? 'fg.muted' : 'border'}
											borderRadius='lg'
											p={2.5}>
											<Checkbox.HiddenInput />
											<Checkbox.Control mt='2px' />
											<Checkbox.Label
												flex={1}
												minW={0}>
												<Flex
													align='center'
													gap={2}>
													<MethodBadge method={a.method} />
													<Text
														fontSize='12px'
														fontFamily='mono'
														truncate>
														/{model}
														{a.one ? '/:id' : ''}
													</Text>
												</Flex>
												<Text
													fontSize='12px'
													color='fg.muted'
													mt={1}
													fontWeight='400'>
													{a.label}
													{there ? (there.enabled ? ' · already there' : ' · there, off — turns it on') : ''}
												</Text>
											</Checkbox.Label>
										</Checkbox.Root>
									);
								})}
							</Grid>
							{error?.on === 'actions' && <Text {...errCss}>{error.message}</Text>}

							<Text
								{...labelCss}
								mt={5}>
								Who can call them
							</Text>
							<WhoCards
								value={who}
								onChange={setWho}
								compact
							/>
							{who === 'customer' && (
								<Checkbox.Root
									size='sm'
									mt={3}
									checked={own}
									onCheckedChange={x => setOwn(!!x.checked)}
									alignItems='flex-start'>
									<Checkbox.HiddenInput />
									<Checkbox.Control mt='2px' />
									<Checkbox.Label fontWeight='400'>
										<Text fontSize='13px'>Only their own records</Text>
										<Text
											fontSize='12px'
											color='fg.muted'>
											Each customer sees and changes only what’s theirs — records they made through the API, and their own record in the
											model they sign up to. Off, every signed-in customer reaches every record.
										</Text>
									</Checkbox.Label>
								</Checkbox.Root>
							)}
							{error && !error.on && <Text {...errCss}>{error.message}</Text>}
							<Box mt={4}>
								<GuideLink
									section='api-generate'
									label='How generating works'
								/>
							</Box>
						</Dialog.Body>
						<ModalFooter>
							<Button
								variant='outline'
								size='sm'
								px={3}
								onClick={onClose}>
								Cancel
							</Button>
							<Button
								size='sm'
								px={3}
								loading={isLoading}
								disabled={!model || !actions.length}
								onClick={submit}>
								{fresh.length ? `Generate ${fresh.length} endpoint${fresh.length === 1 ? '' : 's'}` : 'Generate'}
							</Button>
						</ModalFooter>
					</AlertDialogContent>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
};

export const labelCss: any = { fontSize: '12.5px', fontWeight: '500', mb: 1.5 };
export const errCss: any = { fontSize: '12.5px', color: 'red.fg', mt: 1.5 };

export default GenerateDialog;
