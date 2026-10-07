import { ComponentType } from 'react';
import type { CellProps, ViewProps } from '../types';

// WO-10 populates the input facet from the existing V* components (no rewrites).
// The table/view facets are WO-13/WO-14's job — they extract the per-case cell
// and view rendering that today lives inside TableData.tsx's and
// renderViewItem.tsx's own switch statements into real per-type components.
// Until then every descriptor points at this shared placeholder so the registry
// stays honest about what's actually wired vs. still dispatched the old way.
export const NotYetImplementedCell: ComponentType<CellProps> = () => null;
export const NotYetImplementedView: ComponentType<ViewProps> = () => null;
