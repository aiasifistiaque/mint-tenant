import { IconNameOptions } from '../../..';

export type SidebarItemType = {
	title: string;
	href: string;
	icon: IconNameOptions;
	path: string;
	startOfSection?: boolean;
	sectionTitle?: string;
	sectionIcon?: string;
};
