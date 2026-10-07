# Generic Modal Component - Migration Guide

## Overview

The `GenericModal` component provides a backward-compatible wrapper for Chakra UI v3's Dialog components, allowing you to easily migrate from v2 Modal components without rewriting your entire codebase.

## Installation

The components are already exported from the modals index:

```tsx
import {
	GenericModal,
	GenericModalHeader,
	GenericModalBody,
	GenericModalFooter,
	GenericModalCloseButton,
	GenericModalContent,
} from '@/components/library/modals';
```

## Quick Migration

### Before (Chakra UI v2):

```tsx
import {
	Modal,
	ModalOverlay,
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalCloseButton,
} from '@chakra-ui/react';

<Modal
	isOpen={isOpen}
	onClose={onClose}
	size='xl'>
	<ModalOverlay />
	<ModalContent>
		<ModalHeader>My Modal</ModalHeader>
		<ModalCloseButton />
		<ModalBody>Content here</ModalBody>
		<ModalFooter>
			<Button onClick={onClose}>Close</Button>
		</ModalFooter>
	</ModalContent>
</Modal>;
```

### After (Using GenericModal):

```tsx
import {
	GenericModal,
	GenericModalHeader,
	GenericModalBody,
	GenericModalFooter,
	GenericModalCloseButton,
} from '@/components/library/modals';

<GenericModal
	isOpen={isOpen}
	onClose={onClose}
	size='xl'>
	<ModalContent>
		{' '}
		{/* Your custom ModalContent wrapper */}
		<GenericModalHeader>My Modal</GenericModalHeader>
		<GenericModalCloseButton />
		<GenericModalBody>Content here</GenericModalBody>
		<GenericModalFooter>
			<Button onClick={onClose}>Close</Button>
		</GenericModalFooter>
	</ModalContent>
</GenericModal>;
```

## Props

### GenericModal Props

| Prop                  | Type                                                                                          | Default    | Description                       |
| --------------------- | --------------------------------------------------------------------------------------------- | ---------- | --------------------------------- |
| `isOpen`              | `boolean`                                                                                     | required   | Controls modal visibility         |
| `onClose`             | `() => void`                                                                                  | required   | Callback when modal closes        |
| `size`                | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl' \| '3xl' \| '4xl' \| '5xl' \| '6xl' \| 'full'` | `'md'`     | Modal size                        |
| `closeOnOverlayClick` | `boolean`                                                                                     | `true`     | Close modal when clicking outside |
| `closeOnEsc`          | `boolean`                                                                                     | `true`     | Close modal on ESC key            |
| `scrollBehavior`      | `'inside' \| 'outside'`                                                                       | `'inside'` | Where scrolling happens           |
| `isCentered`          | `boolean`                                                                                     | `true`     | Center modal vertically           |
| `motionPreset`        | `'slideInBottom' \| 'slideInRight' \| 'scale' \| 'none'`                                      | `'scale'`  | Animation preset                  |
| `placement`           | `'center' \| 'top' \| 'bottom' \| 'left' \| 'right'`                                          | `'center'` | Modal placement                   |
| `initialFocusRef`     | `React.RefObject`                                                                             | -          | Element to focus on mount         |
| `finalFocusRef`       | `React.RefObject`                                                                             | -          | Element to focus on close         |
| `trapFocus`           | `boolean`                                                                                     | `true`     | Trap focus within modal           |
| `blockScrollOnMount`  | `boolean`                                                                                     | `true`     | Block page scroll when open       |
| `returnFocusOnClose`  | `boolean`                                                                                     | `true`     | Return focus on close             |

## Usage Examples

### Basic Modal

```tsx
import { useDisclosure } from '@chakra-ui/react';
import {
	GenericModal,
	GenericModalHeader,
	GenericModalBody,
	GenericModalCloseButton,
} from '@/components/library/modals';

function MyComponent() {
	const { open: isOpen, onOpen, onClose } = useDisclosure();

	return (
		<>
			<Button onClick={onOpen}>Open Modal</Button>
			<GenericModal
				isOpen={isOpen}
				onClose={onClose}>
				<ModalContent>
					<GenericModalHeader>Modal Title</GenericModalHeader>
					<GenericModalCloseButton />
					<GenericModalBody>
						<p>Modal content goes here</p>
					</GenericModalBody>
				</ModalContent>
			</GenericModal>
		</>
	);
}
```

### Form Modal

```tsx
<GenericModal
	isOpen={isOpen}
	onClose={onClose}
	size='xl'
	closeOnOverlayClick={false}>
	<ModalContainer>
		<GenericModalHeader>Create Item</GenericModalHeader>
		<GenericModalCloseButton />
		<form onSubmit={handleSubmit}>
			<GenericModalBody>
				<VInput
					label='Name'
					name='name'
					onChange={handleChange}
				/>
				<VInput
					label='Email'
					name='email'
					type='email'
					onChange={handleChange}
				/>
			</GenericModalBody>
			<GenericModalFooter>
				<Button
					variant='outline'
					onClick={onClose}>
					Cancel
				</Button>
				<Button
					type='submit'
					loading={isLoading}>
					Submit
				</Button>
			</GenericModalFooter>
		</form>
	</ModalContainer>
</GenericModal>
```

### Alert Dialog Style Modal

```tsx
<GenericModal
	isOpen={isOpen}
	onClose={onClose}
	size='sm'
	isCentered>
	<AlertDialogContent>
		<GenericModalHeader>Delete Item?</GenericModalHeader>
		<GenericModalBody>
			Are you sure you want to delete this item? This action cannot be undone.
		</GenericModalBody>
		<GenericModalFooter>
			<Button
				variant='outline'
				onClick={onClose}>
				Cancel
			</Button>
			<Button
				colorPalette='red'
				onClick={handleDelete}>
				Delete
			</Button>
		</GenericModalFooter>
	</AlertDialogContent>
</GenericModal>
```

### Mobile-Responsive Modal (Drawer on Mobile)

```tsx
import { useIsMobile } from '@/hooks';

function ResponsiveModal() {
	const isMobile = useIsMobile();
	const { open: isOpen, onOpen, onClose } = useDisclosure();

	return (
		<GenericModal
			isOpen={isOpen}
			onClose={onClose}
			placement={isMobile ? 'bottom' : 'center'}
			motionPreset={isMobile ? 'slideInBottom' : 'scale'}>
			<ModalContainer isSmallScreen={isMobile}>
				<GenericModalHeader>Responsive Modal</GenericModalHeader>
				<GenericModalCloseButton />
				<GenericModalBody>This modal adapts to mobile devices</GenericModalBody>
			</ModalContainer>
		</GenericModal>
	);
}
```

## Migration Strategy

### Step 1: Import the Generic Components

```tsx
// Add to your imports
import {
	GenericModal,
	GenericModalHeader,
	GenericModalBody,
	GenericModalFooter,
	GenericModalCloseButton,
} from '@/components/library/modals';
```

### Step 2: Replace Modal with GenericModal

```tsx
// Change this:
<Modal isOpen={isOpen} onClose={onClose}>

// To this:
<GenericModal isOpen={isOpen} onClose={onClose}>
```

### Step 3: Remove ModalOverlay

```tsx
// Remove this line:
<ModalOverlay />

// GenericModal handles the backdrop automatically
```

### Step 4: Update Modal Components

```tsx
// Replace Chakra components with Generic versions:
<ModalHeader> → <GenericModalHeader>
<ModalBody> → <GenericModalBody>
<ModalFooter> → <GenericModalFooter>
<ModalCloseButton> → <GenericModalCloseButton>
```

### Step 5: Keep Your Custom Wrappers

```tsx
// Your existing custom wrappers still work:
<ModalContainer>  // Your custom component
<AlertDialogContent>  // Your custom component
```

## Benefits

1. **Minimal Changes**: Only need to change import statements and component names
2. **Backward Compatible**: Works with existing `useDisclosure` hooks
3. **Custom Wrappers**: Works with your existing `ModalContainer`, `AlertDialogContent`, etc.
4. **Type Safe**: Full TypeScript support
5. **V3 Ready**: Uses Chakra UI v3 Dialog components internally
6. **Consistent API**: Same props as v2 Modal for easy migration

## Troubleshooting

### Issue: Modal doesn't close when clicking outside

**Solution**: Check `closeOnOverlayClick` prop is set to `true` (default)

### Issue: Focus not returning after close

**Solution**: Set `returnFocusOnClose={true}` or provide a `finalFocusRef`

### Issue: Modal content not styled correctly

**Solution**: Make sure you're wrapping children in your custom `ModalContent` or `ModalContainer` component

## Advanced Usage

### Custom Animation

```tsx
<GenericModal
	motionPreset='slideInBottom'
	placement='bottom'>
	{/* Content */}
</GenericModal>
```

### Prevent Close on Outside Click

```tsx
<GenericModal
	closeOnOverlayClick={false}
	closeOnEsc={false}>
	{/* Content - user must use close button */}
</GenericModal>
```

### Full Screen Modal

```tsx
<GenericModal size='full'>{/* Full screen content */}</GenericModal>
```

## See Also

- [UpdatePasswordModalV3Example.tsx](./update-password/UpdatePasswordModalV3Example.tsx) - Complete working example
- [Chakra UI v3 Dialog Documentation](https://www.chakra-ui.com/docs/components/dialog)
