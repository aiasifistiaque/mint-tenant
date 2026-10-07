'use client';

import NextLink from 'next/link';
import { Link, Text } from '@chakra-ui/react';
import SiteShell, { Clause } from '../_site/SiteShell';

/**
 * Privacy Policy for the MINT admin. Public. Describes what the admin itself
 * stores (accounts, sign-in sessions, uploads, history, reports) — keep it in
 * step when that changes, and have it reviewed; add the data controller's
 * details and any legal basis your jurisdiction requires.
 */

const P = ({ children }: { children: React.ReactNode }) => <Text>{children}</Text>;

const PrivacyPage = () => (
	<SiteShell
		title='Privacy Policy'
		lead='What the MINT admin panel collects about the people who use it, why, and the choices you have. Provided by ThinkCrypt.'
		updated='1 October 2026'>
		<Clause
			id='scope'
			title='1. What this covers'>
			<P>
				This policy covers the admin panel and the people who sign in to it. The store data you manage there — your
				customers, orders and so on — is handled on your organisation’s behalf and under its own privacy notices.
			</P>
		</Clause>

		<Clause
			id='collect'
			title='2. What we collect'>
			<ul>
				<li>
					<strong>Your account:</strong> name, email, and the details your administrator adds (such as phone and
					role).
				</li>
				<li>
					<strong>Sign-in and security:</strong> your password (stored only as a hash), your two-factor settings and
					passkeys, and for each signed-in device its browser, operating system, IP address, approximate location,
					sign-in time and last activity — so you can see and end your sessions.
				</li>
				<li>
					<strong>What you do in the admin:</strong> the records you create and change, a history of those changes,
					and actions on connected services (such as deploys).
				</li>
				<li>
					<strong>Files you upload:</strong> images and files, kept in cloud storage.
				</li>
				<li>
					<strong>Issues you report:</strong> the title, description and screenshots you send.
				</li>
			</ul>
		</Clause>

		<Clause
			id='use'
			title='3. How we use it'>
			<ul>
				<li>to sign you in, keep your account secure and show you your signed-in devices;</li>
				<li>to run the admin — showing, saving and exporting your organisation’s data;</li>
				<li>to send the emails you ask for or need, such as sign-in codes and assignment notices;</li>
				<li>to fix problems you report and keep the service reliable.</li>
			</ul>
			<P>We don’t sell your data or use it for advertising.</P>
		</Clause>

		<Clause
			id='browser'
			title='4. Your browser'>
			<P>
				The admin keeps a few things in your browser’s local storage: your sign-in token, your colour theme, and
				preferences like which sidebar sections are folded. They’re needed for the admin to work. There are no
				advertising or third-party tracking cookies.
			</P>
		</Clause>

		<Clause
			id='sharing'
			title='5. Who else handles it'>
			<P>Only the service providers the admin runs on, each for its own part:</P>
			<ul>
				<li>hosting and database providers, which store the admin’s data;</li>
				<li>cloud storage, for uploaded files;</li>
				<li>an email provider, for the emails above;</li>
				<li>
					an AI provider, only when you use an AI feature (such as “Build with AI”) — the description you type and
					the relevant model settings are sent to it.
				</li>
			</ul>
			<P>We may also share data where the law requires it.</P>
		</Clause>

		<Clause
			id='retention'
			title='6. How long we keep it'>
			<P>
				Account data is kept while your account exists. Signed-out sessions are kept for a while as a security record.
				Records and files stay until they’re deleted by someone with permission to; a deleted record can be restored
				for 30 days, then it’s gone.
			</P>
		</Clause>

		<Clause
			id='security'
			title='7. Security'>
			<P>
				Passwords are hashed; two-factor sign-in, passkeys and signing out other devices are available to every user;
				and access to each part of the admin is limited by role. No system is perfectly secure — if you notice
				something wrong, report it straight away.
			</P>
		</Clause>

		<Clause
			id='choices'
			title='8. Your choices'>
			<ul>
				<li>See and end your signed-in sessions, and manage two-factor sign-in, in Settings → Sign-in &amp; security.</li>
				<li>Ask your administrator to correct your details, or to remove your account.</li>
				<li>Depending on where you live, you may have further rights over your data; ask us to use them.</li>
			</ul>
		</Clause>

		<Clause
			id='changes'
			title='9. Changes'>
			<P>We’ll update this page when what we collect or how we use it changes; the date at the top shows the latest version.</P>
		</Clause>

		<Clause
			id='contact'
			title='10. Contact'>
			<P>
				Questions or requests about your data:{' '}
				<Link asChild>
					<NextLink href='/report-issue'>report an issue</NextLink>
				</Link>{' '}
				or contact your organisation’s administrator. See also the{' '}
				<Link asChild>
					<NextLink href='/terms'>Terms of Use</NextLink>
				</Link>
				.
			</P>
		</Clause>
	</SiteShell>
);

export default PrivacyPage;
