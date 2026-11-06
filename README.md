# @wink/elements

TypeScript wrapper for [Wink Travel](https://wink.travel) web components. Loads the CDN bundle and provides full TypeScript type declarations for all 8 Wink custom elements.

[![CI](https://github.com/wink2travel/wink-elements/actions/workflows/ci.yml/badge.svg)](https://github.com/wink2travel/wink-elements/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@wink/elements)](https://www.npmjs.com/package/@wink/elements)

## What this package does

- Calls `load()` once at app startup to inject `elements.js` and `styles.css` from the Wink CDN into the page
- Appends `<wink-app-loader client-id="...">` automatically
- Exports TypeScript interfaces for all component attributes so you get type safety when using them in JSX/TSX or template strings
- Safe to call `load()` multiple times — it's idempotent

## Installation

```bash
npm install @wink/elements
```

## Quick start

```ts
import { load } from '@wink/elements';

// Call once at app startup (e.g. in main.ts / layout.tsx / app.module.ts)
load({ clientId: 'YOUR_CLIENT_ID' });
```

Then use any Wink component in your HTML:

```html
<wink-content-loader layout="HOTEL" id="YOUR_LAYOUT_ID"></wink-content-loader>
```

## React / Next.js

```tsx
// app/layout.tsx
'use client';
import { useEffect } from 'react';
import { load } from '@wink/elements';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    load({ clientId: process.env.NEXT_PUBLIC_WINK_CLIENT_ID! });
  }, []);

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

## Vue / Nuxt 3

```ts
// plugins/wink.client.ts
import { load } from '@wink/elements';

export default defineNuxtPlugin(() => {
  load({ clientId: useRuntimeConfig().public.winkClientId });
});
```

## Staging / development CDN

```ts
load({
  clientId: 'YOUR_CLIENT_ID',
  cdnBaseUrl: 'https://staging-elements.wink.travel',
});
```

## TypeScript types

All component attribute interfaces are exported:

```ts
import type { WinkContentLoaderAttributes, WinkLayout } from '@wink/elements';

const attrs: WinkContentLoaderAttributes = {
  layout: 'HOTEL',
  id: 'abc123',
  sort: 'POPULARITY',
};
```

### Available types

| Type | Description |
|---|---|
| `WinkAppLoaderAttributes` | `<wink-app-loader>` attributes |
| `WinkContentLoaderAttributes` | `<wink-content-loader>` attributes |
| `WinkLookupAttributes` | `<wink-lookup>` attributes |
| `WinkSearchButtonAttributes` | `<wink-search-button>` attributes |
| `WinkAccountButtonAttributes` | `<wink-account-button>` attributes |
| `WinkItineraryButtonAttributes` | `<wink-itinerary-button>` attributes |
| `WinkShoppingCartButtonAttributes` | `<wink-shopping-cart-button>` attributes |
| `WinkItineraryPickerAttributes` | `<wink-itinerary-picker>` attributes |
| `WinkLayout` | Union of all layout type strings |
| `WinkSortOrder` | Union of all sort order strings |

## API

### `load(options: WinkLoadOptions): void`

Injects the Wink CDN resources into the page. Safe to call multiple times.

| Option | Type | Required | Description |
|---|---|---|---|
| `clientId` | `string` | Yes | Your Wink OAuth2 Client ID |
| `configurationId` | `string` | No | Optional customization ID |
| `cdnBaseUrl` | `string` | No | Override CDN URL (default: `https://elements.wink.travel`) |

---

## Contributing

### Prerequisites

- Node.js 20+
- npm 10+

### Setup

```bash
git clone https://github.com/wink2travel/wink-elements.git
cd wink-elements
npm install
```

### Development commands

```bash
# Run tests in watch mode
npm test -- --watch

# Run tests once with coverage report
npm run test:coverage

# Type check
npm run typecheck

# Build the package
npm run build
```

### Running tests

Tests use [Vitest](https://vitest.dev/) with [jsdom](https://github.com/jsdom/jsdom) as the test environment. All tests live alongside source files as `*.test.ts`.

```bash
npm test
```

Coverage must stay at or above **80%** on all metrics. The CI pipeline enforces this.

### Project structure

```
src/
  index.ts          # Public API re-exports
  loader.ts         # CDN injection logic
  types.ts          # TypeScript interfaces for all component attributes
  loader.test.ts    # Unit tests for loader
  types.test.ts     # Type-level tests
```

### Submitting a PR

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-change`
3. Make your changes and ensure tests pass: `npm test`
4. Commit using [Conventional Commits](https://www.conventionalcommits.org/): `feat: add X`
5. Open a PR against `main`

---

## Releasing

Trunk-based: **`main`** is the only long-lived branch. Every PR targets it, and GitHub Actions checks every PR and every merge. A release is a **tag on `main`**; pushing the tag makes Bamboo build the package and publish it to npm.

```bash
git checkout main && git pull

# Show the next version and what would happen; changes nothing
./release.bash --dry-run

# Release
./release.bash
```

`release.bash` works out the next version from the Conventional Commits since the last release (`feat` is a minor bump, `fix`/`perf`/`revert` a patch, a `!` or `BREAKING CHANGE:` a major), bumps `package.json`, adds the `CHANGELOG.md` entry, commits, tags with the bare version (for example `1.0.4`), pushes the commit and the tag together, and creates the GitHub release. Publishing can take a few minutes to start, because Bamboo polls for new tags.

- **Never push a bare-semver tag by hand.** A tag on `main` publishes to npm. Use `./release.bash`.
- **Hotfixes** go forward on `main` and ship as a new patch release.
- The Bamboo plan and deployment are defined in [`bamboo-specs/bamboo.yml`](./bamboo-specs/bamboo.yml); see [`bamboo-specs/README.md`](./bamboo-specs/README.md).
