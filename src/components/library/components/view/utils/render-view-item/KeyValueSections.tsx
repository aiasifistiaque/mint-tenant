import { Box, Grid, Text } from '@chakra-ui/react';

/**
 * A key-value field's saved value on a record page (backend docs/key-values):
 * one block per section — its title, description, then key → value rows.
 */
type Section = { title?: string; description?: string; items?: { key?: string; value?: string }[] };

const KeyValueSections = ({ value }: { value: Section[] }) => (
	<Box
		display='flex'
		flexDirection='column'
		gap={3}
		w='full'>
		{value
			.filter(s => s && Array.isArray(s.items) && s.items.length)
			.map((s, i) => (
				<Box
					key={i}
					borderWidth='1px'
					borderRadius='md'
					overflow='hidden'>
					<Box
						px={3}
						py={2}
						bg='bg.subtle'>
						<Text
							fontSize='14px'
							fontWeight='600'>
							{s.title || 'Details'}
						</Text>
						{s.description && (
							<Text
								fontSize='12.5px'
								color='fg.muted'>
								{s.description}
							</Text>
						)}
					</Box>
					{(s.items || []).map((it, j) => (
						<Grid
							key={j}
							gridTemplateColumns={{ base: '1fr', md: 'minmax(120px, 1fr) 2fr' }}
							columnGap={4}
							px={3}
							py={2}
							borderTopWidth='1px'>
							<Text
								fontSize='13px'
								color='fg.muted'>
								{it.key}
							</Text>
							<Text
								fontSize='.95rem'
								whiteSpace='pre-wrap'
								wordBreak='break-word'>
								{it.value}
							</Text>
						</Grid>
					))}
				</Box>
			))}
	</Box>
);

export default KeyValueSections;
