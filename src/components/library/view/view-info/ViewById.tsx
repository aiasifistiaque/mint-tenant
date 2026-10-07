import { FC } from 'react';

import { ViewModalDataModelProps, ViewItem } from '../..';
import { getValue, convertToViewFields, useGetByIdQuery, shadow, radius } from '../..';
import { Flex, FlexProps, Heading } from '@chakra-ui/react';

type ViewByIdProps = FlexProps & {
	path: string;
	id: string;
	schema: any;
	heading?: string;
};

const ViewById: FC<ViewByIdProps> = ({ path, id, schema, heading, ...props }) => {
	const viewFields = convertToViewFields({ schema: schema });
	const { data, isFetching, isError } = useGetByIdQuery(
		{
			path: path,
			id: id,
		},
		{ skip: !id || !path }
	);

	return (
		<Flex
			{...containerCss}
			pt={heading ? 0 : 4}
			{...props}>
			{heading && (
				<Flex {...headingCss}>
					<Heading size='sm'>{heading}</Heading>
				</Flex>
			)}
			{viewFields.map((item: ViewModalDataModelProps, i: number) => {
				const { title, dataKey, type, colorPalette, path } = item;
				return (
					<ViewItem
						isLoading={isFetching}
						title={title}
						type={type}
						colorPalette={colorPalette}
						path={path}
						field={item}
						doc={data}
						key={i}>
						{data && getValue({ dataKey, type, data })}
					</ViewItem>
				);
			})}
		</Flex>
	);
};

const headingCss: FlexProps = {
	px: 6,
	py: 3,
	bg: 'background.light',
	borderTopRadius: radius.CONTAINER,
	borderColor: 'container.borderLight',
	borderBottomWidth: 1,
	_dark: {
		bg: 'menu.dark',
		borderColor: 'border.dark',
	},
};

const containerCss: FlexProps = {
	w: 'full',
	flexDirection: 'column',
	bg: 'container.newLight',
	borderColor: 'container.borderLight',
	gap: 4,
	// pt: 4,
	pb: 2,
	shadow: shadow.DASH,
	_dark: {
		bg: 'menu.dark',
		borderColor: 'container.borderDark',
	},
	borderRadius: radius.CONTAINER,
	borderWidth: 1,
};

export default ViewById;
