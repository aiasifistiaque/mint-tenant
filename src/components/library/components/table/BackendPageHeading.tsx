import { Flex, FlexProps, Heading, Button, Text } from '@chakra-ui/react';
import Link from 'next/link';
import { FC } from 'react';

// import { BackendCreateModal, createFormFields, Icon } from '../..';
import ExportModal from '../modals/export/ExportModal';
import { buttonGroupCss, containerCss, headingCss, subHeadingCss, wrapperCss } from './style';
import { BackendCreateModal } from '../../modals';
import { createFormFields } from '../../model';
import { Icon } from '../../icon';

type PageHeadingProps = FlexProps & {
	title: string;
	button?: string;
	href?: string;
	isModal?: boolean;
	path: string;
	data?: any;
	export?: boolean;
	table: any;
	layout: any;
	schema: any;
};

const BackendPageHeading: FC<PageHeadingProps> = ({
	title,
	href,
	button,
	isModal = false,
	path,
	table,
	data,
	schema,
	layout,
	export: exportData,
	...props
}) => {
	const btn = (
		<Button size='sm'>
			<Icon
				size={18}
				name='add'
			/>
			{button}
		</Button>
	);

	const formFields = createFormFields({ schema, layout });

	const exportButton = <ExportModal path={path} />;
	const renderButton = () => {
		if (isModal)
			return (
				<BackendCreateModal
					trigger={btn}
					type='post'
					path={path}
					data={formFields}
					invalidate={table?.invalidate}
					prompt={table?.button?.prompt}
				/>
			);
		else if (href) return <Link href={href}>{btn}</Link>;
		else return btn;
	};

	return (
		<Flex
			{...wrapperCss}
			{...props}>
			<Flex {...containerCss}>
				<Heading {...headingCss}>{title}</Heading>

				<Flex {...buttonGroupCss}>
					<>{Boolean(exportData) && exportButton}</>
					<>{(Boolean(button) || isModal) && renderButton()}</>
				</Flex>
			</Flex>
			{table?.subTitle && <Text {...subHeadingCss}>{table?.subTitle}</Text>}
		</Flex>
	);
};

export default BackendPageHeading;
