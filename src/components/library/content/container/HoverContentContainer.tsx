import { FC, ReactNode, useState } from 'react';
import { Button, ButtonProps, Center, Flex, FlexProps } from '@chakra-ui/react';
import { BuilderBgOverlay, BuilderEditButton, EditContentModal, Icon } from '../..';

type ViewContentContainerType = FlexProps & {
	children: ReactNode;
	title?: string;
	dataModel: any;
	data: any;
	edit?: boolean;
	path?: string;
	type?: 'basic' | 'content';
	component?: boolean;
	section?: boolean;
	zIndex?: number;
};

const HoverContentContainer: FC<ViewContentContainerType> = ({
	title,
	children,
	dataModel,
	data,
	edit = true,
	path,
	component = false,
	section = false,
	type = 'content',
	zIndex = 900,
	...props
}) => {
	const [hover, setHover] = useState(false);
	const [isOpen, setIsOpen] = useState(false);

	const mouseEnter = (e: any) => {
		e.stopPropagation();
		setHover(true);
	};
	const mouseLeave = () => {
		if (isOpen) return;
		setHover(false);
	};

	return (
		<Container
			onMouseEnter={mouseEnter}
			onMouseLeave={mouseLeave}>
			<Body
				position='relative'
				{...props}>
				{edit && hover && (
					<EditContentModal
						setHover={setHover}
						setIsOpen={setIsOpen}
						path={path}
						data={data}
						contentType={type}
						dataModel={dataModel}>
						<BuilderBgOverlay
							section={section}
							title={title}
							component={component}
							zIndex={zIndex}>
							<BuilderEditButton
								section={section}
								hover={hover}>
								{section ? 'Edit Section' : 'Click to Edit'}
							</BuilderEditButton>
						</BuilderBgOverlay>
					</EditContentModal>
				)}
				{children}
			</Body>
		</Container>
	);
};

const Container = ({ children, ...props }: FlexProps & { children: ReactNode }) => {
	return (
		<Flex
			w='full'
			flexDir='column'
			{...props}>
			{children}
		</Flex>
	);
};

const Body = ({ children, ...props }: FlexProps & { children: ReactNode }) => (
	<Flex
		w='full'
		flexDir='column'
		{...props}>
		{children}
	</Flex>
);

export default HoverContentContainer;
