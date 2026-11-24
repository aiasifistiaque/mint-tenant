'use client';

import { ComponentType } from 'react';
import dynamic from 'next/dynamic';

/**
 * Sidebar items that open a dialog instead of a page, by the item's `path`
 * (backend tenantNav). SidebarItem opens the dialog in place; the href stays
 * a real page too, for the ⌘K search and links. Loaded only when opened.
 */
export const SIDEBAR_MODALS: Partial<Record<string, ComponentType<{ open: boolean; onClose: () => void }>>> = {
	'panel-theme': dynamic(() => import('../../tenant/PanelThemeDialog'), { ssr: false }),
};
