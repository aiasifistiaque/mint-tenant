'use client';
import { use } from 'react';
import { MediaManager } from '@/components/library/pages/media';

const MediaFolderPage = ({ params }: { params: Promise<{ id: string }> }) => {
	const { id } = use(params);
	return <MediaManager folder={id} />;
};

export default MediaFolderPage;
