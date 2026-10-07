import { useState } from 'react';
import { Box, Center, Flex, Image, Input, InputGroup, Text } from '@chakra-ui/react';
import { CircleAlert, ImageIcon, Link2 } from 'lucide-react';

const looksLikeUrl = (v: string) => /^(https?:\/\/|\/)\S+$/i.test(v.trim());

/**
 * The upload modal's "From URL" tab: paste an image's address and see it
 * before inserting. Only an address that actually loads an image is offered
 * to Insert — a broken link clears the selection.
 */
const InsertUrl = ({ handleSelect, fileType = 'image' }: { handleSelect: any; fileType?: string }) => {
	const [url, setUrl] = useState('');
	const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
	// Videos and other files can't be checked by loading them as an image:
	// any address that looks right is accepted as typed.
	const isImage = fileType === 'image';

	const onChange = (value: string) => {
		setUrl(value);
		const valid = looksLikeUrl(value);
		if (!isImage) {
			handleSelect(valid ? value.trim() : null);
			setState(valid ? 'ok' : value.trim() ? 'error' : 'idle');
			return;
		}
		handleSelect(null);
		setState(valid ? 'loading' : value.trim() ? 'error' : 'idle');
	};

	return (
		<Flex
			direction='column'
			gap={4}>
			<Box>
				<Text
					fontSize='13px'
					fontWeight='500'
					mb={1.5}>
					{isImage ? 'Image address' : fileType === 'video' ? 'Video address' : 'File address'}
				</Text>
				<InputGroup startElement={<Link2 size={15} />}>
					<Input
						size='sm'
						value={url}
						onChange={e => onChange(e.target.value)}
						placeholder={isImage ? 'https://example.com/photo.jpg' : 'https://…'}
					/>
				</InputGroup>
			</Box>

			{isImage && (
				<Center
					position='relative'
					h={{ base: '220px', md: '300px' }}
					borderRadius='xl'
					borderWidth='1px'
					borderColor='border.muted'
					bg='bg.subtle'
					overflow='hidden'>
					{looksLikeUrl(url) && (
						<Image
							key={url}
							src={url.trim()}
							alt='Preview'
							maxW='full'
							maxH='full'
							objectFit='contain'
							display={state === 'ok' ? 'block' : 'none'}
							onLoad={() => {
								setState('ok');
								handleSelect(url.trim());
							}}
							onError={() => {
								setState('error');
								handleSelect(null);
							}}
						/>
					)}
					{state !== 'ok' && (
						<Flex
							direction='column'
							align='center'
							gap={2}
							px={6}
							textAlign='center'
							color='fg.muted'>
							{state === 'error' ? <CircleAlert size={22} /> : <ImageIcon size={22} />}
							<Text fontSize='13px'>
								{state === 'error'
									? 'No image could be loaded from that address.'
									: state === 'loading'
										? 'Loading the preview…'
										: 'Paste a link to see a preview here.'}
							</Text>
						</Flex>
					)}
				</Center>
			)}

			<Text
				fontSize='12px'
				color='fg.muted'>
				Only use {isImage ? 'images' : 'files'} you have the right to use. It stays where it is hosted — if it’s
				removed there, it disappears here too.
			</Text>
		</Flex>
	);
};

export default InsertUrl;
