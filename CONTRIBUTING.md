# Contributing to dsh-autofill-model-metadata

Everything about building, testing and releasing the plugin. For using it, see
[README.md](README.md); for configuring it, see
[CONFIGURATION.md](CONFIGURATION.md).

- [Setup](#setup)
- [What `verify` runs](#what-verify-runs)
- [Two halves](#two-halves)
- [Client-only changes](#client-only-changes)
- [Continuous integration](#continuous-integration)
- [macOS: vitest cannot start under the DSH runtime node](#macos-vitest-cannot-start-under-the-dsh-runtime-node)
- [Releasing](#releasing)
- [Design constraints worth keeping](#design-constraints-worth-keeping)

## Setup

Requires Node `>= 22` and the pnpm version pinned by `packageManager` in
`package.json` (Corepack or a global pnpm both work).

```sh
pnpm install
pnpm run verify     # tsc --noEmit && tsdown && vitest
```

`test` runs vitest alone; `typecheck` and `build` are separate steps when you
want them on their own. There is no lint step and no formatter config: match the
surrounding file.

## What `verify` runs

| stage | command | covers |
| --- | --- | --- |
| typecheck | `tsc --noEmit` | both halves, tests included |
| build | `tsdown -c tsdown.config.ts` | `lib/index.mjs`, `lib/index.d.mts`, `lib/client.js` |
| test | `vitest run` | the suite below |

The suite is not only unit tests:

- one test file per module;
- a composition test driving `apply()` against a stub host (settings seam, web
  server seat, loader rows);
- a contract test validating planned output against the real
  `@deepseek-ai/dsh-llm-pi-ai@0.2.0-rc.2` schema — it skips itself when that
  package is absent, so a missing dev dependency never fails the suite;
- render tests for the settings page;
- a client-bundle test that loads the built `lib/client.js` through a stub
  `window.__ModuleLoader__` with the same seeded modules the shell provides. It
  needs a build first, which is why `verify` builds before testing.

Fixtures live in `test/fixtures.ts`; `test/stubs/` holds the fake host surfaces
(`fetch`, the locale service). A catalog payload there must stay shaped like
models.dev's `api.json`, because the contract test compares against the real
schema.

`vitest.config.ts` pins `pool: 'forks'` for a reason worth not undoing: a
happy-dom realm left in a shared worker keeps that worker's event loop alive, so
the run reports every test green and then never exits — a hung CI job rather than
a failure. A per-file child process is discarded when it finishes. The page test
opts into the DOM with a `// @vitest-environment happy-dom` comment; everything
else runs in node.

## Two halves

| half | entry | output | loaded by |
| --- | --- | --- | --- |
| host | `src/index.ts` | `lib/index.mjs` (ESM) | the DSH Loader, via the `cordis.patch.yml` row |
| browser | `src/client/index.tsx` | `lib/client.js` (CJS + `window.__ModuleLoader__` banner) | the Web shell, via `dsh.client` in `package.json` |

`src/core/` is shared, host-only logic (catalog, source parsing, planning,
applying) with no DSH import of its own, so it stays testable without a host.

`react` and `react/jsx-runtime` are external and resolved by the shell's module
seed — bundling a second React would break hooks. The page deliberately imports
no Harness Client package: shared UI modules change without notice, so it carries
its own controls (buttons, tags, checkbox, inputs) styled only with
`--dsw-alias-*` theme tokens, matching the shipped settings pages.

The bundle id must stay the package name: it is the cache key the loader serves
at `/plugins/<package>/client.js`.

## Client-only changes

The shell has to re-read the bundle after a rebuild:

- a rebuild is enough while the client-plugin HMR receiver is active (a Harness
  checkout keeps it alive with `pnpm run dev:web`);
- otherwise reload the page — the loader cache-busts on the bundle's revision;
- or restart DSH Desktop.

Host-only changes mount with the Loader: restart the profile, or let the
`cordis.patch.yml` HMR receiver reapply them.

## Continuous integration

`.github/workflows/test.yml` runs on every push to `main` and on every pull
request: `pnpm install --frozen-lockfile`, then `pnpm run verify` on Node 24. A
red job is almost always one of three things — a stale lockfile, a type error
that only shows under `tsc --noEmit`, or a render/bundle test that assumes an
unbuilt `lib/`. Run `pnpm run verify` locally before pushing; it is the same
command.

## macOS: vitest cannot start under the DSH runtime node

The node shipped with DSH Desktop is signed with the hardened runtime, while
rollup's native binary is ad-hoc signed. macOS refuses the load
(`ERR_DLOPEN_FAILED`, *"mapping process and mapped file (non-platform) have
different Team IDs"*), so `vitest` dies before collecting. Re-sign a copy of node
ad-hoc and run the suite with it:

```sh
mkdir -p .devnode && cp "$(command -v node)" .devnode/node
codesign --force --sign - .devnode/node
PATH="$PWD/.devnode:$PATH" pnpm run verify
```

`.devnode/` is git-ignored. This affects any project in this environment that
runs vitest, including `dsh-deep-sleep`.

## Releasing

Releases publish from the `release` workflow on a version tag:

```sh
git tag v0.1.0
git push origin v0.1.0
```

The workflow uses npm Trusted Publishing (OIDC, `id-token: write`), so no
`NPM_TOKEN` secret is stored. npm refuses to attach a trusted publisher to a
package that does not exist yet, so the first release has to be published once
from a logged-in machine (`npm login && npm publish`); afterwards attach the
publisher at the package's npm *Settings → Trusted publishing* page with this
repository and `release.yml`, and later tags publish without a token. The publish
step skips versions already on the registry, so re-pushing a tag is safe.

Before tagging:

1. bump `version` in `package.json` — the tag must match, and the publish step
   compares the two;
2. run `pnpm run verify`;
3. check `files` in `package.json` still carries everything a user needs — `lib/`,
   `cordis.patch.yml`, and the docs the README links to. `README.md` and
   `LICENSE` are added by npm itself; anything else must be listed;
4. `pnpm pack --dry-run` to see the tarball before it is published.

## Design constraints worth keeping

These are the invariants the tests lean on. A change that breaks one of them is a
design change, not a refactor:

- **Explicit mapping only.** No fuzzy match, no case folding across providers,
  no fallback to another provider. Anything unresolved is a refusal.
- **All-or-nothing per route.** One `set` op at
  `['providers', <route>, 'models']`, fenced by the revision re-read immediately
  before `mutate`. A refused route writes nothing; routes stay independent.
- **Declared fields win.** The planner only fills fields the profile leaves
  `undefined`.
- **Inert when unmapped.** `mapping: {}` means no catalog fetch, no cache write,
  no settings read — asserted by a test, so an unconfigured install cannot start
  doing network work.
- **Offline tolerant.** A failed fetch falls back to the cache, stale or not, and
  logs; it never refuses a pass for lack of network.
- **The user layer wins.** Where a hand edit shadows a bundle default, the hand
  edit is what gets read.
- **No second React, no bundled cordis.** Both are host singletons; the bundle
  test asserts the import set.
