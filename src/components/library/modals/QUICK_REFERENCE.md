# Generic Modal - Quick Reference

## One-Line Change Migration

### Find & Replace Guide

1. **Import Statement**

```tsx
// OLD:
import {
	Modal,
	ModalOverlay,
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalCloseButton,
} from '@chakra-ui/react';

// NEW:
import {
	GenericModal,
	GenericModalHeader,
	GenericModalBody,
	GenericModalFooter,
	GenericModalCloseButton,
} from '@/components/library/modals';
```

2. **Component Replacements**

```tsx
<Modal          → <GenericModal
<ModalHeader    → <GenericModalHeader
<ModalBody      → <GenericModalBody
<ModalFooter    → <GenericModalFooter
<ModalCloseButton → <GenericModalCloseButton
```

3. **Remove ModalOverlay**

```tsx
<ModalOverlay /> → (delete this line)
```

## Common Patterns

### Pattern 1: Basic Modal

```tsx
<GenericModal
	isOpen={isOpen}
	onClose={onClose}>
	<ModalContent>
		<GenericModalHeader>Title</GenericModalHeader>
		<GenericModalCloseButton />
		<GenericModalBody>Content</GenericModalBody>
	</ModalContent>
</GenericModal>
```

### Pattern 2: Form Modal

```tsx
<GenericModal
	isOpen={isOpen}
	onClose={onClose}
	closeOnOverlayClick={false}>
	<ModalContainer>
		<GenericModalHeader>Form Title</GenericModalHeader>
		<form onSubmit={handleSubmit}>
			<GenericModalBody>{/* form fields */}</GenericModalBody>
			<GenericModalFooter>
				<Button onClick={onClose}>Cancel</Button>
				<Button type='submit'>Submit</Button>
			</GenericModalFooter>
		</form>
	</ModalContainer>
</GenericModal>
```

### Pattern 3: Alert Dialog

```tsx
<GenericModal
	isOpen={isOpen}
	onClose={onClose}
	size='sm'>
	<AlertDialogContent>
		<GenericModalHeader>Confirm Action</GenericModalHeader>
		<GenericModalBody>Are you sure?</GenericModalBody>
		<GenericModalFooter>
			<Button onClick={onClose}>No</Button>
			<Button
				colorPalette='red'
				onClick={handleDelete}>
				Yes, Delete
			</Button>
		</GenericModalFooter>
	</AlertDialogContent>
</GenericModal>
```

## Props Quick Reference

| Common Props          | Values                                            |
| --------------------- | ------------------------------------------------- |
| `size`                | `'sm'`, `'md'`, `'lg'`, `'xl'`, `'2xl'`, `'full'` |
| `placement`           | `'center'`, `'top'`, `'bottom'`                   |
| `closeOnOverlayClick` | `true` (default), `false`                         |
| `scrollBehavior`      | `'inside'` (default), `'outside'`                 |

## Migration Checklist

- [ ] Import `GenericModal` components
- [ ] Replace `<Modal>` with `<GenericModal>`
- [ ] Replace modal sub-components with Generic versions
- [ ] Remove `<ModalOverlay />`
- [ ] Test modal opening/closing
- [ ] Test form submission (if applicable)
- [ ] Test on mobile devices
- [ ] Verify focus management

## Need Help?

See [GENERIC_MODAL_README.md](./GENERIC_MODAL_README.md) for full documentation.
