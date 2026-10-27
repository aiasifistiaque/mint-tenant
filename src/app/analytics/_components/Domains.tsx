'use client';

import { FC, useEffect, useState } from 'react';
import { Box, Button, Dialog, Flex, Input, Portal, Text } from '@chakra-ui/react';
import { Plus, X } from 'lucide-react';
import moment from 'moment';
import { ModalFooter, useUpdateSiteConfigMutation } from '@/components/library';
import { radius } from '@/components/library/config';
import { useGetSelfQuery } from '@/components/library/store/services/authApi';
import { useGetAnalyticsHostsQuery } from '@/components/library/store/services/tenantApi';
import GuideLink from '@/components/library/tenant/GuideLink';
import { toaster } from '@/components/ui/toaster';

/**
 * Analytics' domains (the header line under the project's name): which sites
 * visits are counted from, the sites visits have come from that aren't added
 * yet — one click adds one — and Add domain for typing one in. Saved through
 * Site setup's domains (PUT site-config `domains`, Manage projects).
 */

/** What someone typed or pasted (https://www.acme.com/about) as a domain (www.acme.com), or '' when it isn't one. */
export const asDomain = (raw: string) => {
	const v = raw
		.trim()
		.toLowerCase()
		.replace(/^[a-z]+:\/\//, '')
		.replace(/[/?#].*$/, '')
		.replace(/:\d+$/, '')
		.replace(/\.$/, '');
	return /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(v) ? v : '';
};

const errorOf = (e: any) => e?.data?.message || 'Couldn’t save the domains — try again.';

const useDomains = (domains: string[]) => {
	const [update, state] = useUpdateSiteConfigMutation();
	const { refetch } = useGetSelfQuery({});
	const save = async (next: string[], message: string, description = 'Visits from it are counted from now on.') => {
		const res: any = await update({ domains: next });
		if (!('data' in res)) return false;
		toaster.create({ type: 'success', title: message, description });
		refetch();
		return true;
	};
	return { save, saving: state.isLoading, error: state.error, domains };
};

type Props = { domains: string[]; canEdit: boolean };

const DomainsDialog: FC<Props & { open: boolean; onClose: () => void }> = ({ domains, open, onClose }) => {
	const { data } = useGetAnalyticsHostsQuery(undefined, { skip: !open });
	const { save, saving, error } = useDomains(domains);
	const [draft, setDraft] = useState<string[]>(domains);
	const [typed, setTyped] = useState('');
	const [bad, setBad] = useState(false);
	// Fresh from the saved list each time it opens (only then — `domains` may be a new array on every render).
	useEffect(() => {
		if (open) {
			setDraft(domains);
			setTyped('');
			setBad(false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open]);

	const add = (d: string) => setDraft(list => (list.includes(d) ? list : [...list, d]));
	const addTyped = () => {
		const d = asDomain(typed);
		if (!d) return setBad(true);
		add(d);
		setTyped('');
		setBad(false);
	};
	// The sites visits came from that the list (as it is now) doesn't cover.
	const covered = (host: string) => {
		const bare = host.replace(/:\d+$/, '').replace(/^www\./, '');
		return draft.some(d => {
			const dom = d.replace(/^www\./, '');
			return bare === dom || bare.endsWith(`.${dom}`);
		});
	};
	const found = (data?.hosts || []).filter(h => !covered(h.host));
	const dirty = draft.length !== domains.length || draft.some((d, i) => d !== domains[i]);

	return (
		<Dialog.Root
			placement='center'
			size='md'
			// Adding a found site or removing a domain takes its button off the page, which moves focus out of the
			// dialog — that mustn't close it. Cancel, Save and Escape do.
			closeOnInteractOutside={false}
			open={open}
			onOpenChange={e => !e.open && onClose()}>
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<Dialog.Content
						borderRadius={radius.MODAL}
						bg='bg.panel'
						borderWidth='1px'
						borderColor='border'>
						<Dialog.Header
							px={{ base: 4, md: 6 }}
							pt={{ base: 4, md: 5 }}
							pb={{ base: 3, md: 4 }}>
							<Flex
								align='center'
								justify='space-between'
								gap={3}
								pr={2}
								w='full'>
								<Dialog.Title fontSize='16px'>Your site’s domains</Dialog.Title>
								<GuideLink section='site-domains' />
							</Flex>
						</Dialog.Header>
						<Dialog.Body
							px={{ base: 4, md: 6 }}
							pt={0}
							pb={{ base: 4, md: 5 }}>
							<Text
								fontSize='12.5px'
								color='fg.muted'
								mb={4}>
								Analytics counts visits only from these addresses (www. and subdomains included). With none, it counts visits from any site.
							</Text>

							{found.length > 0 && (
								<Box mb={4}>
									<Text
										fontSize='12px'
										fontWeight='600'
										mb={2}>
										Visits came from
									</Text>
									<Flex
										direction='column'
										gap={1.5}>
										{found.map(h => (
											<Flex
												key={h.host}
												align='center'
												gap={3}
												px={3}
												py={2}
												borderWidth='1px'
												borderColor='border'
												borderRadius='md'>
												<Box
													flex={1}
													minW={0}>
													<Text
														fontSize='13px'
														fontFamily='mono'
														truncate>
														{h.host}
													</Text>
													<Text
														fontSize='11.5px'
														color='fg.muted'>
														{h.pageviews} page view{h.pageviews === 1 ? '' : 's'} · last {moment(h.lastSeen).fromNow()}
													</Text>
												</Box>
												<Button
													size='xs'
													variant='outline'
													onClick={() => add(asDomain(h.host) || h.host)}>
													<Plus size={12} />
													Add
												</Button>
											</Flex>
										))}
									</Flex>
								</Box>
							)}

							<Text
								fontSize='12px'
								fontWeight='600'
								mb={2}>
								Add a domain
							</Text>
							<Flex gap={2}>
								<Input
									size='sm'
									fontFamily='mono'
									value={typed}
									placeholder='www.your-site.com'
									onChange={e => {
										setTyped(e.target.value);
										setBad(false);
									}}
									onKeyDown={e => e.key === 'Enter' && addTyped()}
								/>
								<Button
									size='sm'
									variant='outline'
									flexShrink={0}
									onClick={addTyped}>
									Add
								</Button>
							</Flex>
							{bad && (
								<Text
									fontSize='12px'
									color='red.fg'
									mt={1}>
									That doesn’t look like a domain — e.g. www.your-site.com
								</Text>
							)}

							<Text
								fontSize='12px'
								fontWeight='600'
								mt={4}
								mb={2}>
								Counting visits from
							</Text>
							{draft.length ? (
								<Flex
									gap={2}
									wrap='wrap'>
									{draft.map(d => (
										<Flex
											key={d}
											align='center'
											gap={1}
											pl={2.5}
											pr={1}
											py={0.5}
											borderWidth='1px'
											borderColor='border'
											borderRadius='full'
											fontSize='12.5px'
											fontFamily='mono'>
											{d}
											<Button
												size='2xs'
												variant='ghost'
												aria-label={`Remove ${d}`}
												onClick={() => setDraft(list => list.filter(x => x !== d))}>
												<X size={12} />
											</Button>
										</Flex>
									))}
								</Flex>
							) : (
								<Text
									fontSize='12.5px'
									color='fg.muted'>
									Any site — no domains yet.
								</Text>
							)}
							{error ? (
								<Text
									fontSize='12px'
									color='red.fg'
									mt={3}>
									{errorOf(error)}
								</Text>
							) : null}
						</Dialog.Body>
						<ModalFooter>
							<Flex
								gap={2}
								justify='flex-end'
								w='full'>
								<Button
									px={3}
									size='sm'
									variant='outline'
									onClick={onClose}>
									Cancel
								</Button>
								<Button
									px={3}
									size='sm'
									disabled={!dirty}
									loading={saving}
									onClick={async () => (await save(draft, 'Domains saved', draft.length ? 'Analytics counts visits from these from now on.' : 'Analytics counts visits from any site again.')) && onClose()}>
									Save
								</Button>
							</Flex>
						</ModalFooter>
					</Dialog.Content>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
};

/** The header line: the domains (or "any site"), the busiest site not added yet with a one-click Add, and the dialog. */
const Domains: FC<Props> = ({ domains, canEdit }) => {
	const [open, setOpen] = useState(false);
	const { data } = useGetAnalyticsHostsQuery(undefined, { skip: !canEdit });
	const { save, saving } = useDomains(domains);
	const suggestion = (data?.hosts || []).find(h => !h.added);
	const suggested = suggestion ? asDomain(suggestion.host) : '';
	return (
		<Flex
			align='center'
			gap={2}
			wrap='wrap'
			fontSize='12.5px'
			color='fg.muted'>
			<Text>{domains.length ? domains.join(' · ') : 'Counting visits from any site'}</Text>
			{canEdit && suggested && (
				<Button
					size='2xs'
					variant='subtle'
					colorPalette='green'
					loading={saving}
					onClick={() => save([...domains, suggested], `${suggested} added`)}>
					<Plus size={11} />
					Add {suggested}
				</Button>
			)}
			{canEdit ? (
				<Button
					size='2xs'
					variant='outline'
					onClick={() => setOpen(true)}>
					{domains.length ? 'Domains' : 'Add domain'}
				</Button>
			) : !domains.length ? (
				<Text>— a manager can add your domains</Text>
			) : null}
			{canEdit && (
				<DomainsDialog
					domains={domains}
					canEdit={canEdit}
					open={open}
					onClose={() => setOpen(false)}
				/>
			)}
		</Flex>
	);
};

export default Domains;
