import { Flex, FlexProps, Heading, Button } from '@chakra-ui/react';
import Link from 'next/link';
import { FC } from 'react';
import { CreateModal } from '../..';
import ExportModal from '../modals/export/ExportModal';
import { buttonGroupCss, headingCss } from './style';

type PageHeadingProps = FlexProps & {
	title: string;
	path: string;
	invalidate?: any;
	button?: string;
	href?: string;
	isModal?: boolean;
	data?: any;
	id?: string;
	export?: boolean;
	type?: 'post' | 'update';
};

const SimplePageHeading: FC<PageHeadingProps> = ({
	title,
	href,
	button,
	isModal = false,
	path,
	data,
	id,
	invalidate,
	type = 'post',
	export: exportData,
	...props
}) => {
	const btn = <Button size='sm'>{button}</Button>;
	const exportButton = <ExportModal path={path} />;
	const toButton = isModal ? (
		<CreateModal
			id={id}
			trigger={btn}
			type={type}
			path={path}
			data={data}
			invalidate={invalidate}
		/>
	) : href ? (
		<Link href={href}>{btn}</Link>
	) : (
		btn
	);

	return (
		<Flex
			justify='space-between'
			{...props}
			align='center'>
			<Heading {...headingCss}>{title}</Heading>
			<Flex {...buttonGroupCss}>
				<>{Boolean(exportData) && exportButton}</>
				<>{(Boolean(button) || isModal) && toButton}</>
			</Flex>
		</Flex>
	);
};

export default SimplePageHeading;
