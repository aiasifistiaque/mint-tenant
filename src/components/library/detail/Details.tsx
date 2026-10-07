import { FC } from 'react';
import {
	Grid,
	Input,
	Text,
	InputProps,
	Button,
	Box,
	Textarea,
	TextareaProps,
	Image,
} from '@chakra-ui/react';
import UpdatePasswordModal from '../modals/update-password/UpdatePasswordModal';
import { VImage } from '../utils/inputs';
import { PLACEHOLDER_IMAGE } from '../config';
import { CreateModal } from '../modals';

type DetailProps = InputProps &
	TextareaProps &
	any & {
		title: string;
		children: any;
		editing: boolean;
		isPassword?: boolean;
		type?: 'input' | 'textarea' | 'image';
		body?: string;
		path?: string;
		dataModel?: any;
		prompt?: {
			title?: string;
			body?: string;
			btnText?: string;
			successMsg?: string;
		};
		id?: string;
		invalidate?: string[];
	};

const Details: FC<DetailProps> = ({
	title,
	children,
	editing,
	type,
	isPassword,
	isDisabled,
	body,
	path,
	dataModel,
	prompt,
	id,
	invalidate,
	populate,
	...props
}) => {
	const textBox =
		type == 'image' ? (
			<Image
				src={children || PLACEHOLDER_IMAGE}
				h='100px'
				w='100px'
				objectFit='contain'
			/>
		) : (
			<Text
				px={3}
				py={1}
				fontSize='.9rem'>
				{children || <i>N/A</i>}
			</Text>
		);

	const passwordBox = (
		<Box>
			<UpdatePasswordModal
				trigger={
					<Button
						size='sm'
						px={3}>
						Change Password
					</Button>
				}
			/>
		</Box>
	);

	const modalBox = (
		<Box>
			<CreateModal
				type='update'
				data={dataModel}
				prompt={prompt}
				id={id}
				populate={populate}
				invalidate={invalidate}
				path={path}>
				<Button size='sm'>{body}</Button>
			</CreateModal>
		</Box>
	);

	// const inputTextColor = useColorModeValue('text.500', 'gray.300');

	const styleProps = {
		borderRadius: 'md',
		color: 'fg',
		size: 'sm',
		px: 3,
		fontSize: '13px',

		w: { base: '100%', md: '400px' },
		_dark: { color: 'text.dark', borderColor: 'border.dark' },
	};

	const inputBox =
		type == 'textarea' ? (
			<Textarea
				{...styleProps}
				value={children}
				{...props}
			/>
		) : type == 'image' ? (
			<VImage
				value={children}
				{...props}
			/>
		) : isDisabled ? (
			<Input
				{...styleProps}
				value={children}
				disabled
				readOnly
				cursor='not-allowed'
				bg='bg.muted'
				color='fg.muted'
				{...props}
			/>
		) : (
			<Input
				{...styleProps}
				value={children}
				{...props}
			/>
		);

	return (
		<Grid
			gridTemplateColumns={{ base: '1fr 2fr', md: '1fr 3fr' }}
			w='100%'
			pb={3}
			// h='50px'
		>
			<Text
				py={1}
				fontWeight='600'
				fontSize='.9rem'>
				{title}
			</Text>
			{isPassword ? passwordBox : type == 'modal' ? modalBox : editing ? inputBox : textBox}
		</Grid>
	);
};

export default Details;
