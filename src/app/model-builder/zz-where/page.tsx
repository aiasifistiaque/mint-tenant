'use client';

import { useState } from 'react';
import { Box } from '@chakra-ui/react';
import ViewTabsEditor, { ViewTab } from '@/app/builder/_components/ViewTabsEditor';

if (typeof window !== 'undefined' && !(window as any).__zzMock) {
	(window as any).__zzMock = true;
	const real = window.fetch.bind(window);
	window.fetch = async (input: any, init?: any) => {
		const url = String(input?.url ?? input);
		const json = (b: any) => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
		if (/builder\/model\/Bill/.test(url))
			return json({ fields: [
				{ key: 'title', instance: 'String' },
				{ key: 'amount', instance: 'Number' },
				{ key: 'status', instance: 'String', enum: ['due', 'paid'] },
				{ key: 'paid', instance: 'Boolean' },
				{ key: 'dueOn', instance: 'Date' },
				{ key: 'client', instance: 'ObjectId', ref: 'Client' },
			] });
		if (/builder\/backlinks\//.test(url)) return json({ doc: [{ route: 'bills', model: 'Bill', fields: ['client'] }] });
		return real(input, init);
	};
}

export default function Page() {
	const [tabs, setTabs] = useState<ViewTab[]>([
		{ related: 'bills', foreignField: 'client', title: 'Due bills', columns: ['title', 'amount', 'status'], where: [{ field: 'status', op: 'is', value: 'due' }, { field: 'amount', op: 'gte', value: '100' }, { field: 'paid', op: 'is', value: 'false' }, { field: 'dueOn', op: 'lt', value: '2026-11-01' }, { field: 'title', op: 'empty' }] },
	]);
	return (
		<Box p={6} maxW='1000px' mx='auto'>
			<ViewTabsEditor tabs={tabs} onChange={setTabs} model='Client' modelFields={[{ key: 'name', instance: 'String' }]} routes={[{ route: 'clients', model: 'Client', title: 'Clients' }, { route: 'bills', model: 'Bill', title: 'Bills' }]} />
			<Box as='pre' id='zz-out' mt={4} fontSize='11px'>{JSON.stringify(tabs[0]?.where)}</Box>
		</Box>
	);
}
