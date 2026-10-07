import { FC, ReactNode } from 'react';
import { Flex, Heading, FlexProps } from '@chakra-ui/react';
import { padding, radius, shadow } from '../..';

type SettingsEditContainerProps = FlexProps & {
	isLoading?: boolean;
	children: ReactNode;
	heading?: ReactNode;
};

const P = { base: padding.CONTAINER.BASE, md: padding.CONTAINER.MD, lg: padding.CONTAINER.LG };

const containerProps: FlexProps = {
	w: 'full',
	flexDirection: 'column',
	bg: 'container.newLight',
	borderColor: 'container.borderLight',
	shadow: shadow.DASH,
	_dark: {
		bg: 'container.newDark',
		borderColor: 'container.borderDark',
	},
	borderRadius: radius.CONTAINER,
	borderWidth: 1,
};

const headingContainerProps: FlexProps = {
	pt: P,
	px: P,
	w: '100%',
	alignItems: 'center',
	justifyContent: 'space-between',
	gap: 2,
};

const headingProps = {
	fontWeight: '600',
	fontSize: { base: '1.15rem', md: '1.25rem' },
};

const ConfigContainer: FC<SettingsEditContainerProps> = ({
	isLoading,
	children,
	heading,
	...props
}) => {
	return (
		<Flex
			{...containerProps}
			{...props}>
			{/* HEADING */}
			{heading && (
				<Flex {...headingContainerProps}>
					<Heading {...headingProps}>{heading}</Heading>
				</Flex>
			)}
			{/* END OF HEADING */}
			{/* BODY */}
			{children}
			{/* END OF BODY */}
		</Flex>
	);
};

const bodyProps: FlexProps = {
	px: P,
	pb: 4,
	pt: 6,
	gap: 2,
	flexDir: 'column',
};

export const ConfigContainerBody = ({
	children,
	...props
}: FlexProps & { children: ReactNode }) => {
	return (
		<Flex
			{...bodyProps}
			{...props}>
			{children}
		</Flex>
	);
};

const footerProps: FlexProps = {
	px: P,
	borderTopWidth: 1,
	h: '52px',
	_light: { bg: 'background.light', borderColor: 'container.borderLight' },
	w: '100%',
	alignItems: 'center',
	gap: 2,
	borderBottomRadius: radius.CONTAINER,
};

export const ConfigContainerFooter = ({
	children,
	...props
}: FlexProps & { children: ReactNode }) => {
	return (
		<Flex
			{...footerProps}
			{...props}>
			{children}
		</Flex>
	);
};

export default ConfigContainer;
