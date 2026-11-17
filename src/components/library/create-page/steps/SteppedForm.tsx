'use client';

import { FC, FormEvent, KeyboardEvent, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Box, Button, Flex, Text } from '@chakra-ui/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import FormMain from '../page/form-components/FormMain';
import Stepper from './Stepper';
import ReviewStep from './ReviewStep';
import { FormStepsConfig, missingOn, pagesOf, stepOfField } from './formSteps';

/**
 * A create / edit form in pages (backend docs/multi-page-forms): the stepper
 * across the top, one page of sections at a time, Next / Back, and Save on the
 * last page — the one call to the API (D7).
 *
 * The whole form lives in one `formData`, so moving between pages keeps what was
 * typed, and FormMain gets every field (formulas, autofill and conditions see the
 * whole form) while drawing only this page's sections.
 *
 * Create: Next checks this page's required fields; earlier pages can be opened,
 * later ones only once every page before them has been passed (D6). Edit: opens
 * on page 1 and any page can be opened.
 */

type Props = {
	fields: any[];
	formSteps: FormStepsConfig;
	formData: any;
	setFormData: any;
	setChangedData: any;
	mode: 'create' | 'edit';
	isLoading?: boolean;
	saveText?: string;
	cancelHref: string;
	/** Every page checked: save. */
	onSave: () => void;
	/** Extra words on the footer's left (edit: "3 changes"). */
	status?: string;
};

const SteppedForm: FC<Props> = ({ fields, formSteps, formData, setFormData, setChangedData, mode, isLoading, saveText, cancelHref, onSave, status }) => {
	const pages = useMemo(() => pagesOf(fields, formSteps), [fields, formSteps]);
	const [current, setCurrent] = useState(0);
	// The furthest page passed with Next (its required fields checked).
	const [passed, setPassed] = useState(-1);
	// What stopped Next / Save, said in the footer (a toast would sit on the buttons).
	const [stop, setStop] = useState('');
	const top = useRef<HTMLDivElement>(null);
	const isEdit = mode === 'edit';

	const at = Math.min(current, Math.max(0, pages.length - 1));
	const page = pages[at];
	const isLast = at === pages.length - 1;

	const go = (i: number) => {
		setStop('');
		setCurrent(i);
		// The new page starts at its top.
		requestAnimationFrame(() => top.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
	};

	/** This page's shown, required, empty fields — named in the footer, the first one scrolled to. */
	const stopsOn = (i: number) => {
		const missing = pages[i]?.review ? [] : missingOn(pages[i]?.fields || [], fields, formData);
		if (!missing.length) return false;
		setStop(`Fill in ${missing.map(f => f.label || f.name).join(', ')} to go on.`);
		requestAnimationFrame(() => {
			const el = document.querySelector<HTMLElement>(`[name="${CSS.escape(missing[0].name)}"]`);
			el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
			el?.focus?.({ preventScroll: true });
		});
		return true;
	};

	const next = () => {
		if (stopsOn(at)) return;
		setPassed(p => Math.max(p, at));
		go(at + 1);
	};

	const onSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!isLast) return next();
		// Edit can jump past pages, and conditions can change after a page was passed: check them all.
		for (let i = 0; i < pages.length; i++) {
			if (!pages[i].review && missingOn(pages[i].fields, fields, formData).length) {
				if (i !== at) go(i);
				stopsOn(i);
				return;
			}
		}
		onSave();
	};

	// Enter in a text box never saves (or turns the page).
	const onKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
		if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') e.preventDefault();
	};

	if (!page) return null;

	return (
		<form
			onSubmit={onSubmit}
			onKeyDown={onKeyDown}>
			<Flex
				ref={top}
				direction='column'
				gap={5}
				scrollMarginTop='80px'>
				<Stepper
					titles={pages.map(p => p.title)}
					current={at}
					canGo={i => isEdit || i <= passed + 1}
					done={i => i <= passed}
					onGo={go}
				/>

				<Box>
					<Text
						as='h2'
						fontSize='lg'
						fontWeight='600'
						letterSpacing='-0.01em'>
						{page.title}
					</Text>
					{page.description && (
						<Text
							fontSize='sm'
							color='fg.muted'
							mt={0.5}>
							{page.description}
						</Text>
					)}
				</Box>

				{page.review ? (
					<ReviewStep
						pages={pages}
						fields={fields}
						formData={formData}
						onEdit={go}
					/>
				) : (
					<FormMain
						fields={fields}
						formData={formData}
						setFormData={setFormData}
						setChangedData={setChangedData}
						showSection={first => stepOfField(first, formSteps) === page.key}
						sideColumn
					/>
				)}

				{/* Always in reach, however long the page is. */}
				<Flex
					position='sticky'
					bottom={0}
					zIndex={2}
					py={3}
					px={4}
					gap={3}
					align='center'
					justify='space-between'
					flexWrap='wrap'
					bg='bg.panel'
					borderWidth='1px'
					borderColor='border'
					borderRadius='lg'
					boxShadow='sm'>
					<Text
						fontSize='xs'
						role={stop ? 'alert' : undefined}
						color={stop ? 'fg.error' : 'fg.muted'}
						fontWeight={stop ? '500' : undefined}
						flex='1'
						minW='180px'>
						Step {at + 1} of {pages.length}
						{stop ? ` · ${stop}` : status ? ` · ${status}` : page.review ? '' : ' · Fields marked * must be filled in.'}
					</Text>
					<Flex
						gap={2}
						ml='auto'>
						{at === 0 ? (
							<Link href={cancelHref}>
								<Button
									size='sm'
									variant='outline'
									disabled={isLoading}>
									Cancel
								</Button>
							</Link>
						) : (
							<Button
								size='sm'
								variant='outline'
								disabled={isLoading}
								onClick={() => go(at - 1)}>
								<ArrowLeft size={14} />
								Back
							</Button>
						)}
						{isLast ? (
							// Own keys: the Next being clicked must not turn into this submit button mid-click.
							<Button
								key='save'
								size='sm'
								type='submit'
								loading={isLoading}
								loadingText='Saving'>
								{saveText || 'Save'}
							</Button>
						) : (
							<Button
								key='next'
								size='sm'
								type='button'
								onClick={next}>
								Next
								<ArrowRight size={14} />
							</Button>
						)}
					</Flex>
				</Flex>
			</Flex>
		</form>
	);
};

export default SteppedForm;
