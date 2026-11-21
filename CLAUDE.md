# Rules for this app

## Modals: one shell, every time

Every modal uses the same design, and the container is one shared component. Don't build a modal from raw Chakra `Dialog.Root` / `Drawer.Root` parts, and don't make a page-local modal shell.

- **Forms and content:** `Dialog` → `DialogHeader` (title, `description`, `icon`) → `DialogCloseButton` → `DialogBody` → `DialogFooter`. Import them from `@/components/library`; the code lives in `src/components/library/components/table/table-components/menu-modals/`.
  - Pass `forceModal` for small dialogs.
  - The footer holds `DiscardButton` then the primary `Button {...styles.MODAL_BUTTON}`.
  - It's a centred dialog on a computer and a swipeable bottom sheet on a phone. You don't handle that yourself.
- **Confirm / delete:** `PromptDialog`, which renders through the same shell. Use `tone='default'` for anything that isn't a delete.
- **Spacing:** the header line and body/footer padding live in the shell (`MenuModalHeader` / `MenuModalBody` / `MenuModalFooter`). Fix a look there once, never per modal. If a modal needs something the shell can't do, add a prop to the shell rather than forking it.
- **Other apps:** these files are identical copies in mint-tenant, mint-commerce, mint-panel and admin. Change all four together.
