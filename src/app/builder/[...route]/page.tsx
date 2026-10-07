'use client';
import { useParams } from 'next/navigation';
import RouteEditor from '../_components/RouteEditor';

// Catch-all because a route key can itself contain slashes
// ('adjustments/damages'), and each segment arrives separately.
const Page = () => {
	const { route }: { route: string[] } = useParams() as any;

	return <RouteEditor route={(route || []).map(decodeURIComponent).join('/')} />;
};

export default Page;
