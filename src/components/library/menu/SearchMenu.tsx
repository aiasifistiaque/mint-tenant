import { useEffect, useState, useRef, Fragment } from 'react';
import {
	Dialog,
	useDisclosure,
	Flex,
	Input,
	Text,
	FlexProps,
	TextProps,
	Portal,
	Box,
	Badge,
} from '@chakra-ui/react';

import { MenuIconContainer } from '.';
import { Icon, LucideIcon } from '../icon';
import { THEME, radius } from '../config';

import ModalContentContainer from '../modals/modal-components/ModalContentContainer';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SidebarItemType } from '../config/lib/sidebar/types';
import { IS_TENANT_PANEL, getProjectSlug, homeHref } from '../config/lib/constants/panel';
import { Column } from '../containers';
import { useGetNavSearchQuery } from '../store/services/navSearchApi';
import { viewHrefOf } from '../components/view/utils/record-link/linked';
import { useWorkspace } from '../tenant/useWorkspace';

/**
 * The navbar search (⌘K / Alt+K): the sidebar's pages by name, and — once two
 * letters are typed — records of the pages whose config turns search on
 * (Fields & rules → "Show in search", WO-54). The server asks each such page
 * through its own list rules, so only records this person can list come back;
 * they're listed under "<project> › <page>" and open the record's page.
 */

/** Records are searched a moment after typing stops. */
const useDebounced = (value: string, ms = 250) => {
	const [v, setV] = useState(value);
	useEffect(() => {
		const t = setTimeout(() => setV(value), ms);
		return () => clearTimeout(t);
	}, [value, ms]);
	return v;
};

const SearchMenu = ({
	sidebarData,
	iconSize,
	iconColor,
}: {
	sidebarData: SidebarItemType[];
	iconSize?: number;
	iconColor?: string;
}) => {
	const { open: isOpen, onOpen, onClose: closeModal } = useDisclosure();
	const [search, setSearch] = useState('');

	const initialRef = useRef(null);
	const finalRef = useRef(null);
	const [selectedIndex, setSelectedIndex] = useState(0);

	const onClose = () => {
		closeModal();
		setSearch('');
		//setSelectedIndex(0);
	};

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Command + K (Mac) or Ctrl + K
			if ((e.metaKey || e.altKey) && e.key === 'k') {
				e.preventDefault();
				if (isOpen) onClose();
				else onOpen();
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [onOpen, onClose, isOpen]);

	const router = useRouter();

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!isOpen) return;

			if (e.key === 'ArrowDown') {
				e.preventDefault();
				setSelectedIndex(prev => (prev < data.length - 1 ? prev + 1 : prev));
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
			} else if (e.key === 'Enter') {
				e.preventDefault();
				if (data[selectedIndex]) {
					router.push(data[selectedIndex]?.href);
					onClose();
				}
			} else if (e.key === 'Escape') {
				onClose();
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [selectedIndex, isOpen, onClose]);

	const restructureSidebar = (items: any): any[] => {
		let currentSection = '';

		return items.map((item: any, index: number) => {
			if (item.sectionTitle) {
				currentSection = item.sectionTitle;
			}

			return {
				...item,
				href: homeHref(item.href),
				sectionTitle: currentSection,
				index,
			};
		});
	};

	const restructData = restructureSidebar(sidebarData);

	const pages = restructData
		.filter(
			item =>
				!search ||
				search.length === 0 ||
				item.title.toLowerCase().includes(search.toLowerCase()) ||
				item.sectionTitle.toLowerCase().includes(search.toLowerCase())
		)
		.sort((a, b) => {
			if (a.title < b.title) return -1;
			if (a.title > b.title) return 1;
			return 0;
		});

	// Records: the tenant panel searches inside a project only — outside one there are no pages of records.
	const query = useDebounced(search.trim());
	const recordsOn = isOpen && query.length >= 2 && (!IS_TENANT_PANEL || !!getProjectSlug());
	const { currentData: found, isFetching: searching } = useGetNavSearchQuery(query, { skip: !recordsOn });
	const { project } = useWorkspace({ skip: !isOpen });
	const groups = recordsOn ? found?.groups || [] : [];
	const records = groups.flatMap(g =>
		g.hits.map(h => ({ ...h, group: g, href: viewHrefOf(g.route, h._id) }))
	);
	// One list for the arrow keys: pages first, then records.
	const data: { href: string }[] = [...pages, ...records];
	const where = (title: string) => (project?.name ? `${project.name} › ${title}` : title);

	useEffect(() => {
		if (data.length <= selectedIndex) {
			setSelectedIndex(0);
		}
	});

	return (
		<>
			<Dialog.Root
				lazyMount
				unmountOnExit
				trapFocus
				preventScroll
				placement='center'
				initialFocusEl={() => initialRef.current}
				finalFocusEl={() => finalRef.current}
				scrollBehavior='inside'
				size='md'
				open={isOpen}
				onOpenChange={({ open }) => (open ? {} : onClose())}>
				<Dialog.Trigger asChild>
					<Flex
						onClick={onOpen}
						aria-label='Search pages and records'
						title='Search (⌘K)'
						cursor='pointer'>
						<MenuIconContainer>
							<Icon
								name='search'
								size={iconSize || 16}
								color={iconColor || (THEME == 'basic' ? 'inherit' : 'white')}
							/>
						</MenuIconContainer>
					</Flex>
				</Dialog.Trigger>
				<Portal>
					<Dialog.Backdrop />
					<Dialog.Positioner>
						<ModalContentContainer
							borderRadius={radius.MODAL}
							px={0}
							gap={0}>
							<Dialog.Header
								px={3}
								pt={2.5}
								pb={2.5}
								borderColor={{
									_light: 'border.light',
									_dark: 'border.dark',
								}}
								borderBottomWidth={1}>
								<Input
									ref={initialRef}
									variant='flushed'
									size='md'
									_focus={{
										borderColor: 'transparent',
									}}
									value={search}
									color={{
										_light: 'text.light',
										_dark: 'text.dark',
									}}
									onChange={(e: any) => setSearch(e.target.value)}
									placeholder='Search pages and records'
									_placeholder={{
										fontSize: '15px',
										fontWeight: '400',
										_dark: { color: 'text.dark' },
									}}
									css={{
										'--focus-color': 'transparent',
									}}
								/>
								<Flex
									align='center'
									gap={1}>
									<Flex
										border='1px solid'
										borderColor='border.light'
										_dark={{ borderColor: 'border.dark' }}
										onClick={onClose}
										px={2}
										h='24px'
										align='center'
										borderRadius='sm'
										cursor='pointer'>
										<Text
											color={{
												_light: 'text.light',
												_dark: 'text.dark',
											}}
											fontWeight='500'
											fontSize='12px'>
											Esc
										</Text>
									</Flex>
								</Flex>
							</Dialog.Header>
							<Dialog.Body {...modalBodyCss}>
								<Flex {...bodyCss}>
									{pages.map((item: any, i: number) => (
										<Link
											key={i}
											href={item?.href}>
											<Flex
												{...itemContainerCss}
												bg={selectedIndex === i ? 'bg.muted' : 'transparent'}
												onMouseEnter={() => setSelectedIndex(i)}>
												<Flex
													gap={2}
													align='center'
													justify='space-between'
													w='full'>
													<Column>
														<Text {...titleCss}>{item?.sectionTitle}</Text>
														<Text {...textCss}>{item?.title}</Text>
													</Column>
													<Box mt={1}>
														<LucideIcon
															name={item?.icon}
															size={16}
														/>
													</Box>
												</Flex>
											</Flex>
										</Link>
									))}
									{records.map((item, j) => {
										const i = pages.length + j;
										const first = j === 0 || records[j - 1].group !== item.group;
										return (
											<Fragment key={`${item.group.route}:${item._id}`}>
												{first && (
													<Text
														{...groupCss}
														mt={i === 0 ? 1 : 3}>
														{where(item.group.title)}
													</Text>
												)}
												<Link
													href={item.href}
													onClick={onClose}>
													<Flex
														{...itemContainerCss}
														bg={selectedIndex === i ? 'bg.muted' : 'transparent'}
														onMouseEnter={() => setSelectedIndex(i)}>
														<Text
															{...recordCss}
															lineClamp={1}>
															{item.name}
														</Text>
														{item.match && (
															<Text
																{...titleCss}
																color='fg.muted'
																lineClamp={1}>
																{item.match.label}: {item.match.value}
															</Text>
														)}
													</Flex>
												</Link>
												{item.group.more && (j === records.length - 1 || records[j + 1].group !== item.group) && (
													<Text
														{...titleCss}
														color='fg.muted'
														px={2}
														pt={0.5}>
														More in {item.group.title} — type more to narrow it down
													</Text>
												)}
											</Fragment>
										);
									})}
									{recordsOn && searching && !records.length && (
										<Text
											{...titleCss}
											color='fg.muted'
											px={2}
											py={2}>
											Searching records…
										</Text>
									)}
									{search.trim() && !data.length && !(recordsOn && searching) && (
										<Text
											{...titleCss}
											color='fg.muted'
											px={2}
											py={2}>
											Nothing matches “{search.trim()}”.
										</Text>
									)}
								</Flex>
							</Dialog.Body>
						</ModalContentContainer>
					</Dialog.Positioner>
				</Portal>
			</Dialog.Root>
		</>
	);
};

const PX = 3;

const modalBodyCss: any = {
	px: PX,
	mt: 0,
	pt: 0,
	pb: 2,
};

const bodyCss: FlexProps = {
	py: 1,
	// borderTopWidth: 1,
	// borderTopColor: { base: 'gray.200', _dark: 'black' },
	flexDir: 'column',
	gap: 0.5,
};

const itemContainerCss: FlexProps = {
	borderRadius: 4,
	cursor: 'pointer',
	px: 2,
	py: 1.5,
	flexDir: 'column',
	gap: 0.2,
};

const titleCss: TextProps = {
	fontWeight: '400',
	fontSize: '12px',
};

const groupCss: TextProps = {
	fontSize: '11px',
	fontWeight: '600',
	letterSpacing: '0.04em',
	textTransform: 'uppercase',
	color: 'fg.muted',
	px: 2,
	mb: 0.5,
};

const recordCss: TextProps = {
	fontWeight: '600',
	fontSize: '15px',
};

const textCss: TextProps = {
	fontWeight: '600',
	fontSize: '16px',
};

export default SearchMenu;
