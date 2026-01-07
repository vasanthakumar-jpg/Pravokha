# Shared Layer

This layer contains cross-cutting concerns, reusable components, and global utilities used across multiple features.

## Structure
- `/ui`: Specialized, non-primitive UI components (e.g., `LoadingSpinner`, `UserAvatar`).
- `/util`: Generic helper functions and constants.
- `/hook`: Generic React hooks (e.g., `useDebounce`, `useLocalStorage`).
- `/domain`: Business logic entities and types shared across features (e.g., `ProductDomain`).

## Principles
- **No Feature Logic**: Shared components should not hold feature-specific business logic.
- **Zero Dependencies On Features**: Shared items must not depend on `/feat` modules.
- **Pure Helpers**: Utilities should be pure and side-effect free where possible.
