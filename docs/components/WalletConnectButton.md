# WalletConnectButton

The `WalletConnectButton` component provides a unified control for users to connect and manage their crypto wallet session within the TalentTrust application.

## Location
`src/components/WalletConnectButton.tsx`

## Usage

```tsx
import { WalletConnectButton } from '@/components/WalletConnectButton';

export function Header() {
  return (
    <header>
      <WalletConnectButton />
    </header>
  );
}
```

## Features
- **Global State Integration:** Uses `useWallet` context to ensure the connection state is shared across the app, such as gating actions in `ActionPanel`.
- **States:**
  - **Disconnected:** Displays a prominent "Connect Wallet" button.
  - **Connecting:** Displays a loading spinner and "Connecting..." text. Disables the button.
  - **Error:** Displays a "Connection Error" message with a "Retry" link.
  - **Connected:** Displays the truncated wallet address along with options to copy to clipboard or disconnect.
- **Accessibility:** Fully accessible with ARIA labels, semantic HTML, and proper focus states. Buttons are keyboard operable.
- **Responsiveness:** Works across mobile and desktop viewpoints.

## Dependencies
- `lucide-react` (icons) or inline SVGs.
- `@/contexts/WalletContext`
- `@/lib/truncateAddress`

## Testing
Tested with Jest and React Testing Library in `src/components/__tests__/WalletConnectButton.test.tsx`. Covers all UI states and interactions (click, copy, etc.), distinctive branches (connected | disconnected | error) and a11y.
