'use client';

import { FC, useEffect, useMemo, useState } from 'react';
import { Badge, Box, Button, Dialog, Flex, Grid, Input, Portal, Switch, Text } from '@chakra-ui/react';
import { Check } from 'lucide-react';
import { AlertDialogContent, AlertDialogHeader, ModalFooter } from '@/components/library';
import GuideLink from '@/components/library/tenant/GuideLink';
import { toaster } from '@/components/ui/toaster';
import { useSaveWidgetsAuthMutation, useSaveWidgetsMutation } from '@/components/library/store/services/tenantApi';
import type { AuthMapping, AuthView, ShopView, WidgetSettings, WidgetType, WidgetsView } from '@/components/library/store/services/tenantApi';
import ShopPanel from './ShopPanel';
import CustomersStep from './CustomersStep';
import { Code, OptionInput, Preview, SHOP_WIDGETS, SnippetHelp, help, isAdded, label } from './parts';

/**
 * Widgets → Add a widget (docs/widgets W-24): a few short steps — which
 * widget, what it needs (the Shop for the selling ones, the customer model for
 * Login & account), its options, its texts, then a review with the preview and
 * the code — and it's added to the project's Widgets screen. Edit opens the
 * same steps on an added widget, without the first. Saved through PUT
 * /widgets (`added: true`) and, for Login & account, PUT /widgets/auth.
 */

/** What's planned next (docs/widgets) — shown greyed in the picker so tenants know what's coming. */
const COMING = [
	{ title: 'Forms', text: 'Contact and newsletter forms drawn from your models, with spam protection.' },
	{ title: 'Booking', text: 'Free slots worked out on the server — no double bookings.' },
	{ title: 'WhatsApp button', text: 'A floating button that opens a chat with a ready message.' },
	{ title: 'Cookie consent', text: 'Your tracking tags fire only after visitors agree.' },
	{ title: 'Search', text: 'Instant results from your products, posts and pages.' },
];

const stepsOf = (name: string, editing: boolean) => [
	...(editing ? [] : ['Widget']),
	...(name === 'login' ? ['Customers'] : SHOP_WIDGETS.includes(name) ? ['Shop'] : []),
	'Set up',
	'Texts',
	'Review',
];

const Stepper: FC<{ steps: string[]; step: number }> = ({ steps, step }) => (
	<Flex
		gap={2}
		mb={5}
		align='center'
		wrap='wrap'>
		{steps.map((s, i) => (
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
				{i < steps.length - 1 && (
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

/** Why a selling widget can't be on yet, or null. */
export const shopMissing = (name: string, shop?: ShopView) => {
	if (!shop || !SHOP_WIDGETS.includes(name)) return null;
	if (!shop.shop) return 'The Shop isn’t set up yet — which model holds your products.';
	if (name !== 'cart' && !shop.shop.order) return 'The Shop’s Orders aren’t set up yet — where checkout writes orders.';
	return null;
};

type Props = {
	open: boolean;
	onClose: () => void;
	data: WidgetsView;
	/** An added widget's name: edit it (no picker). */
	editing?: string | null;
	shop?: ShopView;
	auth?: AuthView;
	/** The server can't say (one from before W-24): no customer model to choose yet. */
	authMissing?: boolean;
	/** The project key mint.js names the project by (docs/api-builder D14). */
	projectKey: string;
	currency?: string;
};

const WidgetWizard: FC<Props> = ({ open, onClose, data, editing, shop, auth, authMissing, projectKey, currency }) => {
	const [name, setName] = useState('');
	const [step, setStep] = useState(0);
	const [value, setValue] = useState<WidgetSettings | null>(null);
	const [mapping, setMapping] = useState<AuthMapping | null>(null);
	const [save, saving] = useSaveWidgetsMutation();
	const [saveAuth, savingAuth] = useSaveWidgetsAuthMutation();

	const type: WidgetType | undefined = data.catalog.find(t => t.name === name);
	const steps = stepsOf(name, !!editing);
	const at = steps[step];
	const missing = shopMissing(name, shop);
	const free = useMemo(() => data.catalog.filter(t => !isAdded(data.widgets[t.name])), [data]);

	// A fresh start each time it opens: the picker (or the widget being edited) with its saved settings.
	useEffect(() => {
		if (!open) return;
		const first = editing || '';
		setName(first);
		setStep(0);
		setValue(first ? data.widgets[first] : null);
		// MINT's Customers unless a model was chosen before (the step offers a likely one).
		setMapping(auth?.auth || null);
	}, [open]);

	const pick = (n: string) => {
		setName(n);
		// A new widget starts from its defaults (what's saved for one not added is the defaults), switched on.
		setValue({ ...data.widgets[n], enabled: true });
	};

	const finish = async () => {
		if (!type || !value) return;
		try {
			if (name === 'login' && auth) await saveAuth({ auth: mapping?.model ? mapping : null }).unwrap();
			await save({ widgets: { [name]: { ...value, added: true, enabled: value.enabled && !missing } } }).unwrap();
			toaster.create({
				type: 'success',
				title: editing ? `${type.title} saved` : `${type.title} added`,
				description: value.enabled && !missing ? 'Your site shows it within a minute — put its code on a page.' : 'It’s off for now — switch it on from the Widgets screen.',
			});
			onClose();
		} catch (e: any) {
			toaster.create({ type: 'error', title: e?.data?.message || 'Not saved — try again.' });
		}
	};

	const next = () => {
		// A phone field in the customer model: a new login widget asks for one on sign-up.
		if (at === 'Customers' && !editing && mapping?.fields.phone && value) setValue({ ...value, options: { ...value.options, askPhone: true } });
		setStep(step + 1);
	};

	const canNext = at === 'Widget' ? !!type : at === 'Customers' ? !mapping?.model || !!mapping.fields.email : true;

	return (
		<Dialog.Root
			placement='top'
			size={at === 'Shop' || at === 'Review' ? 'xl' : 'lg'}
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
						<AlertDialogHeader>{editing ? `Edit ${type?.title || 'widget'}` : type && step > 0 ? `Add ${type.title}` : 'Add a widget'}</AlertDialogHeader>
						<Dialog.Body
							p={4}
							pb={5}>
							<Stepper
								steps={steps}
								step={step}
							/>

							{at === 'Widget' && (
								<>
									<Text {...label}>Which widget?</Text>
									{free.length === 0 && (
										<Text
											fontSize='13px'
											color='fg.muted'
											mb={3}>
											Every widget is on your Widgets screen already — edit one from there.
										</Text>
									)}
									<Grid
										role='radiogroup'
										aria-label='Widget'
										templateColumns={{ base: '1fr', md: '1fr 1fr' }}
										gap={2}>
										{free.map(t => (
											<Flex
												key={t.name}
												as='button'
												role='radio'
												aria-checked={name === t.name}
												onClick={() => pick(t.name)}
												align='flex-start'
												gap={3}
												p={3}
												textAlign='left'
												borderWidth='1px'
												borderRadius='lg'
												borderColor={name === t.name ? 'fg.muted' : 'border'}
												bg={name === t.name ? 'bg.subtle' : 'transparent'}
												_hover={{ borderColor: 'fg.muted' }}>
												<Box
													flex={1}
													minW={0}>
													<Text
														fontSize='13.5px'
														fontWeight='500'>
														{t.title}
													</Text>
													<Text
														fontSize='12px'
														color='fg.muted'
														lineHeight='1.5'>
														{t.summary}
													</Text>
												</Box>
												{name === t.name && <Check size={15} />}
											</Flex>
										))}
										{COMING.map(c => (
											<Box
												key={c.title}
												p={3}
												borderWidth='1px'
												borderStyle='dashed'
												borderColor='border'
												borderRadius='lg'
												opacity={0.7}>
												<Flex
													align='center'
													gap={2}>
													<Text
														fontSize='13.5px'
														fontWeight='500'>
														{c.title}
													</Text>
													<Badge
														size='xs'
														variant='outline'>
														Soon
													</Badge>
												</Flex>
												<Text
													fontSize='12px'
													color='fg.muted'
													lineHeight='1.5'>
													{c.text}
												</Text>
											</Box>
										))}
									</Grid>
								</>
							)}

							{at === 'Customers' && (
								<CustomersStep
									auth={auth}
									missing={authMissing}
									value={mapping}
									onChange={setMapping}
								/>
							)}

							{at === 'Shop' && type && (
								<>
									<Text
										fontSize='13px'
										color='fg.muted'
										lineHeight='1.6'
										mb={3}>
										{type.title} sells from your own models: it needs the Shop — which model holds your products
										{name === 'cart' ? '' : ', and where checkout writes orders'}. Prices and totals always come from these models, never from the page.
									</Text>
									<Text
										fontSize='13px'
										mb={3}
										color={missing ? 'orange.fg' : 'green.fg'}>
										{missing ? `${missing} Set it up below and save it — or carry on and add the widget switched off for now.` : 'The Shop is set up.'}
									</Text>
									<ShopPanel />
								</>
							)}

							{at === 'Set up' && type && value && (
								<>
									<Text
										fontSize='13px'
										color='fg.muted'
										lineHeight='1.6'
										mb={4}>
										{type.description}
									</Text>
									{type.options.length === 0 && (
										<Text
											fontSize='13px'
											color='fg.muted'>
											Nothing to choose here — it works as it is. Change its words on the next step.
										</Text>
									)}
									<Flex
										direction='column'
										gap={4}>
										{type.options.map(o => (
											<Box key={o.key}>
												{o.kind !== 'boolean' && <Text {...label}>{o.label}</Text>}
												<OptionInput
													o={o}
													value={value.options[o.key]}
													onChange={v => setValue({ ...value, options: { ...value.options, [o.key]: v } })}
												/>
												<Text {...help}>{o.help}</Text>
											</Box>
										))}
									</Flex>
								</>
							)}

							{at === 'Texts' && type && value && (
								<>
									<Text
										fontSize='13px'
										color='fg.muted'
										mb={3}>
										Every word the widget shows — in your words or your visitors’ language. Leave one as it is to keep the default.
									</Text>
									<Grid
										templateColumns={{ base: '1fr', md: '1fr 1fr' }}
										gap={3}>
										{type.texts.map(t => (
											<Box key={t.key}>
												<Text {...label}>{t.label}</Text>
												<Input
													size='sm'
													value={value.texts[t.key] ?? ''}
													placeholder={t.default}
													onChange={e => setValue({ ...value, texts: { ...value.texts, [t.key]: e.target.value } })}
												/>
											</Box>
										))}
									</Grid>
								</>
							)}

							{at === 'Review' && type && value && (
								<Grid
									templateColumns={{ base: '1fr', md: 'minmax(0, 1fr) minmax(0, 1.3fr)' }}
									gap={5}>
									<Flex
										direction='column'
										gap={4}>
										<Box>
											<Switch.Root
												size='sm'
												checked={value.enabled && !missing}
												disabled={!!missing}
												onCheckedChange={e => setValue({ ...value, enabled: !!e.checked })}>
												<Switch.HiddenInput />
												<Switch.Control />
												<Switch.Label fontSize='13px'>Switch it on now</Switch.Label>
											</Switch.Root>
											<Text
												{...help}
												color={missing ? 'orange.fg' : 'fg.muted'}>
												{missing
													? `${missing} It’s added switched off; switch it on once that’s done.`
													: 'Off: pages with this widget show nothing until you switch it on.'}
											</Text>
										</Box>
										{name === 'login' && (
											<Box>
												<Text {...label}>Customers</Text>
												<Text
													fontSize='13px'
													color='fg.muted'>
													{!mapping?.model
														? 'Accounts are kept in MINT’s Customers page.'
														: mapping.accounts === 'model'
															? `${auth?.models.find(m => m.name === mapping.model)?.title || mapping.model} holds the accounts: every sign-up is a record there.`
															: `Accounts are kept in MINT’s Customers, each with a record in ${auth?.models.find(m => m.name === mapping.model)?.title || mapping.model}.`}
												</Text>
											</Box>
										)}
										<Box>
											<Text {...label}>Put it on a page</Text>
											<Code>{type.snippet}</Code>
											<SnippetHelp name={name} />
										</Box>
										<Text
											fontSize='12px'
											color='fg.muted'>
											The page also needs the MINT script once — it’s at the top of the Widgets screen.
										</Text>
									</Flex>
									<Preview
										projectKey={projectKey}
										theme={data.theme}
										name={name}
										settings={value}
										snippet={type.snippet}
										currency={currency}
										height='380px'
									/>
								</Grid>
							)}

							<Box mt={4}>
								<GuideLink
									section={at === 'Customers' ? 'login-customers' : at === 'Shop' ? 'shop' : type && at !== 'Widget' ? type.guide : 'add-widget'}
									label={at === 'Widget' ? 'How widgets work' : undefined}
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
							{step < steps.length - 1 ? (
								<Button
									size='sm'
									px={3}
									disabled={!canNext}
									onClick={next}>
									Next
								</Button>
							) : (
								<Button
									size='sm'
									px={3}
									loading={saving.isLoading || savingAuth.isLoading}
									onClick={finish}>
									{editing ? 'Save changes' : 'Add widget'}
								</Button>
							)}
						</ModalFooter>
					</AlertDialogContent>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
};

export default WidgetWizard;
