# Avail Wallet

A React library for connecting to Avail wallets including Metamask Snap and substrate-based wallets.

## Installation

```bash
npm install avail-wallet
# or
yarn add avail-wallet
```

## Dependencies

This package has peer dependencies that need to be installed:

```bash
npm install react react-dom avail-js-sdk @talismn/connect-wallets react-cookie zustand
```

## Usage

### Basic Integration

Wrap your application with the `AvailWalletProvider`:

```jsx
import { AvailWalletProvider, AvailWalletConnect } from 'avail-wallet';

function App() {
  return (
    <AvailWalletProvider>
      <YourApp />
    </AvailWalletProvider>
  );
}

function YourApp() {
  return (
    <div>
      <header>
        <nav>
          <AvailWalletConnect />
        </nav>
      </header>
      <main>
        {/* Your app content */}
      </main>
    </div>
  );
}
```

### Using with an External API Instance

If you already have an ApiPromise instance initialized:

```jsx
import { AvailWalletProvider } from 'avail-wallet';
import { ApiPromise } from 'avail-js-sdk';

function App({ api }) {
  return (
    <AvailWalletProvider api={api}>
      {/* Your app content */}
    </AvailWalletProvider>
  );
}
```

### Accessing Wallet State

```jsx
import { useAvailAccount, useAvailWallet } from 'avail-wallet';

function WalletStatus() {
  const { selected } = useAvailAccount();
  const { api, isConnected } = useAvailWallet();
  
  if (!selected) return <p>Not connected</p>;
  
  return (
    <div>
      <p>Connected address: {selected.address}</p>
      <p>API status: {isConnected ? 'Connected' : 'Disconnected'}</p>
    </div>
  );
}
```

### Setting Custom RPC URL

```jsx
import { useAvailWallet } from 'avail-wallet';

function RpcSelector() {
  const { setRpcUrl } = useAvailWallet();
  
  return (
    <button onClick={() => setRpcUrl('wss://goldberg.avail.tools/ws')}>
      Connect to Goldberg
    </button>
  );
}
```

## Components

- `AvailWalletProvider`: Context provider for wallet functionality
- `AvailWalletConnect`: Main component for wallet connection UI
- `AccountSelector`: Component for selecting accounts from a wallet
- `DisconnectWallet`: Component for displaying connected wallet and disconnect button
- `WalletSelector`: Component for selecting a wallet type

## Hooks

- `useAvailAccount`: Access the selected account and wallet
- `useAvailWallet`: Access the API instance and connection state
- `useMetaMask`: Interact with MetaMask and snaps
- `useInvokeSnap`: Invoke methods on the Avail Snap
- `useRequestSnap`: Request installation of the Avail Snap

## Customization

This library provides components without built-in styling, making it easy to integrate with your design system. You should apply your own CSS classes to style the components.

## License

MIT