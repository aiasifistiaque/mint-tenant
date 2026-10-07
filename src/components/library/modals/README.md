# Generic Modal Component System

## 📦 What's Included

### Core Components

1. **`GenericModal`** - Main modal wrapper (replaces Chakra v2 Modal)
2. **`GenericModalHeader`** - Modal header component
3. **`GenericModalBody`** - Modal body component
4. **`GenericModalFooter`** - Modal footer component
5. **`GenericModalCloseButton`** - Modal close button
6. **`GenericModalContent`** - Modal content wrapper (optional)

### Documentation

- **`GENERIC_MODAL_README.md`** - Complete documentation with examples
- **`QUICK_REFERENCE.md`** - Quick migration guide
- **`UpdatePasswordModalV3Example.tsx`** - Working example

## 🚀 Quick Start

### 1. Basic Usage

```tsx
import {
	GenericModal,
	GenericModalHeader,
	GenericModalBody,
	GenericModalCloseButton,
} from '@/components/library/modals';
import { useDisclosure } from '@chakra-ui/react';

function MyModal() {
	const { open: isOpen, onOpen, onClose } = useDisclosure();

	return (
		<>
			<Button onClick={onOpen}>Open</Button>
			<GenericModal
				isOpen={isOpen}
				onClose={onClose}>
				<ModalContent>
					<GenericModalHeader>My Modal</GenericModalHeader>
					<GenericModalCloseButton />
					<GenericModalBody>Content here</GenericModalBody>
				</ModalContent>
			</GenericModal>
		</>
	);
}
```

## ✅ Why Use GenericModal?

1. **Zero Breaking Changes** - Works with existing code patterns
2. **V3 Compatible** - Uses Chakra UI v3 Dialog internally
3. **Custom Wrappers** - Works with your `ModalContainer`, `AlertDialogContent`, etc.
4. **Type Safe** - Full TypeScript support
5. **Easy Migration** - Just replace import statements

## 📝 Migration Steps

### Step 1: Update Imports

```tsx
// Before
import {
	Modal,
	ModalOverlay,
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalCloseButton,
} from '@chakra-ui/react';

// After
import {
	GenericModal,
	GenericModalHeader,
	GenericModalBody,
	GenericModalFooter,
	GenericModalCloseButton,
} from '@/components/library/modals';
```

### Step 2: Replace Components

```tsx
// Before
<Modal isOpen={isOpen} onClose={onClose}>
  <ModalOverlay />
  <ModalContent>
    <ModalHeader>Title</ModalHeader>
    <ModalCloseButton />
    <ModalBody>Content</ModalBody>
    <ModalFooter>Footer</ModalFooter>
  </ModalContent>
</Modal>

// After
<GenericModal isOpen={isOpen} onClose={onClose}>
  <ModalContent>
    <GenericModalHeader>Title</GenericModalHeader>
    <GenericModalCloseButton />
    <GenericModalBody>Content</GenericModalBody>
    <GenericModalFooter>Footer</GenericModalFooter>
  </ModalContent>
</GenericModal>
```

## 🎯 Key Differences from V2

| V2 Modal                    | GenericModal          | Notes                                  |
| --------------------------- | --------------------- | -------------------------------------- |
| Requires `<ModalOverlay />` | Built-in backdrop     | No need to add overlay                 |
| `isOpen` prop               | `isOpen` prop         | ✅ Same                                |
| `onClose` prop              | `onClose` prop        | ✅ Same                                |
| `size` prop                 | `size` prop           | ✅ Same (v3 values)                    |
| `closeOnOverlayClick`       | `closeOnOverlayClick` | ✅ Same                                |
| `motionPreset`              | `motionPreset`        | ⚠️ Uses kebab-case (`slide-in-bottom`) |

## 📚 Examples

### Form Modal

```tsx
<GenericModal
	isOpen={isOpen}
	onClose={onClose}
	closeOnOverlayClick={false}>
	<ModalContainer>
		<GenericModalHeader>Create Item</GenericModalHeader>
		<GenericModalCloseButton />
		<form onSubmit={handleSubmit}>
			<GenericModalBody>
				<VInput
					label='Name'
					name='name'
				/>
			</GenericModalBody>
			<GenericModalFooter>
				<Button
					variant='outline'
					onClick={onClose}>
					Cancel
				</Button>
				<Button type='submit'>Submit</Button>
			</GenericModalFooter>
		</form>
	</ModalContainer>
</GenericModal>
```

### Confirmation Dialog

```tsx
<GenericModal
	isOpen={isOpen}
	onClose={onClose}
	size='sm'>
	<AlertDialogContent>
		<GenericModalHeader>Delete Item?</GenericModalHeader>
		<GenericModalBody>This action cannot be undone.</GenericModalBody>
		<GenericModalFooter>
			<Button onClick={onClose}>Cancel</Button>
			<Button
				colorPalette='red'
				onClick={handleDelete}>
				Delete
			</Button>
		</GenericModalFooter>
	</AlertDialogContent>
</GenericModal>
```

## 🛠️ Advanced Features

### Responsive Modal (Drawer on Mobile)

```tsx
const isMobile = useIsMobile();

<GenericModal
	isOpen={isOpen}
	onClose={onClose}
	placement={isMobile ? 'bottom' : 'center'}
	motionPreset={isMobile ? 'slide-in-bottom' : 'scale'}>
	<ModalContainer isSmallScreen={isMobile}>{/* Content */}</ModalContainer>
</GenericModal>;
```

### Prevent Accidental Close

```tsx
<GenericModal
	isOpen={isOpen}
	onClose={onClose}
	closeOnOverlayClick={false}
	closeOnEsc={false}>
	{/* User must use close button */}
</GenericModal>
```

### Full Screen Modal

```tsx
<GenericModal
	isOpen={isOpen}
	onClose={onClose}
	size='full'>
	{/* Full screen content */}
</GenericModal>
```

## 🐛 Troubleshooting

### Modal won't close when clicking outside

- Check `closeOnOverlayClick={true}` (default)

### Content not styled correctly

- Make sure you're using your custom wrapper (`ModalContainer`, `ModalContent`, etc.)

### TypeScript errors

- Ensure you're importing from `@/components/library/modals`
- Check that size and placement values match v3 types

## 📖 Further Reading

- [Complete Documentation](./GENERIC_MODAL_README.md)
- [Quick Reference](./QUICK_REFERENCE.md)
- [Working Example](./update-password/UpdatePasswordModalV3Example.tsx)
- [Chakra UI v3 Dialog Docs](https://www.chakra-ui.com/docs/components/dialog)

## 💡 Pro Tips

1. **Batch Migration**: Use find & replace to migrate multiple files quickly
2. **Test Thoroughly**: Verify focus management and keyboard navigation
3. **Mobile First**: Test on mobile devices - modals may behave differently
4. **Custom Wrappers**: Keep using your existing `ModalContainer` and other wrappers
5. **Form Handling**: No changes needed to form submission logic

## ✨ Benefits

- ✅ **Minimal code changes** - Just update imports and component names
- ✅ **Backward compatible** - Works with existing patterns
- ✅ **Future proof** - Built on Chakra UI v3
- ✅ **Type safe** - Full TypeScript support
- ✅ **Flexible** - Works with all your custom wrappers

---

**Ready to migrate?** Start with [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) for the fastest path!
