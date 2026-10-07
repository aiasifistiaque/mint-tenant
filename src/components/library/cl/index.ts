/**
 * `cl` — the console library: the shared shell that both the Heroku and the
 * Vercel pages are assembled from.
 *
 * These started life under `app/herokus/_components/` because that is where
 * they were needed first. Nothing about them is Heroku-specific, and a second
 * console copying them would have produced two tables that drift apart within a
 * release — so they live here and `app/herokus/_components/index.ts` is now a
 * re-export shim, the same pattern `StatTile` already uses.
 *
 * **Deliberately not added to `components/library/index.tsx`.** The root barrel
 * already exports a `FilterInput` (the model-table filter input) and a
 * `TableSkeleton`, and re-exporting these under the same names would be a
 * compile error at best and the wrong component at worst. Import from
 * `@/components/library/cl` instead — which also makes it obvious at the
 * import site that a component belongs to the provider consoles rather than to
 * the generic model pages.
 */

export { default as Panel } from './Panel';
export { default as ConsoleTabs } from './ConsoleTabs';
export type { ConsoleTab } from './ConsoleTabs';
export { default as DetailRow } from './DetailRow';
export { date, dateTime, when, bytes, envFileBody } from './format';
export { default as StatusDot, toneFor } from './StatusDot';
export type { StatusTone } from './StatusDot';
export { default as DataTable } from './DataTable';
export type { Column, SortDir } from './DataTable';
export { default as FilterInput } from './FilterInput';
export { default as Dropdown } from './Dropdown';
export type { DropdownItem, DropdownProps } from './Dropdown';
export { default as ConfirmAction } from './ConfirmAction';
export { default as CopyValue } from './CopyValue';
export { default as PageHeader } from './PageHeader';
export { default as Crumbs } from './Crumbs';
export { EmptyState, ErrorState, TableSkeleton, DetailSkeleton } from './States';
export { default as ResourceSection } from './ResourceSection';

// Re-exported so a console page has one import rather than two. The definition
// lives in `../stat` because the dashboard renders the same tile.
export { StatTile } from '../stat';
