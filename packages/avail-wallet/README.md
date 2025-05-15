# Avail Wallet Package

## Overview
This package provides React components and hooks for integrating Avail wallets into your application. It includes both wallet connection functionality and styled UI components with all required fonts and assets bundled.

## Installation
```bash
pnpm install avail-wallet
```

## Basic Usage
Here's how to properly set up your application with this package:

### Next.js App Router Setup

```tsx
// In your app/providers.tsx
"use client";

import { AvailWalletProvider } from 'avail-wallet';
// Styles are automatically imported from the package
// No need to separately import CSS files or add fonts!

export function Providers({ children }) {
  return (
    <AvailWalletProvider>
      {children}
    </AvailWalletProvider>
  );
}

// In your app/layout.tsx
import { Providers } from './providers';
import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

### Next.js Pages Router Setup

```tsx
// In your _app.tsx or root component
import { AvailWalletProvider } from 'avail-wallet';
// Styles are automatically imported from the package
import '../styles/globals.css';

function App({ Component, pageProps }) {
  return (
    <AvailWalletProvider>
      <Component {...pageProps} />
    </AvailWalletProvider>
  );
}

export default App;
```

## Persistence
The wallet state is automatically persisted in your browser's localStorage. This means users will remain connected to their wallets between sessions without having to reconnect every time they visit your application.

## Components

### Wallet Components

#### AvailWalletProvider
Provides the wallet context to your application with built-in localStorage persistence.

#### AvailWalletConnect
A component for connecting to Avail wallets with a styled UI.

#### AccountSelector
Allows users to select an account from their wallet with a styled UI.

#### DisconnectWallet
Provides UI for disconnecting from a wallet.

#### WalletSelector
Allows users to select which wallet provider to connect with.

### UI Components

The package includes several UI components that are used by the wallet components but can also be used independently:

#### Button
A customizable button component with various styles and variants.

#### Badge
A customizable badge component with different style variants.

#### Dialog
A modal dialog component with header, footer, title, and description components.

## Hooks

### useAvailWallet
Access the wallet context, including connection state and API.

### useAvailAccount
Access and manage the selected account.

### useApi
Access the Avail API.

### MetaMask Hooks
The package also includes hooks for MetaMask integration:

#### useMetaMask
Access the MetaMask wallet state.

#### useMetaMaskContext
Access the MetaMask context.

#### useRequestSnap
Request the Avail snap for MetaMask.

#### useInvokeSnap
Invoke methods on the Avail snap for MetaMask.

## Examples

### Basic Wallet Connection
```tsx
import { useAvailWallet, AvailWalletConnect } from 'avail-wallet';

function MyComponent() {
  const { isConnected, api } = useAvailWallet();

  return (
    <div>
      <AvailWalletConnect />
      {isConnected ? 'Connected to wallet' : 'Not connected'}
    </div>
  );
}
```

### Using UI Components
```tsx
import { Button, Badge, Dialog, DialogContent, DialogHeader, DialogTitle } from 'avail-wallet';

function MyUIComponent() {
  return (
    <div>
      <Button variant="primary" size="lg">Connect Wallet</Button>
      <Badge variant="avail">Avail Network</Badge>

      <Dialog>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select a Wallet</DialogTitle>
          </DialogHeader>
          {/* Dialog content here */}
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

## Styling Information

### Included Assets
This package includes the following assets bundled and ready to use:

- **Fonts**: All required fonts (PP Mori and THICCCBOI variants)
- **Images**: The availsnap.png image for MetaMask integration

### Custom Styling
You can override the default styles by targeting the classes with higher specificity in your own CSS:

```css
/* In your custom CSS file */
.aw-button-primary {
  background-color: #YOUR_CUSTOM_COLOR !important;
}
```

### Tailwind CSS
If you're using Tailwind CSS, ensure your content configuration includes the package components:

```js
// tailwind.config.js
module.exports = {
  content: [
    // ...your other content paths
    './node_modules/avail-wallet/**/*.{js,ts,jsx,tsx}'
  ],
  // ...rest of your config
}
```

## TypeScript Support

The package includes TypeScript types for all components and hooks:

```tsx
import type {
  UpdateMetadataParams,
  WalletSelectionProps,
  AccountSelectionProps,
  DisconnectWalletProps,
  ExtendedWalletAccount,
  AvailWalletProviderProps,
  AvailWalletConnectProps
} from 'avail-wallet';
```

## Utility Functions and Assets

The package provides several utility functions and asset paths:

### Utility Functions
- `updateMetadata`: Update metadata for wallet accounts
- `getInjectorMetadata`: Get metadata for wallet injectors
- `initApi`: Initialize the Avail API

### Asset Paths
Asset paths are exposed for advanced use cases if needed:

```tsx
import { ASSETS_PATH } from 'avail-wallet';

console.log(ASSETS_PATH.fonts.PPMoriRegular); // Path to the PP Mori Regular font
console.log(ASSETS_PATH.images.availSnap);    // Path to the Avail Snap image
```
