'use client';

import { FC } from 'react';
import { Box, Text } from '@chakra-ui/react';
import type { ReportRun } from '@/components/library/store/services/tenantApi';

/** A report's rows (docs/panel-users RP-03): numbers right-aligned, dates as dates, the totals row in bold. */

const ISO = /^\d{4}-\d{2}-\d{2}T/;
export const cellText = (v: any, kind?: string): string => {
	if (v === null || v === undefined || v === '') return '';
	if (typeof v === 'number') return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
	if (typeof v === 'boolean') return v ? 'Yes' : 'No';
	if (typeof v === 'string' && ISO.test(v)) return new Date(v).toLocaleDateString(undefined, { dateStyle: 'medium', ...(kind === 'datetime' && { timeStyle: 'short' }) });
	if (Array.isArray(v)) return v.map(x => cellText(x)).join(', ');
	if (typeof v === 'object') return v.name || v.title || v.label || '';
	return String(v);
};

const ReportTable: FC<{ run: ReportRun }> = ({ run }) => {
	const numeric = run.columns.map((c, i) => c.kind === 'number' || run.rows.some(r => typeof r[i] === 'number'));
	if (!run.rows.length)
		return (
			<Text
				fontSize='13px'
				color='fg.muted'
				py={6}
				textAlign='center'>
				No records for these dates.
			</Text>
		);
	return (
		<Box
			borderWidth='1px'
			borderColor='border'
			borderRadius='md'
			overflow='auto'
			maxH='70vh'>
			<Box
				as='table'
				w='100%'
				fontSize='13px'
				css={{ borderCollapse: 'collapse', '& td, & th': { padding: '8px 12px', whiteSpace: 'nowrap' } }}>
				<thead>
					<Box
						as='tr'
						bg='bg.muted'
						position='sticky'
						top={0}>
						{run.columns.map((c, i) => (
							<Box
								as='th'
								key={c.key + i}
								fontWeight='600'
								textAlign={numeric[i] ? 'right' : 'left'}>
								{c.label}
							</Box>
						))}
					</Box>
				</thead>
				<tbody>
					{run.rows.map((r, ri) => (
						<Box
							as='tr'
							key={ri}
							borderTopWidth='1px'
							borderColor='border.muted'>
							{r.map((v, i) => (
								<Box
									as='td'
									key={i}
									textAlign={numeric[i] ? 'right' : 'left'}
									css={numeric[i] ? { fontVariantNumeric: 'tabular-nums' } : undefined}>
									{cellText(v, run.columns[i]?.kind)}
								</Box>
							))}
						</Box>
					))}
					{run.footer && (
						<Box
							as='tr'
							borderTopWidth='2px'
							borderColor='border'
							fontWeight='600'
							bg='bg.subtle'>
							{run.footer.map((v, i) => (
								<Box
									as='td'
									key={i}
									textAlign={numeric[i] ? 'right' : 'left'}
									css={numeric[i] ? { fontVariantNumeric: 'tabular-nums' } : undefined}>
									{cellText(v, run.columns[i]?.kind)}
								</Box>
							))}
						</Box>
					)}
				</tbody>
			</Box>
		</Box>
	);
};

export default ReportTable;
