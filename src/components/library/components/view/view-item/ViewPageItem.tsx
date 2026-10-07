import { FC, useEffect } from 'react';
import { Flex, Heading, Tooltip, useClipboard } from '@chakra-ui/react';
import { Column, Icon } from '../../..';
import { renderViewItem as renderContent } from '..';
import { SkeletonContent, ViewItemProps } from './utils';

const ViewPageItem: FC<ViewItemProps> = ({
	title,
	type,
	children,
	colorPalette,
	originalType,
	path,
	copy,
	idKey,
	id,
	isLoading = false,
	...props
}) => {
	const { copy: onCopy, value, setValue, copied: hasCopied } = useClipboard();

	useEffect(() => {
		if (children && copy) {
			setValue(children.toString());
		}
	}, [children]);

	return (
		<Column
			{...props}
			px={{ base: 4, md: 6 }}
			// borderBottom='1px solid'
			// borderColor={{
			// 	_light: 'border.light',
			// 	_dark: 'border.dark',
			// }}
			pb={4}>
			<SkeletonContent isLoading={isLoading}>
				<Heading
					size='sm'
					color='heading.lightMuted'
					_dark={{
						color: 'heading.darkMuted',
					}}>
					{title}:
				</Heading>
			</SkeletonContent>
			<SkeletonContent isLoading={isLoading}>
				<Flex
					gap={2}
					align='center'>
					{!isLoading &&
						children &&
						renderContent({ type, children, colorPalette, path, isLoading, originalType, id })}
					{copy && children && children != 'n/a' && (
						<Tooltip.Root
							lazyMount
							openDelay={200}
							closeDelay={100}
							positioning={{ placement: 'top' }}>
							<Tooltip.Trigger asChild>
								<Flex
									onClick={onCopy}
									cursor='pointer'>
									<Icon name='copy' />
								</Flex>
							</Tooltip.Trigger>
							<Tooltip.Positioner>
								<Tooltip.Content>{hasCopied ? 'Copied!' : 'Copy'}</Tooltip.Content>
							</Tooltip.Positioner>
						</Tooltip.Root>
					)}
				</Flex>
			</SkeletonContent>
		</Column>
	);
};

export default ViewPageItem;
