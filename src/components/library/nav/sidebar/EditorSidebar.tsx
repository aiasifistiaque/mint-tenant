'use client';
import { FlexProps, Heading, Stack, Flex } from '@chakra-ui/react';
import { ReactNode, FC } from 'react';
import { useColorMode } from '@/components/ui/color-mode';
import SidebarItem from './SidebarItem';

import { sidebarData, THEME, Icon, DecisionAlert, EditContentModal, sizes, styles } from '../..';

import { SidebarContent, SidebarHeading } from './sidebar-components';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const EditorSidebar: FC<FlexProps & { closeBtn?: ReactNode; data?: any; doc?: any }> = ({
	closeBtn,
	data,
	doc,
	...props
}) => {
	const router = useRouter();
	const { colorMode } = useColorMode();

	const sidebar = data || sidebarData;
	const textColor = colorMode === 'light' ? 'text.dark' : 'text.light';

	const handleExit = () => router.replace('/storefront');

	const decisionModal = (
		<DecisionAlert
			handler={handleExit}
			prompt={{
				title: 'Exit Editor',
				body: 'Are you sure you want to exit the editor?',
				btnText: 'Exit',
			}}>
			<Flex
				cursor='pointer'
				align='center'
				gap={2}>
				<Icon
					name='arrow-left'
					color='inherit'
					size={20}
				/>

				<Heading
					color={THEME == 'basic' ? 'inherit' : 'text.dark'}
					size='md'
					fontFamily='inherit'
					fontSize='12px'
					fontWeight='300'
					letterSpacing='0.16em'
					textTransform='uppercase'>
					Exit Editor
				</Heading>
			</Flex>
		</DecisionAlert>
	);

	const main = (
		<>
			<Flex
				flexDir='column'
				pr={sizes.SIDEBAR_PX}
				pb={8}
				// pt={padding.BODY_TOP}
				overflowY='scroll'
				zIndex={9999}
				bg='container.light'
				_dark={{ bg: 'container.dark' }}>
				{sidebar.map((item: any, i: number) => (
					<Stack
						key={i}
						bg='inherit'>
						<SidebarHeading show={item?.startOfSection}>{item?.sectionTitle}</SidebarHeading>
						{item?.type == 'page' ? (
							<Link href={item?.href}>
								<SidebarItem
									href={item?.href}
									path={item?.path}
									icon={item?.icon}>
									{item?.title}
								</SidebarItem>
							</Link>
						) : item?.type == 'component' ? (
							<EditContentModal
								cursor='pointer'
								dataModel={item?.dataModel}
								data={doc[item?.dataPath]}
								contentType={item?.dataPath}
								title={item?.title}
								path={item?.path}>
								<SidebarItem
									path={item?.path}
									icon={item?.icon}>
									{item?.title}
								</SidebarItem>
							</EditContentModal>
						) : null}
					</Stack>
				))}
			</Flex>
		</>
	);

	return (
		<Flex {...containerCss}>
			<SidebarContent
				bg='container.light'
				_dark={{
					bg: 'container.dark',
				}}>
				<Flex {...logoContainer}>
					{decisionModal}
					{closeBtn && closeBtn}
				</Flex>
				{main}
			</SidebarContent>
		</Flex>
	);
};

const logoContainer = {
	w: sizes.SIDEBAR_WIDTH,
	// h: sizes.NAV_HEIGHT,
	// bg: 'container.light',
	// borderBottomWidth: 1,
	// borderBottomColor: 'stroke.light',
	// zIndex: 999,
	// _dark: {
	// 	bg: 'container.dark',
	// 	borderBottomColor: 'stroke.dark',
	// },
	...styles.NAVBAR,
};

const containerCss: FlexProps = {
	position: 'fixed',
	overflow: 'none',
	left: 0,
	w: sizes.SIDEBAR_WIDTH,
	minW: sizes.SIDEBAR_WIDTH,
	borderRightWidth: 0,
	borderRightColor: 'stroke.light',
	flexDir: 'column',
	_dark: {
		borderRightColor: 'stroke.dark',
	},
};

export default EditorSidebar;
