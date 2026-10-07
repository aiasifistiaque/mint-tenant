import { FC, ReactNode } from 'react';
import { Accordion, Box, FlexProps, Grid, GridProps, Text } from '@chakra-ui/react';

type FormDivisionProps = FlexProps & {
	children: ReactNode;
	isModal?: boolean;
	title?: string;
	description?: string;
	value?: string;
};

/**
 * One section of a create/edit form, collapsible.
 *
 * In a dialog or drawer the sections are flat — a hairline between them and a
 * quiet title — because the dialog is already the container; a bordered card
 * per section put three borders between the edge and an input. On a page they
 * are cards (1px border, no shadow), like the console's panels.
 */
const FormDivisionAccordion: FC<FormDivisionProps> = ({
	children,
	isModal = false,
	title,
	description,
	value,
	...props
}) => (
	<Accordion.Item
		value={value || title || 'section'}
		{...(isModal ? modalItemCss : pageItemCss)}
		{...props}>
		<Accordion.ItemTrigger
			{...(isModal ? modalTriggerCss : pageTriggerCss)}
			cursor='pointer'
			_hover={{ '& [data-part=item-indicator]': { color: 'fg' } }}>
			<Box
				flex='1'
				textAlign='left'
				minW={0}>
				<Text
					as='span'
					display='block'
					fontSize={isModal ? '14px' : '15px'}
					fontWeight='600'
					letterSpacing='-0.01em'
					color='fg'>
					{title}
				</Text>
				{description && (
					<Text
						as='span'
						display='block'
						mt={0.5}
						fontSize='13px'
						color='fg.muted'
						fontWeight='400'>
						{description}
					</Text>
				)}
			</Box>
			<Accordion.ItemIndicator color='fg.muted' />
		</Accordion.ItemTrigger>
		<Accordion.ItemContent>
			<Accordion.ItemBody p={0}>
				<Grid {...(isModal ? modalGridCss : pageGridCss)}>{children}</Grid>
			</Accordion.ItemBody>
		</Accordion.ItemContent>
	</Accordion.Item>
);

const modalItemCss: any = {
	borderWidth: 0,
	borderTopWidth: '1px',
	borderColor: 'border.muted',
	_first: { borderTopWidth: 0 },
	bg: 'transparent',
};

const pageItemCss: any = {
	borderWidth: '1px',
	borderColor: 'border',
	borderRadius: 'lg',
	bg: 'bg.panel',
	_dark: { bg: 'background.dark' },
	overflow: 'hidden',
};

const modalTriggerCss: any = { px: 0, py: 4, gap: 3 };
const pageTriggerCss: any = { px: 5, py: 4, gap: 3 };

// One column on a phone; two from md, where a field can span both (item.span).
const gridBase: GridProps = {
	gridTemplateColumns: { base: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
	rowGap: 5,
	columnGap: 4,
	w: 'full',
};
const modalGridCss: GridProps = { ...gridBase, pb: 5 };
const pageGridCss: GridProps = { ...gridBase, px: 5, pb: 5 };

export default FormDivisionAccordion;
