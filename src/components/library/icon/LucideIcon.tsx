'use client';

import { FC, memo } from 'react';
import { DynamicIcon } from 'lucide-react/dynamic';
import iconColor from './iconColor';

type IconProps = {
	size?: number;
	color?: string;
	name: string;
};

// Lucide sets `color` as the svg's stroke attribute, which can't read a CSS
// variable — so the stroke is `currentColor` and the colour goes on `style`,
// where a token resolves. No colour: the icon takes the text colour around it,
// which is what makes it follow the colour mode and the admin's theme.
const LucideIcon: FC<IconProps> = ({ name, color, size, ...props }) => (
	<DynamicIcon
		name={name as any}
		size={size}
		{...props}
		color='currentColor'
		style={{ color: iconColor(color) }}
	/>
);

export default memo(LucideIcon);
