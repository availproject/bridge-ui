# Avail Wallet Package

## Overview
This package provides components and hooks for integrating Avail wallets into your application.

## Installation
```bash
npm install @avail/wallet
```

## Important Setup Requirements

### CSS/Styling Setup
This package includes its own CSS styling. You need to import it in your application:

```js
// In your main layout or component file
import 'avail-wallet/dist/styles.css';
```

This will ensure all wallet components are properly styled without any dependency on Tailwind or other CSS frameworks.

## Basic Usage
Here's how to properly set up your application with this package:

### Next.js App Router Setup

```tsx
// In your app/providers.tsx
"use client";

import { AvailWalletProvider } from 'avail-wallet';
import 'avail-wallet/dist/styles.css';

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
import 'avail-wallet/dist/styles.css';
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

### AvailWalletProvider
Provides the wallet context to your application with built-in localStorage persistence.

### AvailWalletConnect
A component for connecting to Avail wallets with a styled UI.

### AccountSelector
Allows users to select an account from their wallet with a styled UI.

### DisconnectWallet
Provides UI for disconnecting from a wallet.

## Hooks

### useAvailWallet
Access the wallet context, including connection state and API.

### useAvailAccount
Access and manage the selected account.

### useApi
Access the Avail API.

## Example
```tsx
import { useAvailWallet, AvailWalletConnect } from '@avail/wallet';

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

## Troubleshooting

### CSS/Styling Issues
If components appear unstyled:

1. Make sure you've imported the CSS file: `import 'avail-wallet/dist/styles.css'`
2. Ensure the CSS import is at the appropriate level in your component hierarchy
3. Check for any CSS conflicts in your application that might be overriding the wallet styles

### Custom Styling
You can override the default styles by targeting the classes with higher specificity in your own CSS:

```css
/* In your custom CSS file */
.aw-button-primary {
  background-color: #YOUR_CUSTOM_COLOR !important;
}
```

All component classes are prefixed with `aw-` to avoid conflicts with your application's styling.