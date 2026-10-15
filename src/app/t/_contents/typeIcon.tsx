import {
	ChartNoAxesColumn,
	CircleHelp,
	FileText,
	Gem,
	Image,
	Images,
	LayoutGrid,
	List,
	LucideIcon,
	Megaphone,
	PanelBottom,
	PanelTop,
	PanelTopOpen,
	Puzzle,
	Quote,
	SquareDashed,
	Type,
	Video,
} from 'lucide-react';

/**
 * The built-in content types' icons (backend library/siteBuilder/contentTypes.ts),
 * by the Lucide name a type stores. A project's own type with another name
 * gets the component icon — the set isn't bundled whole.
 */
const ICONS: Record<string, LucideIcon> = {
	'panel-top': PanelTop,
	type: Type,
	'file-text': FileText,
	'layout-grid': LayoutGrid,
	'circle-help': CircleHelp,
	'chart-no-axes-column': ChartNoAxesColumn,
	quote: Quote,
	images: Images,
	video: Video,
	megaphone: Megaphone,
	gem: Gem,
	image: Image,
	list: List,
	'square-dashed': SquareDashed,
	'panel-top-open': PanelTopOpen,
	'panel-bottom': PanelBottom,
};

export const typeIcon = (name?: string | null): LucideIcon => (name && ICONS[name]) || Puzzle;
