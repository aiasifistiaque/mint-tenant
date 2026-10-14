/**
 * Where opening a notification goes: its own `href` — except an invitation
 * from before WO-50, which pointed at Home (/dashboard): those open the
 * Invitations page, where it can be accepted or declined.
 */
export const notificationHref = (n: { type?: string; href?: string }): string | undefined =>
	n.type === 'invitation' && !String(n.href || '').startsWith('/invitations') ? '/invitations' : n.href || undefined;
