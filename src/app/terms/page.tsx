'use client';

import NextLink from 'next/link';
import { Link, Text } from '@chakra-ui/react';
import SiteShell, { Clause } from '../_site/SiteShell';
import { docsPath } from '@/components/library/config/lib/constants/panel';

/**
 * Terms of Use for the MINT admin. Public. A plain-language starting point —
 * have it reviewed before relying on it, and add the governing law and
 * company details that apply.
 */

const P = ({ children }: { children: React.ReactNode }) => <Text>{children}</Text>;

const TermsPage = () => (
	<SiteShell
		title='Terms of Use'
		lead='The rules for using the MINT admin panel, provided by ThinkCrypt. By signing in, you agree to them.'
		updated='1 October 2026'>
		<Clause
			id='agreement'
			title='1. Agreement'>
			<P>
				These terms apply to everyone who signs in to the MINT admin panel (the “admin”) — the tools for running a
				store: its products, orders, customers, content, and the pages and dashboards built on them. If you use the
				admin on behalf of a business, you agree to these terms for that business too.
			</P>
		</Clause>

		<Clause
			id='accounts'
			title='2. Your account'>
			<ul>
				<li>Accounts are created by an administrator of your organisation. You may only use your own account.</li>
				<li>
					Keep your password private, and turn on two-factor sign-in (a passkey or email codes) — see{' '}
					<Link asChild>
						<NextLink href={docsPath('/docs/two-factor')}>Sign-in &amp; security</NextLink>
					</Link>
					.
				</li>
				<li>
					You’re responsible for what is done with your account. If you think someone else has used it, sign out
					its other sessions from Settings and tell your administrator at once.
				</li>
				<li>What you can see and change is set by your role. Don’t try to reach data or tools your role doesn’t allow.</li>
			</ul>
		</Clause>

		<Clause
			id='acceptable-use'
			title='3. Acceptable use'>
			<P>When using the admin, don’t:</P>
			<ul>
				<li>upload anything unlawful, harmful or that you don’t have the right to use;</li>
				<li>enter other people’s personal data without a lawful reason to process it;</li>
				<li>try to break, overload, probe or get around the admin’s security or access controls;</li>
				<li>use it to send spam or to mislead customers;</li>
				<li>copy, resell or reverse-engineer the admin, except where the law allows.</li>
			</ul>
		</Clause>

		<Clause
			id='your-content'
			title='4. Your content and data'>
			<P>
				The records, files and images you add stay yours (or your organisation’s). You let us store, process and
				display them only as needed to run the admin for you. You’re responsible for having the right to use what you
				upload, and for keeping your own copies of anything important — use the export tools where you need them.
			</P>
			<P>
				How personal data is handled is described in the{' '}
				<Link asChild>
					<NextLink href='/privacy-policy'>Privacy Policy</NextLink>
				</Link>
				.
			</P>
		</Clause>

		<Clause
			id='builders-and-ai'
			title='5. Builders and AI features'>
			<P>
				The route, sidebar and dashboard builders change how the admin works for everyone in your organisation.
				Publish changes with care. Features that use AI suggest configurations; review what they suggest before you
				build or publish it.
			</P>
		</Clause>

		<Clause
			id='availability'
			title='6. Availability and changes'>
			<P>
				We work to keep the admin available and your data safe, but it’s provided “as is”, and there may be
				maintenance, outages or changes. Current status is on the{' '}
				<Link asChild>
					<NextLink href='/system-status'>System Status</NextLink>
				</Link>{' '}
				page. We may add, change or remove features; where a change removes something you rely on, we’ll aim to tell
				you first.
			</P>
		</Clause>

		<Clause
			id='suspension'
			title='7. Suspension and ending access'>
			<P>
				Your administrator can deactivate your account at any time. We may suspend access that breaks these terms or
				puts the admin, its data or other users at risk.
			</P>
		</Clause>

		<Clause
			id='liability'
			title='8. Liability'>
			<P>
				To the extent the law allows, ThinkCrypt isn’t liable for indirect or consequential losses — such as lost
				profits or data — arising from use of the admin. Nothing in these terms limits liability that can’t be limited
				by law.
			</P>
		</Clause>

		<Clause
			id='changes'
			title='9. Changes to these terms'>
			<P>
				We may update these terms. The date at the top shows the latest version; continuing to use the admin after a
				change means you accept it.
			</P>
		</Clause>

		<Clause
			id='contact'
			title='10. Questions and problems'>
			<P>
				For questions about these terms, or to report a problem, use{' '}
				<Link asChild>
					<NextLink href='/report-issue'>Report an issue</NextLink>
				</Link>{' '}
				or contact your organisation’s administrator.
			</P>
		</Clause>
	</SiteShell>
);

export default TermsPage;
