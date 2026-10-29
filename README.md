# dsh-autofill-model-metadata

English | [中文](README.zh.md)

Fill a DSH gateway route's model metadata (`name`, `contextWindow`, `maxTokens`,
`input`, `reasoningEfforts`) from the [models.dev](https://models.dev) catalog —
**using only the mappings you declare by hand**.

This is a port of the `pi-autofill-model-metadata` Pi extension: the same
explicit-mapping philosophy, moved onto the DSH settings seam.

## Why explicit mapping

DSH has no native metadata filling. The plugins that do it fall into two camps:
provider-level refresh (`dsh-models-dev`: `sources: { route: <models.dev-provider> }`)
and loose name matching. Both guess. This plugin refuses to:

- You write down, per route and per local model id, exactly which models.dev
  model it is: `mapping.<route>.<localModelId> = "<modelsDevProvider>/<modelsDevModel>"`.
- No fuzzy match, no case folding across providers, no searching another
  provider when a lookup fails.
- Anything unmapped, unknown, or ambiguous is a **refusal**, not a guess. A route
  whose plan refuses is not written at all — you never get a half-filled array.

Declared fields always win: the plugin only fills fields the profile leaves
`undefined`.

## Install

Requires DSH `>= 0.2.0-rc.2` (the `engines.dsh` range in `package.json`) and
`pnpm` on `PATH`, because `dsh plugin` forwards its arguments to pnpm inside the
profile directory.

### From npm (recommended)

```sh
npm view dsh-autofill-model-metadata version        # the latest published version
dsh plugin --profile web add dsh-autofill-model-metadata@<version>
```

`--profile` names the profile you actually boot: `web` for the browser UI,
`headless` for one-shot runs, or your own profile name. Pin the version: pnpm ≥ 11
won't resolve a version published within its `minimumReleaseAge` window (1 day by
default), so an unpinned `add` picks an older build or fails with
`ERR_PNPM_NO_MATURE_MATCHING_VERSION`. Docker/CLI installs can use the zero-install
entry point instead:

```sh
npx -y @deepseek-ai/dsh plugin --profile web add dsh-autofill-model-metadata@<version>
```

Removing it again is the same verb:

```sh
dsh plugin --profile web remove dsh-autofill-model-metadata
```

### From a checkout

Useful while developing the plugin. `link:` installs and rebuilds nothing, but
the checkout must have been built (`pnpm install && pnpm run build`) so `lib/`
exists:

```sh
DSH="/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh"   # macOS Desktop
"$DSH" plugin --profile desktop add link:/absolute/path/to/dsh-autofill-model-metadata
```

`desktop` is owned by the Desktop app, so manage it with the Desktop runtime's
`dsh` binary; for a CLI profile use `dsh plugin --profile <name> add link:<path>`.

### Verify, then restart

Bundle membership is read at startup, so restart the profile (or DSH Desktop)
afterwards. To confirm the row is composed without booting:

```sh
dsh --profile web --dump-config | grep -A3 'id: dsh-autofill-model-metadata'
```

An installed plugin is **inert until a mapping is declared**: no catalog fetch,
no settings write. Declaring it — through the settings page or by editing the
profile's `cordis.patch.yml` — is covered in [CONFIGURATION.md](CONFIGURATION.md).

<details>
<summary><strong>For LLM</strong> — agent install instructions</summary>

If you are an agent whose task is to install this plugin, take the **npm path**
above — do not clone the repository, build it, or install from a git spec. Follow
these steps:

1. Find the profile to install into: `ls "${DSH_HOME:-$HOME/.dsh}/profiles"`,
   and prefer the one the user actually boots (`web` for the browser UI).
   `desktop` belongs to DSH Desktop and needs that app's own `dsh` binary.
2. Install a pinned version:
   `dsh plugin --profile <profile> add dsh-autofill-model-metadata@<version>`.
   Exit code 0 only means pnpm resolved the package; confirm the dependency with
   `dsh plugin --profile <profile> list --depth 0` and the composed row with
   `dsh --profile <profile> --dump-config`. If pnpm answers
   `ERR_PNPM_NO_MATURE_MATCHING_VERSION`, the version is younger than its
   `minimumReleaseAge` window — pick an older published version
   (`npm view dsh-autofill-model-metadata versions`) rather than disabling the
   setting.
3. Restart the profile so the new bundle mounts. Do not hot-patch around this.
4. Leave the configuration to the operator. An empty `mapping` is the correct
   post-install state — **never invent mappings**; every mapping must name a
   models.dev record the operator has chosen. Configuration steps, file
   locations and the catalog search endpoint are in
   [CONFIGURATION.md](CONFIGURATION.md); report anything you are unsure of
   instead of guessing.

If pnpm refuses the package with an `allowBuilds` message, that only happens for
git-sourced installs, which this package does not need: the published tarball
already ships `lib/`.

</details>

## Configure

Full guide — where the config lives, how to write the mapping, refusals and
troubleshooting: **[CONFIGURATION.md](CONFIGURATION.md)**. The short version
follows.

The config accepts these fields (the graphical page edits the mapping; the rest
is edited in the profile's `cordis.patch.yml`):

```jsonc
{
  "mapping": {
    // route name as it appears in Settings → Models
    "my-gateway": {
      // local model id on the wire  ->  models.dev provider/model
      "claude-opus-4-5": "anthropic/claude-opus-4-5",
      "gemini-3-pro": "google/gemini-3-pro-preview"
    }
  },
  "modelsDevUrl": "https://models.dev/api.json",
  "cacheTTLHours": 24,
  "applyOnStart": true,
  "dryRun": false,
  "requireCompleteMapping": true,
  "builtinSettingsForm": "auto"
}
```

| field | default | meaning |
| --- | --- | --- |
| `mapping` | `{}` | the declared table; empty means the plugin does nothing at all |
| `modelsDevUrl` | `https://models.dev/api.json` | catalog endpoint |
| `cachePath` | `$DSH_HOME/plugins/dsh-autofill-model-metadata/models.dev.json` | catalog cache |
| `cacheTTLHours` | `24` | cache lifetime; `0` refetches every time |
| `applyOnStart` | `true` | apply once when the plugin mounts |
| `dryRun` | `false` | plan and log, write nothing |
| `requireCompleteMapping` | `true` | undeclared models on a mapped route are an error |
| `builtinSettingsForm` | `"auto"` | `auto` / `always` / `never` — see [Settings](#settings) |

Manual run, from any local browser session (`<port>` is the DSH web server):

```sh
BASE=http://127.0.0.1:<port>/api/dsh-autofill-model-metadata
curl -X POST $BASE/apply   -H 'content-type: application/json' -d '{}'   # {"route":"..."} to narrow
curl $BASE/status                                                        # mapping state, no catalog fetch
curl $BASE/inspect                                                       # same, resolved against the catalog
curl "$BASE/catalog?q=gpt-5.4&limit=10"                                  # candidate mapping targets
curl -X POST $BASE/mapping -H 'content-type: application/json' \
  -d '{"mapping":{"my-route":{"fast-model":"openai/gpt-5.4"}},"apply":true}'
```

Every endpoint is loopback-only and answers `403` to anything else; `/apply`,
`/mapping` and `/page-live` are `POST`, the rest are `GET`.

`/mapping` answers `200` once the write lands, even when a requested fill is then
refused: the mapping really was saved, and a failed pass is reported separately in
`applyError` rather than disguised as a failed save. `/status` and `/inspect`
answer with the mapping read from the stored configuration, not from the volatile
copy the loader refreshes a moment after a write.

## Settings

The plugin ships a graphical settings page, and it also honours the host's
`autoGenerate` flag for the schema above — so a host that renders generated
forms, now or in a later version, keeps showing one whenever this page is not
there.

| `builtinSettingsForm` | behaviour |
| --- | --- |
| `"auto"` (default) | the generated form stays available until the browser half loads and reports in (`POST /page-live`) |
| `"always"` | the generated form is never suppressed |
| `"never"` | the generated form is suppressed as soon as the plugin mounts |

`true`/`false` are accepted as aliases for `always`/`never`.

**What "the original form" means in 0.2.0-rc.2.** It is worth being exact here:
the shipped client contains no generic schema-driven form renderer at all. Every
official settings page (`Models`, `Shell`, `Agent loop`, …) is a hand-written
companion package, and `autoGenerate` is carried by the settings transport but
consumed by nothing yet. So on this version the surfaces for a plugin config are:

1. this page, when its bundle loads;
2. the profile's own configuration document, always — hand-editable, and the
   thing the page writes back to;
3. a generated form, on any host that starts rendering one.

The `auto` policy is what keeps (3) honest: it does not suppress the flag until
the page has actually reported in, so a page that never loads never costs you a
surface. The page's own failure banner says the same thing when its host
endpoints are unreachable.

The page appears as **Settings → Model metadata**. It lists only *relevant*
routes — a route the profile configures, or one that appears in the mapping — so
the dozens of providers the host advertises but nobody configured cannot bury
the ones that matter. A mapped route the host does not offer is still listed,
with its reason, so a typo cannot hide. Each card shows: every declared model, the fields it declares by hand (never overwritten),
what a pass would fill, the mapping source in an editable field with catalog
search, and the refusals that would apply. **Save mapping** writes the whole
table in one revision-fenced op; **Save and fill** does that and runs a pass.
Nothing is written until you save, unsaved edits survive a reload, and a dry run
or an already-complete route is reported as exactly that rather than as a fill.

Both the page and the config document end up in the same settings service. The
page reads the settings revision along with its state and sends it back when
saving, so an edit made in the config document while the page sat open makes the
save **fail closed** — the page is told the mapping moved and to reapply — rather
than replacing the whole table with what the page happened to be showing. A fill
pass re-reads and re-plans the route inside the same fence, so a model added by
hand between planning and writing is never dropped: the pass refuses instead.
Without a revision from the caller there is nothing to compare against, so the
freshest one is used and the write proceeds.

## What gets filled

| local field | from models.dev | rule |
| --- | --- | --- |
| `name` | `model.name` | |
| `contextWindow` | `limit.context` | written only when `> 0` |
| `maxTokens` | `limit.output` | written only when `> 0` |
| `input` | `modalities.input` | `image` present → `['text','image']` |
| `reasoningEfforts` | `reasoning_options` (`effort` values) | see below |

`reasoningEfforts` follows the pi-ai schema, where a map containing only `off`
is invalid:

- effort values present → map them, including `none` → `off`;
- only `off` usable, or `reasoning: false` → `false`;
- catalog says nothing → field left absent, so the profile's own default stands.

A model is eligible only when `tool_call === true` and `status !== 'deprecated'`.
Eligibility is checked but never written — the plugin does not flip `tool_call`.

## Refusals

Per route, all-or-nothing. A refused route writes nothing.

| kind | when |
| --- | --- |
| `malformed-source` | the mapping value is not `provider/model` |
| `unknown-provider` | that provider id is not in the catalog |
| `unknown-model` | that model id is not under that provider |
| `ambiguous-source` | several catalog models match case-insensitively |
| `not-agent-capable` | matched model cannot call tools, or is deprecated |
| `missing-mapping` | `requireCompleteMapping` and a route model is undeclared |
| `undeclared-mapping` | a mapping points at a model the route does not configure |

`undeclared-mapping` fires even with `requireCompleteMapping: false`, so a typo
in a local id is never silently ignored.

## Development and releasing

Building, testing, the two halves of the bundle, CI, the macOS vitest workaround
and the release process all live in **[CONTRIBUTING.md](CONTRIBUTING.md)**.

```sh
pnpm install
pnpm run verify     # tsc --noEmit && tsdown && vitest
```

## Limitations

- Reads models.dev only; no other metadata source.
- Never invents a mapping: unmapped models stay untouched.
- Does not touch `tool_call`, `status`, `cost`, or `compat`.
- Applies on mount and on config edit; there is no scheduled refresh — use the
  `apply` endpoint or restart to force one.
