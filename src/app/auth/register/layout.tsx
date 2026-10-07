import type { Metadata } from 'next';

/** The tab's title on this page (the root layout adds "· MINT"). */
export const metadata: Metadata = { title: 'Create your account' };

export default function TitleLayout({ children }: { children: React.ReactNode }) {
	return children;
}
