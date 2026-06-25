# Preferences Component & Context

The preferences module provides a React context and hooks to manage user preferences across the application. It handles options such as theme selection, currency formatting, toast notifications density, and quiet mode.

## API Usage

### `PreferencesProvider`

Wrap the root layout or application container in the `PreferencesProvider` component.

```tsx
import { PreferencesProvider } from '@/lib/preferences';

export default function RootLayout({ children }) {
  return (
    <PreferencesProvider>
      {children}
    </PreferencesProvider>
  );
}
```

### `usePreferences`

Use the hook within components to access or modify preferences.

```tsx
import { usePreferences } from '@/lib/preferences';

const { preferences, updatePreference, formatAmount } = usePreferences();
```

---

## Safe Storage

The preferences state is persisted to `localStorage` using a defensive wrapper defined in `src/lib/safeStorage.ts`. This wrapper hardens storage operations to prevent application crashes when interacting with local storage.

### Resiliency Features

- **SSR-Safe**: Automatically detects SSR environments (when `window` is undefined) and falls back to in-memory state without attempting to access local storage.
- **Disabled Storage Resilience**: In private-browsing modes or when cookies/storage access is disabled by user settings, accessing `localStorage` normally throws a `SecurityError`. The wrapper intercepts this once, registers that storage is unavailable, and degrades to a temporary in-memory store.
- **Quota Exceeded Resilience**: If the browser's storage quota is exceeded (which throws a `QuotaExceededError` or similar write exception), the write is intercepted, and the state continues to be held and updated in the in-memory store to keep the React render tree crash-free.
- **Dev-Only Warn Logging**: Errors caught by the wrapper are logged to the console at most once during development to aid developers without spamming console outputs. In production, warnings are swallowed entirely.
