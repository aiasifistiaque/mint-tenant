import { VImage, VImageArray, VVideo, VIcon, VFile, VFiles } from '@/components/library/utils/inputs';
import { registerFieldType } from '../registry';
import { NotYetImplementedCell, NotYetImplementedView } from './_shared';

const ImageInput = ({ item, isRequired, ...props }: any) => (
	<VImage
		folder={item?.folder}
		isRequired={isRequired}
		onChange={(props as any).onChange}
		helper={item?.helper}
		style={item?.style}
		{...props}
	/>
);

const NestedImageInput = ({ item, isRequired, ...props }: any) => (
	<VImage
		isRequired={isRequired}
		onChange={(props as any).onChange}
		helper={item?.helper}
		{...props}
	/>
);

const VideoInput = ({ item, isRequired, ...props }: any) => (
	<VVideo
		isRequired={isRequired}
		onChange={(props as any).onChange}
		helper={item?.helper}
		{...props}
	/>
);

const IconInput = ({ item, isRequired, ...props }: any) => (
	<VIcon
		isRequired={isRequired}
		onChange={(props as any).onChange}
		helper={item?.helper}
		{...props}
	/>
);

const ImageArrayInput = ({ item, isRequired, ...props }: any) => (
	<VImageArray
		folder={item?.folder}
		limit={item?.limit}
		isRequired={isRequired}
		onChange={(props as any).onChange}
		helper={item?.helper}
		{...props}
	/>
);

const FileInput = ({ item, isRequired, type, ...props }: any) => (
	<VFile
		type={type}
		isRequired={isRequired}
		helper={item?.helper}
		{...props}
	/>
);

const FileArrayInput = ({ item, isRequired, ...props }: any) => (
	<VFiles
		folder={item?.folder}
		limit={item?.limit}
		isRequired={isRequired}
		onChange={(props as any).onChange}
		helper={item?.helper}
		{...props}
	/>
);

registerFieldType({
	id: 'image',
	family: 'media',
	input: ImageInput,
	changeMode: 'nested-event',
	emptyValue: () => undefined,
	table: { type: 'image-text', cell: NotYetImplementedCell },
	view: { type: 'image', render: NotYetImplementedView, layout: 'full' },
	storage: 'string',
});

registerFieldType({
	id: 'nested-image',
	family: 'media',
	input: NestedImageInput,
	changeMode: 'nested-event',
	emptyValue: () => undefined,
	table: { type: 'image-text', cell: NotYetImplementedCell },
	view: { type: 'image', render: NotYetImplementedView, layout: 'full' },
	storage: 'string',
});

registerFieldType({
	id: 'video',
	family: 'media',
	input: VideoInput,
	changeMode: 'event',
	emptyValue: () => undefined,
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'string', render: NotYetImplementedView, layout: 'full' },
	storage: 'string',
});

registerFieldType({
	id: 'icon',
	family: 'media',
	input: IconInput,
	changeMode: 'event',
	emptyValue: () => undefined,
	table: { type: 'text', cell: NotYetImplementedCell },
	view: { type: 'string', render: NotYetImplementedView, layout: 'inline' },
	storage: 'string',
});

registerFieldType({
	id: 'image-array',
	family: 'media',
	input: ImageArrayInput,
	changeMode: 'array',
	emptyValue: () => [],
	table: { type: 'image-text', cell: NotYetImplementedCell },
	view: { type: 'image-array', render: NotYetImplementedView, layout: 'full' },
	storage: 'array-string',
});

registerFieldType({
	id: 'file',
	family: 'media',
	input: FileInput,
	changeMode: 'event',
	emptyValue: () => undefined,
	table: { type: 'file', cell: NotYetImplementedCell },
	view: { type: 'file', render: NotYetImplementedView, layout: 'inline' },
	storage: 'string',
});

registerFieldType({
	id: 'file-array',
	family: 'media',
	input: FileArrayInput,
	changeMode: 'array',
	emptyValue: () => [],
	table: { type: 'file', cell: NotYetImplementedCell },
	view: { type: 'file', render: NotYetImplementedView, layout: 'full' },
	storage: 'array-string',
});
