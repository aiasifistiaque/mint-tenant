'use client';

import { useParams } from 'next/navigation';
import RichTextEditorPage from '@/components/library/utils/RichTextEditorPage';

/** A record's rich-text field in the full-page editor — see RichTextEditorPage. */
const WritePage = () => {
	const { slug, id, field }: { slug: string; id: string; field: string } = useParams();
	return (
		<RichTextEditorPage
			slug={slug}
			id={id}
			field={decodeURIComponent(field)}
		/>
	);
};

export default WritePage;
