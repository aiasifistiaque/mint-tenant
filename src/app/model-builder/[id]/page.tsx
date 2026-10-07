'use client';

import { use } from 'react';
import ModelEditor from '../_components/ModelEditor';

const ModelPage = ({ params }: { params: Promise<{ id: string }> }) => {
	const { id } = use(params);
	return <ModelEditor id={id} />;
};

export default ModelPage;
