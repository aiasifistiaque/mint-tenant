'use client';

import { FC, Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Text } from '@chakra-ui/react';
import { LoginContainer } from '@/components/library';
import { BACKEND, rememberProject } from '@/components/library/config/lib/constants/panel';
import { TOKEN_NAME } from '@/components/library/config/lib/constants/constants';

/**
 * Opens a template preview (tenant panel, docs/templates T-04). Template
 * Studio's "Open preview" link carries a single-use, 5-minute ticket; it's
 * exchanged here for a session in the template sandbox, and the preview
 * project opens. Not under /auth: that area sends anyone already signed in
 * home before the ticket could be used.
 */
const OpenPreview: FC = () => {
	const ticket = useSearchParams().get('ticket') || '';
	const [error, setError] = useState('');

	useEffect(() => {
		if (!ticket) return setError('This link has no preview ticket. Open the preview again from Template Studio.');
		let cancelled = false;
		(async () => {
			try {
				const res = await fetch(`${BACKEND}/auth/preview`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ticket }) });
				const body = await res.json().catch(() => ({}));
				if (cancelled) return;
				if (!res.ok || !body?.token) return setError(body?.message || 'This preview couldn’t be opened.');
				localStorage.setItem(TOKEN_NAME, body.token);
				rememberProject(body.project.publicSlug);
				window.location.replace(`/${body.project.publicSlug}`);
			} catch {
				if (!cancelled) setError('The server couldn’t be reached. Try again in a moment.');
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [ticket]);

	return (
		<LoginContainer
			title={error ? 'This preview didn’t open' : 'Opening the preview…'}
			hideSubmit
			isLoading={!error}
			handleSubmit={(e: any) => e.preventDefault()}>
			<Text
				fontSize='sm'
				color='fg.muted'
				textAlign='center'>
				{error ||
					'You’re signing in to a throwaway copy of the template. Everything in it is deleted after 6 hours, and nothing reaches a real customer.'}
			</Text>
		</LoginContainer>
	);
};

const PreviewPage = () => (
	<Suspense fallback={null}>
		<OpenPreview />
	</Suspense>
);

export default PreviewPage;
