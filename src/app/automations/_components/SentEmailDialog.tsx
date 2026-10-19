'use client';

import { FC, useState } from 'react';
import { Badge, Box, Button, CloseButton, Dialog, Flex, IconButton, Portal, Skeleton, Text } from '@chakra-ui/react';
import { Eye, Mail, Paperclip, Send } from 'lucide-react';
import { AlertDialogContent, AlertDialogHeader, DiscardButton, ModalFooter, PromptDialog } from '@/components/library';
import { toaster } from '@/components/ui/toaster';
import GuideLink from '@/components/library/tenant/GuideLink';
import { useGetSentEmailQuery, useResendEmailMutation } from '@/components/library/store/services/tenantApi';
import type { MailLogEntry, SentEmailBase } from '@/components/library/store/services/tenantApi';

/**
 * A logged email as it went out (backend docs/automations AU-03c): to,
 * subject, the message in the project's email design, the files it carried,
 * and — for a failed one — why, with Resend. Automation emails keep their
 * body; other kinds only their subject. `base` is where it's read from:
 * an automation's runs (Build) or Project → Email (manage projects).
 */

const when = (iso?: string | null) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '');

/** "Resend this email?" — then sends it again and says how it went. */
export const ResendPrompt: FC<{ base: SentEmailBase; email: MailLogEntry | null; onClose: () => void }> = ({ base, email, onClose }) => {
	const [resend, { isLoading }] = useResendEmailMutation();
	return (
		<PromptDialog
			open={!!email}
			onClose={onClose}
			tone='default'
			icon={<Send size={17} />}
			title='Resend this email?'
			description={`It goes to ${email?.to || ''} again — the same subject, message and files — through the project’s email account as it is now.`}
			subject={email?.subject}
			confirmLabel='Resend'
			loading={isLoading}
			loadingText='Sending…'
			onConfirm={async () => {
				if (!email) return;
				try {
					await resend({ base, id: email._id }).unwrap();
					toaster.create({ type: 'success', title: `Resent to ${email.to}` });
					onClose();
				} catch (e: any) {
					toaster.create({ type: 'error', title: 'Not sent again', description: e?.data?.message || 'Try again in a moment.' });
				}
			}}
		/>
	);
};

const Row: FC<{ label: string; children: any }> = ({ label, children }) => (
	<Flex
		gap={3}
		fontSize='13px'>
		<Text
			w='64px'
			flexShrink={0}
			color='fg.muted'>
			{label}
		</Text>
		<Box
			flex={1}
			minW={0}
			wordBreak='break-word'>
			{children}
		</Box>
	</Flex>
);

/** The eye's dialog: the email as sent. */
const SentEmailDialog: FC<{ base: SentEmailBase; id: string | null; onClose: () => void }> = ({ base, id, onClose }) => {
	const { data: m, isFetching, isError, error } = useGetSentEmailQuery({ base, id: id || '' }, { skip: !id });
	const [plain, setPlain] = useState(false);
	const [resending, setResending] = useState<MailLogEntry | null>(null);
	const ready = m && m._id === id;
	return (
		<>
			<Dialog.Root
				size='lg'
				placement='top'
				scrollBehavior='inside'
				open={!!id}
				onOpenChange={e => !e.open && onClose()}>
				<Portal>
					<Dialog.Backdrop />
					<Dialog.Positioner>
						<AlertDialogContent
							px={0}
							borderWidth='1px'
							borderColor='border'>
							<AlertDialogHeader>
								<Flex
									as='span'
									align='center'
									gap={2}>
									<Mail size={16} />
									The email as sent
								</Flex>
							</AlertDialogHeader>
							<Dialog.CloseTrigger
								asChild
								top={2}
								right={2}>
								<CloseButton size='sm' />
							</Dialog.CloseTrigger>
							<Dialog.Body p={4}>
								{isError ? (
									<Text
										role='alert'
										fontSize='13px'
										color='red.fg'>
										{(error as any)?.data?.message || 'Couldn’t load the email — try again.'}
									</Text>
								) : !ready || isFetching ? (
									<Skeleton h='320px' />
								) : (
									<Flex
										direction='column'
										gap={3}>
										<Flex
											align='center'
											gap={2}
											wrap='wrap'>
											<Badge
												size='sm'
												colorPalette={m.status === 'sent' ? 'green' : 'red'}>
												{m.status === 'sent' ? 'Sent' : 'Failed'}
											</Badge>
											<Text
												fontSize='12.5px'
												color='fg.muted'>
												{when(m.createdAt)}
												{m.resendOf ? ' · a resend of an earlier email' : ''}
											</Text>
											{m.resent && (
												<Badge
													size='sm'
													variant='outline'
													colorPalette={m.resent.status === 'sent' ? 'green' : 'red'}>
													{m.resent.status === 'sent' ? `Resent ${when(m.resent.at)}` : 'Resend failed too'}
												</Badge>
											)}
										</Flex>
										<Flex
											direction='column'
											gap={1.5}>
											<Row label='To'>{m.to}</Row>
											<Row label='Subject'>{m.subject || '(no subject)'}</Row>
											{!!m.files?.length && (
												<Row label='Files'>
													<Flex
														gap={3}
														wrap='wrap'>
														{m.files.map(f => (
															<Flex
																key={f.filename}
																align='center'
																gap={1}>
																<Paperclip size={12} />
																{f.filename}
															</Flex>
														))}
													</Flex>
												</Row>
											)}
										</Flex>
										{m.status === 'failed' && (
											<Box
												role='alert'
												borderWidth='1px'
												borderColor='red.muted'
												bg='red.subtle'
												borderRadius='md'
												px={3}
												py={2}
												fontSize='13px'
												color='red.fg'>
												{m.error || 'It wasn’t sent.'}
												{m.resent?.status === 'failed' && m.resent.error && m.resent.error !== m.error && (
													<Text mt={1}>Resent {when(m.resent.at)}: {m.resent.error}</Text>
												)}
											</Box>
										)}
										{m.kept ? (
											<Box>
												<Flex
													justify='flex-end'
													mb={1}>
													<Button
														size='xs'
														variant='ghost'
														onClick={() => setPlain(v => !v)}>
														{plain ? 'Show the design' : 'Show the plain text'}
													</Button>
												</Flex>
												{plain ? (
													<Box
														as='pre'
														borderWidth='1px'
														borderColor='border'
														borderRadius='md'
														p={3}
														fontSize='13px'
														fontFamily='inherit'
														whiteSpace='pre-wrap'>
														{m.text}
													</Box>
												) : (
													<Box
														borderWidth='1px'
														borderColor='border'
														borderRadius='md'
														overflow='hidden'
														bg='white'>
														{/* Its own page, nothing in it can run: a sandbox with no permissions. */}
														<iframe
															title={`The email: ${m.subject}`}
															sandbox=''
															srcDoc={m.html}
															style={{ display: 'block', width: '100%', height: '460px', border: 0 }}
														/>
													</Box>
												)}
											</Box>
										) : (
											<Text
												fontSize='13px'
												color='fg.muted'>
												Only the subject of this kind of email is kept — the message isn’t stored.
											</Text>
										)}
									</Flex>
								)}
							</Dialog.Body>
							<ModalFooter>
								<Box flex={1}>
									<GuideLink section={base === 'automations/emails' ? 'automation-emails' : 'email-log'} />
								</Box>
								<DiscardButton onClick={onClose}>Close</DiscardButton>
								{ready && m.canResend && (
									<Button
										size='sm'
										px={3}
										onClick={() => setResending(m)}>
										<Send size={14} /> Resend
									</Button>
								)}
							</ModalFooter>
						</AlertDialogContent>
					</Dialog.Positioner>
				</Portal>
			</Dialog.Root>
			<ResendPrompt
				base={base}
				email={resending}
				onClose={() => setResending(null)}
			/>
		</>
	);
};

/**
 * An email row's buttons: the eye (the email as sent, for one whose body was
 * kept) and Resend (a failed one).
 */
export const EmailRowActions: FC<{ base: SentEmailBase; email: MailLogEntry }> = ({ base, email }) => {
	const [viewing, setViewing] = useState<string | null>(null);
	const [resending, setResending] = useState<MailLogEntry | null>(null);
	return (
		<Flex
			gap={1}
			align='center'
			flexShrink={0}
			onClick={e => e.stopPropagation()}>
			{email.kept && (
				<IconButton
					size='xs'
					variant='ghost'
					aria-label='See the email'
					title='See the email'
					onClick={() => setViewing(email._id)}>
					<Eye size={14} />
				</IconButton>
			)}
			{email.canResend && (
				<Button
					size='xs'
					variant='outline'
					px={2}
					onClick={() => setResending(email)}>
					<Send size={12} /> Resend
				</Button>
			)}
			<SentEmailDialog
				base={base}
				id={viewing}
				onClose={() => setViewing(null)}
			/>
			<ResendPrompt
				base={base}
				email={resending}
				onClose={() => setResending(null)}
			/>
		</Flex>
	);
};

export default SentEmailDialog;
