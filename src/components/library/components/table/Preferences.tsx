'use client';

import {
	useDisclosure,
	Text,
	Checkbox,
	Flex,
	Grid,
	IconButton,
	TextProps,
	GridProps,
	Tooltip,
} from '@chakra-ui/react';
import { useEffect, useState, useCallback } from 'react';
import { useColorMode } from '@/components/ui/color-mode';

import {
	MenuModal,
	MenuModalHeader,
	MenuModalBody,
	MenuModalCloseButton,
	MenuModalFooter,
} from '../../components/table/table-components/menu-modals';

import { useUpdatePreferencesMutation } from '../../store';
import { setViewMode } from '../../store/slices/tableSlice';
import { useAppDispatch, useAppSelector, useIsMobile } from '../../hooks';
import { formatFieldTitle } from '../../functions';
import { sizes, radius, shadow } from '../../config';
import { Icon } from '../../icon';
import { ConfirmButton, DiscardButton } from '../buttons';

const Preferences = ({ path, schema }: { path: string; schema?: any }) => {
	const { open: isOpen, onOpen, onClose } = useDisclosure();
	const { fields = [], preferences = [], viewMode = 'table' } = useAppSelector(
		(state: any) => state.table
	);
	const [selected, setSelected] = useState<string[]>([]);
	const { colorMode } = useColorMode();
	const dispatch = useAppDispatch();

	// A phone has no choice to offer — there isn't room for columns, so it is
	// always cards and the toggle would be a control that does nothing.
	const isMobile = useIsMobile();

	const [trigger, result] = useUpdatePreferencesMutation();
	const { isSuccess, isLoading } = result;

	const handleSubmit = () => {
		trigger({
			field: path,
			preferences: selected,
		});
	};

	const closeModal = () => {
		setSelected(preferences);
		onClose();
	};

	useEffect(() => {
		setSelected(preferences);
	}, [preferences]);

	useEffect(() => {
		if (isSuccess) closeModal();
	}, [result]);

	const handleCheckboxChange = useCallback((checked: boolean, field: any) => {
		if (checked) setSelected(prevSelected => [...prevSelected, field]);
		else setSelected(prevSelected => prevSelected.filter(item => item !== field));
	}, []);

	const checkboxes = fields.map((field: string) => (
		// Key first, and keyed on the field rather than the index: React reads a
		// key off the element, never out of a spread, so leaving it after
		// `{...style.checkbox}` is what made these read as unkeyed.
		<Checkbox.Root
			key={field}
			{...style.checkbox}
			checked={selected?.includes(field)}
			onCheckedChange={(e: any) => handleCheckboxChange(e.checked, field)}>
			<Checkbox.HiddenInput />
			<Checkbox.Control>
				<Checkbox.Indicator />
			</Checkbox.Control>
			<Checkbox.Label>{formatFieldTitle({ field, schema })}</Checkbox.Label>
		</Checkbox.Root>
	));
	return (
		<>
			<Tooltip.Root
				lazyMount
				openDelay={200}
				closeDelay={100}
				positioning={{ placement: 'bottom' }}>
				<Tooltip.Trigger asChild>
					<IconButton
						onClick={onOpen}
						aria-label='Table preferences'
						// Outline, like the refresh button beside the search field. It
						// was a solid gray button with its fill overridden, so the icon
						// took the solid's text colour (the theme's accent text), white
						// on a white button in light mode.
						variant='outline'
						size='sm'
						mr={0.5}
						h={sizes?.SEARCH_BAR_HEIGHT}
						w={sizes?.SEARCH_BAR_HEIGHT}
						minW={sizes?.SEARCH_BAR_HEIGHT}
						borderRadius={radius?.BUTTON}
						color='fg.muted'
						bg='field.bg'
						borderColor='field.border'
						_hover={{ bg: 'bg.subtle', color: 'fg', borderColor: 'border.emphasized' }}>
						<Icon
							name='preferences'
							size={14}
						/>
					</IconButton>
				</Tooltip.Trigger>
				<Tooltip.Positioner>
					<Tooltip.Content p={1}>Table preferences</Tooltip.Content>
				</Tooltip.Positioner>
			</Tooltip.Root>

			<MenuModal
				placement={{ base: 'bottom', md: 'center' }}
				forceModal
				isOpen={isOpen}
				onClose={closeModal}>
				{/* <MenuModalOverlay />
				<MenuModalContent> */}

				<MenuModalHeader>Select Preferences</MenuModalHeader>
				<MenuModalCloseButton />
				<MenuModalBody>
					{!isMobile && (
						<>
							<Text {...style.sectionLabel}>Layout</Text>
							<Flex {...style.segmented}>
								{VIEW_OPTIONS.map(option => {
									const isActive = viewMode === option.value;
									return (
										<Flex
											key={option.value}
											as='button'
											type='button'
											onClick={() => dispatch(setViewMode(option.value))}
											aria-pressed={isActive}
											{...style.segment}
											{...(isActive ? style.segmentActive : null)}>
											<Icon
												name={option.icon}
												size={13}
											/>
											{option.label}
										</Flex>
									);
								})}
							</Flex>
						</>
					)}

					<Text {...style.sectionLabel}>Columns</Text>
					<Grid {...style.checkboxGrid}>{checkboxes}</Grid>
				</MenuModalBody>
				<MenuModalFooter>
					{selected?.length < 2 ? (
						<Text {...style.errorText}>Please select at least 2 fields</Text>
					) : (
						<>
							<DiscardButton onClick={closeModal}>Discard</DiscardButton>
							<ConfirmButton
								onClick={handleSubmit}
								loadingText='Processing'
								loading={result?.isLoading}>
								Apply
							</ConfirmButton>
						</>
					)}
				</MenuModalFooter>
			</MenuModal>
		</>
	);
};

// Names from the Icon map, not lucide's — `fields` is the table glyph already
// used on this menu's own trigger button.
const VIEW_OPTIONS: { value: 'table' | 'cards'; label: string; icon: any }[] = [
	{ value: 'table', label: 'Table', icon: 'fields' },
	{ value: 'cards', label: 'Cards', icon: 'z-grid' },
];

type Style = {
	checkboxGrid: GridProps;
	errorText: TextProps;
	checkbox: any;
};

const style: any = {
	checkboxGrid: {
		py: 2,
		gridTemplateColumns: '1fr 1fr',
		gap: 4,
		rowGap: 4,
		colorPalette: 'gray',
	},
	checkbox: {
		size: 'md',
		fontWeight: '500',
	},
	errorText: {
		color: 'red',
		textAlign: 'right',
	},
	sectionLabel: {
		fontSize: '11px',
		fontWeight: '700',
		letterSpacing: '0.06em',
		textTransform: 'uppercase',
		color: 'fg.muted',
		mt: 1,
		mb: 2,
	},
	// One track per option, so the two halves stay equal whatever the labels say.
	segmented: {
		display: 'grid',
		gridTemplateColumns: `repeat(${VIEW_OPTIONS.length}, 1fr)`,
		gap: 1,
		p: 1,
		borderRadius: radius.BUTTON,
		bg: 'bg.muted',
		mb: 4,
	},
	segment: {
		align: 'center',
		justify: 'center',
		gap: 2,
		h: '32px',
		borderRadius: radius.BUTTON,
		fontSize: '13px',
		fontWeight: '600',
		cursor: 'pointer',
		color: 'fg.muted',
		transition: 'background .12s ease, color .12s ease',
		_hover: { color: 'fg' },
	},
	segmentActive: {
		bg: 'bg.panel',
		color: 'fg',
		boxShadow: shadow.SUBTLE,
	},
};

export default Preferences;
