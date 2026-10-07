'use client';

import React from 'react';
import { NextPage } from 'next';
import {
	convertToViewFields,
	BackendTableObjectProps,
	BackendPageTable,
} from '@/components/library';
import { projectSchema as schema } from '@/models';
import { fields, formFields, tableFields } from './config';
import { Layout } from '@/components/library';
import { IS_TENANT_PANEL } from '@/components/library/config/lib/constants/panel';
import ProjectsBoard from '@/components/library/tenant/ProjectsBoard';

const table: BackendTableObjectProps = {
	title: 'Projects',
	path: 'projects',
	export: true,
	fields: tableFields,
	button: {
		title: 'New Project',
		isModal: true,
		layout: formFields,
	},
	menu: [
		{
			title: 'View',
			type: 'view-modal',
			dataModel: convertToViewFields({ schema, fields }),
		},
		{
			title: 'Edit',
			type: 'edit-modal',
			layout: formFields,
		},
		{
			title: 'Delete',
			type: 'delete',
		},
	],
};

const AdminProjectsPage: NextPage = () => {
	return <BackendPageTable table={table} />;
};

/** The tenant panel's /projects is the organization's projects, not this table. */
const ProjectsPage: NextPage = () =>
	IS_TENANT_PANEL ? (
		<Layout
			title='Projects'
			path='projects'>
			<ProjectsBoard />
		</Layout>
	) : (
		<AdminProjectsPage />
	);

export default ProjectsPage;
