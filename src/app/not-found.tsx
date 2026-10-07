import { Layout, NoDataFound } from '@/components/library';
import React from 'react';

const NotFoundPage = () => {
	return (
		<Layout title='404'>
			<NoDataFound title='404! Page Not Found'>
				Your Requested page could not be found, please refresh this page or go back home
			</NoDataFound>
		</Layout>
	);
};

export default NotFoundPage;
