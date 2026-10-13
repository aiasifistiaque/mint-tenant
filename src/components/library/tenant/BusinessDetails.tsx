'use client';

import { FC } from 'react';
import { Box, Button, Field, Flex, Grid, Input, Text, Textarea } from '@chakra-ui/react';
import { ImagePlus, X } from 'lucide-react';
import { UploadModal } from '../modals';

/**
 * Business details (backend docs/pdf-templates D14): the organization's on
 * Organization → Settings, a project's on Project settings and in the PDF
 * designer. What invoices and receipts print as {{business.*}}.
 */

export type Business = { name: string; logo: string; address: string; phone: string; email: string; website: string; taxId: string };

export const EMPTY_BUSINESS: Business = { name: '', logo: '', address: '', phone: '', email: '', website: '', taxId: '' };

/** The keys a field can be opened at (the PDF designer's "Add address"). */
export type BusinessKey = keyof Business;

/**
 * A logo: the picture, and Upload / Change / Remove — the media library's
 * picker (library, folders, a new upload or a link) in a modal.
 */
export const LogoField: FC<{ value: string; onChange: (url: string) => void; disabled?: boolean; size?: string }> = ({ value, onChange, disabled, size = '88px' }) => (
	<Flex
		align='center'
		gap={3}>
		<Flex
			w={size}
			h={size}
			flexShrink={0}
			align='center'
			justify='center'
			borderWidth='1px'
			borderStyle={value ? 'solid' : 'dashed'}
			borderColor='border'
			borderRadius='md'
			bg='bg.subtle'
			overflow='hidden'>
			{value ? (
				// eslint-disable-next-line @next/next/no-img-element
				<img
					src={value}
					alt='Logo'
					style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
				/>
			) : (
				<ImagePlus
					size={20}
					strokeWidth={1.5}
					color='var(--chakra-colors-fg-subtle)'
				/>
			)}
		</Flex>
		{!disabled && (
			<Flex
				direction='column'
				gap={1.5}
				align='flex-start'>
				<UploadModal
					type='edit'
					fileType='image'
					folder='logos'
					handleImage={(url: any) => typeof url === 'string' && url && onChange(url)}>
					<Button
						size='xs'
						variant='outline'>
						<ImagePlus size={13} />
						{value ? 'Change logo' : 'Upload logo'}
					</Button>
				</UploadModal>
				{value && (
					<Button
						size='xs'
						variant='ghost'
						color='fg.muted'
						onClick={() => onChange('')}>
						<X size={13} />
						Remove
					</Button>
				)}
				<Text
					fontSize='11px'
					color='fg.subtle'>
					PNG, JPG, WebP or SVG — a wide one prints best.
				</Text>
			</Flex>
		)}
	</Flex>
);

const labelCss: any = { fontSize: '13px', fontWeight: '600', m: 0 };

/**
 * The business details' fields. `focus` puts the cursor in one (the PDF
 * designer opening at "Add phone").
 */
const BusinessFields: FC<{ value: Business; onChange: (v: Business) => void; disabled?: boolean; focus?: BusinessKey | null }> = ({
	value,
	onChange,
	disabled,
	focus,
}) => {
	const set = (k: BusinessKey) => (e: { target: { value: string } }) => onChange({ ...value, [k]: e.target.value });
	const input = (k: BusinessKey, label: string, props: any = {}) => (
		<Field.Root>
			<Field.Label {...labelCss}>{label}</Field.Label>
			<Input
				size='sm'
				value={value[k] || ''}
				autoFocus={focus === k}
				onChange={set(k)}
				{...props}
			/>
		</Field.Root>
	);
	return (
		<fieldset disabled={disabled}>
			<Flex
				direction='column'
				gap={4}>
				<Box>
					<Text
						{...labelCss}
						mb={2}>
						Logo
					</Text>
					<LogoField
						value={value.logo}
						disabled={disabled}
						onChange={logo => onChange({ ...value, logo })}
					/>
				</Box>
				<Grid
					templateColumns={{ base: '1fr', md: '1fr 1fr' }}
					gap={3}>
					{input('name', 'Business name', { maxLength: 160, placeholder: 'As it prints on invoices' })}
					{input('taxId', 'Tax / VAT / BIN number', { maxLength: 80 })}
					<Box gridColumn={{ md: 'span 2' }}>
						<Field.Root>
							<Field.Label {...labelCss}>Address</Field.Label>
							<Textarea
								size='sm'
								rows={2}
								maxLength={600}
								value={value.address || ''}
								autoFocus={focus === 'address'}
								onChange={set('address')}
							/>
						</Field.Root>
					</Box>
					{input('phone', 'Phone', { maxLength: 60, type: 'tel' })}
					{input('email', 'Email', { maxLength: 160, type: 'email' })}
					{input('website', 'Website', { maxLength: 300, placeholder: 'https://' })}
				</Grid>
			</Flex>
		</fieldset>
	);
};

export default BusinessFields;
