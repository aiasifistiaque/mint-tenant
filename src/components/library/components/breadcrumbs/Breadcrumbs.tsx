import { FC, Fragment } from 'react';
import { Breadcrumb } from '@chakra-ui/react';
import Link from 'next/link';

type BreadcrumbsProps = {
	data: {
		href: string;
		title: string;
	}[];
};

const Breadcrumbs: FC<BreadcrumbsProps> = ({ data }) => {
	return (
		<Breadcrumb.Root>
			<Breadcrumb.List>
				{data?.map((item: any, i: number) => {
					const isLast = i === data.length - 1;

					return (
						// A real `Fragment` with the key on it. The key used to sit on the
						// `Breadcrumb.Item` inside a shorthand `<>`, but the fragment is
						// the array element here, and `<>` cannot take a key — so as far
						// as React was concerned these children had none.
						<Fragment key={item?.href ?? i}>
							<Breadcrumb.Item
								{...crumbCss}
								// The last crumb is the page you are already on. `_last`
								// below is what styles it; this is the half screen readers
								// need. It replaces `isCurrentPage`, a Chakra v2 prop that
								// v3's Item does not have — typed as plain `li` props, it
								// went straight through to the DOM.
								aria-current={isLast ? 'page' : undefined}>
								<Link href={item?.href}>{item?.title}</Link>
							</Breadcrumb.Item>
							{!isLast && (
								<Breadcrumb.Separator
									color='heading.lightMuted'
									_dark={{ color: 'heading.darkMuted' }}>
									/
								</Breadcrumb.Separator>
							)}
						</Fragment>
					);
				})}
			</Breadcrumb.List>
		</Breadcrumb.Root>
	);
};

const crumbCss: any = {
	fontSize: '14px',
	fontWeight: '400',
	color: 'heading.lightMuted',
	_dark: {
		color: 'heading.darkMuted',
	},
	textTransform: 'capitalize',
	_last: { fontWeight: '500' },
};

export default Breadcrumbs;
