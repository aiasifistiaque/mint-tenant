'use client';

import { FC, ReactNode } from 'react';
import { Box, Button, Flex, Grid, Text } from '@chakra-ui/react';
import type { MediaFile, MediaFolder } from '../../store/services/mediaApi';
import { MediaDialog } from './ui';
import { fileKind, formatBytes } from './utils';

type Usage = {
	size: number;
	count: number;
	folders: number;
	byType: { type: string; size: number; count: number }[];
	trash: { size: number; count: number };
};

const TYPE_NAME: Record<string, string> = { image: 'Images', video: 'Videos', document: 'Documents' };
const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString()} ${n === 1 ? one : many}`;

const Row: FC<{ label: string; children: ReactNode }> = ({ label, children }) => (
	<>
		<Text
			fontSize='sm'
			color='fg.muted'>
			{label}
		</Text>
		<Text
			fontSize='sm'
			textAlign='right'
			fontVariantNumeric='tabular-nums'>
			{children}
		</Text>
	</>
);

const Block: FC<{ title: string; children: ReactNode }> = ({ title, children }) => (
	<Box>
		<Text
			fontSize='xs'
			fontWeight='600'
			textTransform='uppercase'
			letterSpacing='0.04em'
			color='fg.muted'
			mb={2}>
			{title}
		</Text>
		<Grid
			templateColumns='1fr auto'
			columnGap={4}
			rowGap={1.5}>
			{children}
		</Grid>
	</Box>
);

/**
 * "View details" from the folder menu: what's in the folder on screen (its
 * sub-folders, files, their size and kinds) and, below, the whole library —
 * space used, counts, size by type and what's waiting in the trash.
 */
const DetailsDialog: FC<{
	isOpen: boolean;
	onClose: () => void;
	name: string;
	location: string;
	folders: MediaFolder[];
	files: MediaFile[];
	totalFiles: number;
	/** More files exist than are loaded, so sizes and kinds are a lower bound. */
	partial: boolean;
	usage?: Usage;
}> = ({ isOpen, onClose, name, location, folders, files, totalFiles, partial, usage }) => {
	const size = files.reduce((n, f) => n + (f.size || 0), 0);
	const kinds = files.reduce<Record<string, number>>((acc, f) => {
		const k = fileKind(f);
		const key = k === 'image' ? 'Images' : k === 'video' ? 'Videos' : 'Documents & other';
		acc[key] = (acc[key] || 0) + 1;
		return acc;
	}, {});
	const inside = folders.reduce((n, f) => n + (f.fileCount || 0), 0);

	return (
		<MediaDialog
			isOpen={isOpen}
			onClose={onClose}
			title={name}
			doc='what'
			size='sm'
			footer={
				<Button
					size='sm'
					px={3}
					variant='outline'
					onClick={onClose}>
					Close
				</Button>
			}>
			<Flex
				direction='column'
				gap={5}>
				<Block title='This folder'>
					<Row label='Location'>{location}</Row>
					<Row label='Folders'>{plural(folders.length, 'folder')}</Row>
					<Row label='Files'>{plural(totalFiles, 'file')}</Row>
					{Object.entries(kinds).map(([k, n]) => (
						<Row
							key={k}
							label={`· ${k}`}>
							{n.toLocaleString()}
						</Row>
					))}
					<Row label='Size of files'>
						{partial ? 'At least ' : ''}
						{formatBytes(size)}
					</Row>
					{inside > 0 && <Row label='Files in its folders'>{plural(inside, 'file')}</Row>}
				</Block>

				{usage && (
					<Block title='Whole library'>
						<Row label='Space used'>{formatBytes(usage.size)}</Row>
						<Row label='Files'>{plural(usage.count, 'file')}</Row>
						<Row label='Folders'>{plural(usage.folders, 'folder')}</Row>
						{usage.byType.map(t => (
							<Row
								key={t.type}
								label={`· ${TYPE_NAME[t.type] || 'Other'}`}>
								{plural(t.count, 'file')} · {formatBytes(t.size)}
							</Row>
						))}
						<Row label='In the trash'>
							{usage.trash.count ? `${plural(usage.trash.count, 'item')} · ${formatBytes(usage.trash.size)}` : 'Empty'}
						</Row>
					</Block>
				)}
			</Flex>
		</MediaDialog>
	);
};

export default DetailsDialog;
