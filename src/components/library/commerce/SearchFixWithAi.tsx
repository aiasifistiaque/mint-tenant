'use client';

import { FC, useState } from 'react';
import NextLink from 'next/link';
import { Box, Button, Dialog, Portal, Text, Textarea } from '@chakra-ui/react';
import { Sparkles } from 'lucide-react';
import { ModalFooter, radius } from '..';
import GuideLink from '../tenant/GuideLink';
import { toaster } from '@/components/ui/toaster';
import { projectHref } from '../config/lib/constants/panel';

/**
 * Fix with your AI (backend docs/search SI-18): a prompt to paste into the owner's own AI (Claude, ChatGPT…) with
 * this project's MCP connector. It reads Insights, tries the searches, and drafts fixes that come back here as
 * Suggested fixes, marked From your AI — nothing changes until the owner accepts. No AI runs on Mint's servers.
 */

export const searchFixPrompt = (days: number, q?: string) =>
	[
		`Improve my store's website search using the Mint tools for this project.`,
		q
			? `1. Look at the search “${q}”: call search_insights with q "${q}" and days ${days}, then try_search "${q}" to see each result's reasons.`
			: `1. Call search_insights with days ${days}. Look most at searches with no results and searches with a low click rate.`,
		`2. For each problem, try_search it and work out why: a missing word (a product shoppers mean but search doesn't find), a word that means the same as another, a search that should go to a page, or the wrong products first.`,
		`3. Fix it the gentlest way that works:`,
		`   - search words on the products shoppers mean → enrich_products (show me the dry run first and wait for my OK before apply: true);`,
		`   - two words that mean the same → save_search_suggestion kind "synonym";`,
		`   - a search for a page (returns, delivery, contact) → kind "redirect";`,
		`   - the right products but in the wrong order → kind "rule" (pin or boost), only when nothing above fixes it.`,
		`   Give each suggestion a one-sentence "why" from what you saw. Never invent products; if the store just doesn't sell something, tell me instead.`,
		`4. Finish with a short list of what you suggested and what you'd leave alone. The suggestions wait in Store → Search insights → Suggested fixes for me to accept.`,
	].join('\n');

const SearchFixWithAi: FC<{ days: number; q?: string; size?: 'xs' | 'sm' }> = ({ days, q, size = 'sm' }) => {
	const [open, setOpen] = useState(false);
	const prompt = searchFixPrompt(days, q);
	const copy = async () => {
		try {
			await navigator.clipboard.writeText(prompt);
			toaster.create({ type: 'success', title: 'Prompt copied', description: 'Paste it into your AI with this project connected.' });
		} catch {
			toaster.create({ type: 'error', title: 'Couldn’t copy', description: 'Select the text and copy it instead.' });
		}
	};
	return (
		<>
			<Button size={size} variant='outline' onClick={() => setOpen(true)}>
				<Sparkles size={14} /> Fix with your AI
			</Button>
			<Dialog.Root placement='center' size='lg' open={open} onOpenChange={e => setOpen(e.open)}>
				<Portal>
					<Dialog.Backdrop />
					<Dialog.Positioner>
						<Dialog.Content id='store-search-fix-with-ai' borderRadius={radius.MODAL} bg='bg.panel' borderWidth='1px' borderColor='border'>
							<Dialog.Header px={6} pt={5} pb={2} display='flex' justifyContent='space-between' alignItems='center'>
								<Dialog.Title fontSize='16px'>Fix with your AI</Dialog.Title>
								<GuideLink section='store-search-fix-with-ai' />
							</Dialog.Header>
							<Dialog.Body px={6} pt={0} pb={5}>
								<Text fontSize='13px' color='fg.muted' mb={3}>
									Paste this into your own AI — Claude, ChatGPT or another — with this project connected. It reads your search insights, tries the searches and suggests fixes. They come back to Suggested fixes, marked From your AI; nothing changes until you accept them.
								</Text>
								<Textarea readOnly value={prompt} rows={14} fontSize='12px' fontFamily='mono' onFocus={e => e.currentTarget.select()} aria-label='Prompt for your AI' />
								<Box mt={3} fontSize='12px' color='fg.muted'>
									Not connected yet?{' '}
									<NextLink href={projectHref('/model-builder/connect')}>
										<Text as='span' textDecoration='underline'>
											Connect your AI
										</Text>
									</NextLink>{' '}
									(a key with Data and Build).
								</Box>
							</Dialog.Body>
							<ModalFooter>
								<Button size='sm' variant='outline' px={3} onClick={() => setOpen(false)}>
									Close
								</Button>
								<Button size='sm' px={3} onClick={copy}>
									Copy prompt
								</Button>
							</ModalFooter>
						</Dialog.Content>
					</Dialog.Positioner>
				</Portal>
			</Dialog.Root>
		</>
	);
};

export default SearchFixWithAi;
