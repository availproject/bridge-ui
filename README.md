# Avail's Bridge UI
This is the official UI for Avail's bridge from AVAIL -> ETH and vice versa. You can refer to bridging docs [here](https://docs.availproject.org/docs/end-user-guide/vectorx).

## Project Structure

The project consists of:
- A Next.js application with UI components and bridge functionality
- A reusable `avail-wallet` package for wallet integration

### UI Components

The project includes a comprehensive set of UI components:
- **Main UI Components**: Found in `components/ui/` - includes buttons, dialogs, accordions, selectors, etc.
- **Wallet Components**: Specialized components for wallet integration in `components/wallets/`
- **Reusable Avail Wallet Package**: A separately publishable package in `packages/avail-wallet/` providing wallet connection components and hooks

## Run it Locally

```bash
cp .env.example .env.local


npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Working with the Avail Wallet Package

To build and develop the avail-wallet package:

```bash
# Build the package
pnpm build:avail-wallet

# Development mode with watch
pnpm dev:avail-wallet

# Publish the package
pnpm publish:avail-wallet
```

## Contribution Guidelines

### Rules

Avail welcomes contributors from anywhere and from any kind of education or skill level. We strive to create a community of developers that is welcoming, friendly and right.

1. Before asking any questions regarding how the project works, please read through all the documentation and install the project on your own local machine to try it and understand how it basically works. Please ask your questions in open channels (Github and TG).

2. Before starting to work on an issue, you need to get the approval of one of the maintainers/team members. Therefore please ask to be assigned to an issue. If you don't but you still raise a PR for that issue, your PR can be rejected. This is a form of respect for the other contributors who could have already started to work on the same problem.

3. When you ask to be assigned to an issue, it means that you are ready to work on it. When you get assigned, take the lock and then you disappear, you are not respecting the other contributors who could be able to work on that. So, after having been assigned, you have a week of time to deliver your first draft PR or reach out with any issues regrading the issue. After that time has passed without any notice, you will be unassigned.

4. If you have a new feature idea or you spot a bug you would like to fix, feel free to open up an issue with the tag [New Feature] or [Bug], someone from the team would review it and you'll get assigned to work on it.

5. Once you started working on an issue and you have some work to share and discuss with us, please raise a draft PR early with incomplete changes. This way you can continue working on the same and we can track your progress and actively review and help.

### Create a pull request

Please create pull requests only for the branch `staging`. That code will be pushed to master only on a new release.

#### Deployment Flow

```
test -> name/feat branch -> vercel preview domains
staging -> staging branch -> turing.bridge.avail.so
prod -> main -> bridge.availproject.org
```

Also remember to pull the most recent changes available in the `staging` branch before submitting your PR. If your PR has merge conflicts caused by this behavior, it won’t be accepted.
