'use client';

import { FC, useEffect, useRef, useState } from 'react';
import { Box } from '@chakra-ui/react';
import PdfPage from '@/components/library/pdf/PdfPage';
import { sampleScope } from '@/components/library/pdf/scope';
import { PdfTemplate, pageSize } from '@/components/library/pdf/types';
import { viewerZone } from '@/components/library';

/**
 * A template's first page, small — drawn in HTML like the designer draws it,
 * with its sample data (a starter) or its fields as chips (one of yours,
 * which has no sample). Scaled to the card's width.
 */
const Thumb: FC<{ template: PdfTemplate; settings?: any; height?: number }> = ({ template, settings, height = 240 }) => {
	const ref = useRef<HTMLDivElement>(null);
	const [width, setWidth] = useState(0);
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const ro = new ResizeObserver(() => setWidth(el.clientWidth));
		ro.observe(el);
		setWidth(el.clientWidth);
		return () => ro.disconnect();
	}, []);
	const [w] = pageSize(template);
	// A page is w pt wide = w × 4/3 px at zoom 1.
	const scale = width ? width / ((w * 4) / 3) : 0.3;
	const hasSample = !!template.sample && Object.keys(template.sample).length > 0;
	return (
		<Box
			ref={ref}
			h={`${height}px`}
			overflow='hidden'
			bg='white'
			borderBottomWidth='1px'
			borderColor='border'
			pointerEvents='none'
			aria-hidden>
			{width > 0 && (
				<PdfPage
					template={template}
					scope={sampleScope(template, settings, viewerZone())}
					mode={hasSample ? 'values' : 'fields'}
					scale={scale}
					clip
				/>
			)}
		</Box>
	);
};

export default Thumb;
