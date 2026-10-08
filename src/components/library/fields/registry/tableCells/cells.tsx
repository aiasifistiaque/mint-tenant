// WO-13: table-cell components, one per TableTypeId, ported from the switch
// that used to live inside TableData.tsx's `TableBody`. `Price`/`DataArray`/
// `DataArrayCount` are the 3 the doc flags as declared-but-unhandled — they
// used to fall through to plain-text `default`.
import { Text, Flex, Badge, BadgeProps } from '@chakra-ui/react';
import moment from 'moment';
import { useColorMode } from '@/components/ui/color-mode';
// Direct paths, not the big `@/components/library` barrel — TableData.tsx
// (this file's only consumer) deliberately avoids that barrel for the same
// components to sidestep a self-referencing import cycle.
import CustomTd from '@/components/library/components/table/table-components/data/CustomTd';
import Align from '@/components/library/containers/AlignCenter';
import Price from '@/components/library/utils/texts/Price';
import SecretValue from '@/components/library/cl/SecretValue';

const dateCss: any = { fontSize: { base: '1rem', md: '.8rem' } };
const badgeCss: BadgeProps = { fontSize: '12px', size: 'xs' };

/** The settings' words around a value and the field under it — for cells that don't pass their props on. */
const dressOf = ({ affixBefore, affixAfter, subtitle }: any) => ({ affixBefore, affixAfter, subtitle });

export const CheckboxCell = ({ children, item, ...props }: any) => {
	const { colorMode } = useColorMode();
	return (
		<CustomTd {...dressOf(props)}>
			<Align gap={2}>
				<Flex
					borderRadius='full'
					h='10px'
					w='10px'
					bg={
						children?.toString() === 'true'
							? colorMode == 'dark'
								? '#50e3c2'
								: '#00a843'
							: colorMode === 'dark'
							? '#fe5f55'
							: '#EE0000'
					}
				/>
				<Text
					fontSize='15px'
					textTransform='capitalize'>
					{item?.displayValue ? item?.displayValue[children?.toString()] : children?.toString()}
				</Text>
			</Align>
		</CustomTd>
	);
};

export const TagCell = ({ children, colorPalette, ...props }: any) => (
	<CustomTd
		{...dressOf(props)}
		flexWrap='wrap'
		gap={2}>
		{Array.isArray(children)
			? children.map((item: any, i: number) => (
					<Badge
						key={i}
						colorPalette={
							item?.colorTheme ? item?.colorTheme[item.toLowerCase()] : colorPalette ? colorPalette(children) : 'gray'
						}
						{...badgeCss}>
						{item}
					</Badge>
			  ))
			: null}
	</CustomTd>
);

export const NumberCell = ({ children, ...props }: any) => <CustomTd {...props}>{children?.toLocaleString()}</CustomTd>;

export const ImageTextCell = ({ children, imageKey, ...props }: any) => (
	<CustomTd
		display='flex'
		alignItems='center'
		type='image-text'
		gap={2}
		src={imageKey}
		{...props}>
		{children}
	</CustomTd>
);

export const TimeCell = ({ children, ...props }: any) => (
	<CustomTd
		{...dateCss}
		{...props}>
		{children || '--'}
	</CustomTd>
);

export const DateOnlyCell = ({ children, ...props }: any) => (
	<CustomTd
		{...dateCss}
		{...props}>
		{children ? moment(children).format('DD-MM-YYYY') : '--'}
	</CustomTd>
);

export const DateCell = ({ children, ...props }: any) => (
	<CustomTd
		{...dateCss}
		{...props}>
		{children ? moment(children).calendar() : '--'}
	</CustomTd>
);

export const BooleanCell = ({ children, ...props }: any) => <CustomTd {...props}>{children ? 'Yes' : 'No'}</CustomTd>;

export const ExternalLinkCell = ({ children, type, ...props }: any) => (
	<CustomTd
		type={type}
		{...props}>
		{children}
	</CustomTd>
);

export const FileCell = ({ children, type, ...props }: any) => (
	<CustomTd
		type={type}
		{...props}>
		{children}
	</CustomTd>
);

/** Dots with an eye to reveal it in place; the eye doesn't open the row. */
export const PasswordCell = ({ children, ...props }: any) => (
	<CustomTd {...props}>
		<SecretValue
			value={children}
			size='xs'
		/>
	</CustomTd>
);

export const TextCell = ({ children, ...props }: any) => <CustomTd {...props}>{children}</CustomTd>;

const INVITATION_STATUS_COLOR: Record<string, string> = {
	pending: 'orange',
	accepted: 'green',
	cancelled: 'red',
};

export const InvitationStatusCell = ({ children, ...props }: any) => {
	const status = typeof children === 'string' ? children : undefined;
	return (
		<CustomTd {...props}>
			{status ? (
				<Badge
					colorPalette={INVITATION_STATUS_COLOR[status] || 'gray'}
					textTransform='capitalize'
					{...badgeCss}>
					{status}
				</Badge>
			) : (
				'--'
			)}
		</CustomTd>
	);
};

// WO-13: the 3 previously-unhandled cells.
export const PriceCell = ({ children, ...props }: any) => (
	<CustomTd {...props}>{children === undefined || children === null || children === '' ? '--' : <Price>{children}</Price>}</CustomTd>
);

export const DataArrayCell = ({ children, ...props }: any) => (
	<CustomTd {...props}>{Array.isArray(children) ? `${children.length} item${children.length === 1 ? '' : 's'}` : '--'}</CustomTd>
);

export const DataArrayCountCell = ({ children, ...props }: any) => (
	<CustomTd {...props}>{Array.isArray(children) ? children.length : typeof children === 'number' ? children : '--'}</CustomTd>
);
