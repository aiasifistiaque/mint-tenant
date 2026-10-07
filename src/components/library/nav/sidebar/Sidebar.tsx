'use client';
import { FlexProps, Stack, Text } from '@chakra-ui/react';
import { ReactNode, FC, useEffect, useRef } from 'react';
import SidebarItem from './SidebarItem';
import useSidebarNav, { NavItem } from './useSidebarNav';

import {
	SidebarBody,
	SidebarContainer,
	SidebarLogo,
	SidebarSearch,
	SidebarSection,
} from './sidebar-components';
import Link from 'next/link';
import SidebarBrand from './sidebar-components/SidebarBrand';

const Sidebar: FC<FlexProps & { closeBtn?: ReactNode }> = ({ closeBtn, ...props }) => {
	const {
		title,
		isLoading,
		search,
		setSearch,
		isSearching,
		lead: filteredLead,
		sections: filteredSections,
		hasResults,
		toggle,
		isActive,
		isOpen,
	} = useSidebarNav();

	// Filters the sidebar in place — matches Vercel's project-nav search, which
	// narrows the list itself rather than opening a command palette. That's a
	// separate feature (SearchMenu, still in the navbar for a global jump).
	const searchInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.metaKey || e.ctrlKey || e.altKey || e.key.toLowerCase() !== 'f') return;

			const target = e.target as HTMLElement | null;
			const tag = target?.tagName;
			// Don't steal the letter while the admin is typing anywhere else.
			if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;

			e.preventDefault();
			searchInputRef.current?.focus();
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, []);

	const renderItem = (item: NavItem, key: string | number, withIcon = false) => (
		<Link
			key={key}
			href={item?.href}>
			<SidebarItem
				isLoading={isLoading}
				href={item?.href}
				path={item?.path}
				icon={item?.icon}
				withIcon={withIcon}>
				{item?.title}
			</SidebarItem>
		</Link>
	);

	return (
		<>
			<SidebarLogo>
				<SidebarBrand title={title} />
				{closeBtn && closeBtn}
			</SidebarLogo>

			<SidebarContainer {...props}>
				<SidebarBody>
					<SidebarSearch
						value={search}
						onChange={setSearch}
						inputRef={searchInputRef}
					/>

					{filteredLead.length ? (
						<Stack
							gap='2px'
							mb={1}>
							{filteredLead.map((item, i) => renderItem(item, i, true))}
						</Stack>
					) : null}

					{filteredSections.map((section, index) => {
						const active = isActive(section);
						const open = isOpen(section);

						return (
							<SidebarSection
								key={section.title}
								tone={index}
								title={section.title}
								icon={section.icon}
								isOpen={open}
								hasActive={active}
								isLoading={isLoading}
								onToggle={() => toggle(section.title)}>
								<Stack gap='2px'>
									{section.items.map((item, i) => renderItem(item, `${section.title}-${i}`))}
								</Stack>
							</SidebarSection>
						);
					})}

					{isSearching && !hasResults ? (
						<Text
							mt={4}
							textAlign='center'
							fontSize='xs'
							color='sidebar.bodyText.light'
							_dark={{ color: 'sidebar.bodyText.dark' }}>
							No matches for &ldquo;{search}&rdquo;
						</Text>
					) : null}
				</SidebarBody>
			</SidebarContainer>
		</>
	);
};

export default Sidebar;
