'use client';

import { useParams } from 'next/navigation';
import { BuilderPage } from '../../_components/ReportBuilder';
import { useGetSavedReportQuery } from '@/components/library/store/services/tenantApi';

/** Changing a report (docs/panel-users RP-03) — developers only. */
export default function EditReportPage() {
	const { id } = useParams() as { id: string };
	const { data, isLoading } = useGetSavedReportQuery(id);
	return (
		<BuilderPage
			report={data}
			loading={isLoading}
		/>
	);
}
