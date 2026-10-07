import { ReactNode } from 'react';
import { Center, CenterProps, Flex, FlexProps } from '@chakra-ui/react';

const BuilderBgOverlay = ({
	children,
	component,
	section,
	zIndex = 900,
	title = 'Edit',
}: {
	children: ReactNode;
	component?: boolean;
	zIndex?: number;
	title?: string;
	section?: boolean;
}) => {
	if (section)
		return (
			<Center
				zIndex={zIndex}
				{...sectionCss}>
				{children}
			</Center>
		);
	if (component)
		return (
			<Center
				zIndex={zIndex}
				{...componentCSS}>
				<Flex {...componentText}>{title}</Flex>
			</Center>
		);
	return (
		<Center
			zIndex={zIndex}
			{...overlayCSS}>
			{children}
		</Center>
	);
};

const commonCSS: CenterProps = {
	cursor: 'pointer',
	position: 'absolute',
	top: 0,
	left: 0,
	w: 'full',
	flex: 1,
	h: 'full',
	transition: '.3s',
};

const componentCSS: CenterProps = {
	...commonCSS,
	borderWidth: 2,
	borderColor: 'accent.solid',
};

const sectionCss: CenterProps = {
	cursor: 'pointer',
	position: 'absolute',
	top: 8,
	right: 24,
	transition: '.3s',
};

const componentText: FlexProps = {
	bg: 'accent.solid',
	position: 'absolute',
	top: 0,
	p: '2px',
	left: 0,
	fontSize: '10px',
	letterSpacing: '.25px',
	fontWeight: '600',
	textTransform: 'uppercase',
	color: 'accent.contrast',
};

const overlayCSS: CenterProps = {
	...commonCSS,
	bg: 'rgba(0,0,0,.5)',
	backdropFilter: 'blur(.5px)',
};

export default BuilderBgOverlay;
