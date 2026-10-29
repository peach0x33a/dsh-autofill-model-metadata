# Configuring dsh-autofill-model-metadata

This plugin has exactly one job: read the models.dev catalog, and copy `name`,
`contextWindow`, `maxTokens`, `input` and `reasoningEfforts` into the models you
declared, using **only** the mapping you wrote by hand. Everything here follows
from that.

A freshly installed plugin is inert: with `mapping: {}` there is no catalog
fetch, no cache write and no settings read. Nothing happens until you declare a
mapping.

- [Where the configuration lives](#where-the-configuration-lives)
- [The mapping](#the-mapping)
- [Field reference](#field-reference)
- [Two ways to edit it](#two-ways-to-edit-it)
- [Applying and verifying](#applying-and-verifying)
- [Refusals: why nothing was written](#refusals-why-nothing-was-written)
- [Troubleshooting](#troubleshooting)

## Where the configuration lives

DSH 0.2.0-rc.2 has **one** place where a live plugin config is stored: the
**active profile's patch file**, `$DSH_HOME/profiles/<profile>/cordis.patch.yml`,
as the `config:` of the row whose `id` is `dsh-autofill-model-metadata`.

- The settings page writes that row (through `ctx.settings` /
  `dsh-config-editor`), and so do you when you edit it by hand. There is no
  second document: `$DSH_HOME/settings.yaml` is a legacy file that a 0.2 host
  imports once into the active profile and then renames to
  `settings.yaml.imported`.
- `$DSH_HOME` defaults to `~/.dsh`. The profile is the one you boot: `web` for
  the browser UI, `headless` for one-shot runs, `desktop` for DSH Desktop.
  Settings are **per profile** — an edit made in one is invisible to the other.

The row is matched by **`id`**, and the settings form namespace is that same
`id`. The value the plugin reads is the Loader's resolved Config, composed as:

1. schema defaults ([field reference](#field-reference));
2. the row's `config:` — from the bundle layer if the profile has no row for it,
   or from the profile row, which replaces the bundle config wholesale.

So the profile row is an override of the whole `config`, not a patch into it:
a row you write must restate every key it needs.

Two layers outrank the profile row and cannot be written from the settings page:

| layer | file | note |
| --- | --- | --- |
| home patch | `$DSH_HOME/cordis.patch.yml` | applies to every profile; a form write it would shadow is refused before persisting |
| command-line overlay | `--patch <path>` | highest priority; same refusal |

If a value refuses to save from the page, look for an override in one of those
two before anything else.

## The mapping

`mapping.<route>.<localModelId> = "<models.dev provider>/<models.dev model>"`

- `<route>` — the provider route name, exactly as it appears in
  **Settings → Models** (the key under `llm-pi-ai.providers`).
- `<localModelId>` — the `id` the route declares, i.e. the model id sent on the
  wire, which is often *not* the catalog id.
- the value — a models.dev catalog id pair. Both halves are catalog ids, not
  local ones, and the pair must exist in the catalog.

```yaml
mapping:
  my-gateway:
    # local wire id      ->  models.dev provider/model
    fast-model: google/gemini-flash-latest
    reasoner: anthropic/claude-opus-4-5
  another-gateway:
    claude-opus-4-5: anthropic/claude-opus-4-5
```

Two rules the plugin will not bend:

- **No guessing.** Lookup is exact: no fuzzy match, no case folding across
  providers, no falling back to another provider when a lookup fails.
- **Declared fields win.** A field the profile already sets is never
  overwritten; only fields that are `undefined` are filled.

Do not find catalog ids by hand-scraping the catalog when you can ask the
plugin. With DSH running, the search endpoint lists candidate targets:

```sh
curl "http://127.0.0.1:<port>/api/dsh-autofill-model-metadata/catalog?q=gpt-5.4&limit=10"
```

The answer includes `source` (the exact `provider/model` string to paste),
name, context window, token cap, input modalities and `usable` (whether the
model can call tools and is not deprecated). The settings page's **Search
catalog** box is the same query.

## Field reference

| field | type | default | meaning |
| --- | --- | --- | --- |
| `mapping` | `{ route: { modelId: "provider/model" } }` | `{}` | the declared table; empty means the plugin does nothing at all |
| `modelsDevUrl` | string | `https://models.dev/api.json` | catalog endpoint |
| `cachePath` | string | `$DSH_HOME/plugins/dsh-autofill-model-metadata/models.dev.json` | catalog cache file |
| `cacheTTLHours` | number ≥ 0 | `24` | cache lifetime; `0` refetches every time |
| `applyOnStart` | boolean | `true` | run one pass when the plugin mounts |
| `dryRun` | boolean | `false` | plan and log, write nothing |
| `requireCompleteMapping` | boolean | `true` | an undeclared model on a mapped route refuses the whole route |
| `builtinSettingsForm` | `"auto"` \| `"always"` \| `"never"` | `"auto"` | whether the host's schema-generated form is kept; `true`/`false` are aliases for `always`/`never` |

Every field is volatile: an edit through the settings service is applied
without remounting the plugin.

What a pass writes, per local model:

| local field | taken from models.dev | rule |
| --- | --- | --- |
| `name` | `model.name` | |
| `contextWindow` | `limit.context` | only when `> 0` |
| `maxTokens` | `limit.output` | only when `> 0` |
| `input` | `modalities.input` | `image` present → `['text','image']` |
| `reasoningEfforts` | `reasoning_options` (`effort` values) | see below |

`reasoningEfforts` maps effort levels to wire spellings (`none` → `off`); a
model with no usable effort level, or `reasoning: false`, gets `false`; a
catalog record that says nothing leaves the field absent so the profile's own
default stands. A model is eligible only when `tool_call === true` and
`status !== 'deprecated'` — eligibility is checked, never written.

## Two ways to edit it

### 1. The settings page (recommended)

**Settings → Model metadata**. Each card is one route and shows the declared
models, which fields are hand-declared (never overwritten), what a pass would
fill, the mapping source in an editable field with catalog search, and any
refusals that would apply.

- **Save mapping** writes the whole table in one revision-fenced operation.
- **Save and fill** does that and runs a pass.
- Nothing is written until you save, and unsaved edits survive a reload.

The page reads the settings revision together with its state and sends it back
when saving, so an edit made in the profile patch file while the page sat open
makes the save **fail closed** (reload and reapply) rather than replacing the
whole table with what the page happened to be showing.

If the page does not load, the host's generated form (or a hand edit) remains
available — that is what the default `builtinSettingsForm: "auto"` guarantees.

### 2. The profile patch file by hand

Same row, written directly. This is the file the page writes, so a hand edit and
a page save address the same value:

```yaml
# $DSH_HOME/profiles/web/cordis.patch.yml
- id: dsh-autofill-model-metadata
  name: dsh-autofill-model-metadata
  config:
    mapping:
      my-gateway:
        fast-model: google/gemini-flash-latest
        reasoner: anthropic/claude-opus-4-5
    cacheTTLHours: 12
    dryRun: false
    requireCompleteMapping: true
```

Rules that bite:

- **Keep `name:`.** A patch targets a row by `id`, and a mismatched `name` is
  silently skipped — the edit just does nothing.
- **Restate every key.** A patch replaces the row's **whole** `config` value
  rather than deep-merging keys, so an omitted key falls back to the schema
  default, not to the lower layer's value.
- **The plugin's bundle row is already inserted by the install.** Writing this
  row is an *override*, needed when you want config the install does not ship —
  not a prerequisite for the plugin to mount.
- A hand edit is picked up by hot reload when `dsh-hmr` is mounted, otherwise on
  restart. Either way the plugin re-applies its mapping when the Loader reports
  the new config.

The page's mapping and this file's `mapping:` are one value, so do not write
both "in parallel" and expect them to merge: whichever is saved last wins, and
the page will refuse a save when it can tell the file moved underneath it.

### Choosing a route to map

The page lists only *relevant* routes — a route the profile configures, or one
that appears in the mapping. A mapped route the host does not offer is still
listed, with its reason, so a typo cannot hide. With no routes at all, add a
custom provider and its models under **Settings → Models** first.

## Applying and verifying

A pass runs when the plugin mounts (`applyOnStart`), and on a config edit. There
is no scheduled refresh; force one when you need it.

```
BASE=http://127.0.0.1:<port>/api/dsh-autofill-model-metadata

curl -X POST $BASE/apply -H 'content-type: application/json' -d '{}'   # all routes; {"route":"my-gateway"} for one
curl $BASE/status                                                      # mapping state, no catalog fetch
curl $BASE/inspect                                                     # the same, resolved against the catalog
```

| endpoint | method | purpose |
| --- | --- | --- |
| `/apply` | POST | run a pass now, optionally narrowed with `{"route": "..."}` |
| `/status` | GET | mapping, revision, refusals, last pass — reads no catalog |
| `/inspect` | GET | the route report resolved against the catalog (loads it if needed) |
| `/catalog?q=` | GET | candidate mapping targets |
| `/mapping` | POST | replace the whole table, `{"mapping": {...}, "apply": true}` |

Every endpoint is loopback-only and answers `403` to anything else. `/mapping`
answers `200` once the write lands, even when a requested fill is then refused:
the mapping really was saved, and a failed pass is reported separately in
`applyError`. `/status` and `/inspect` answer with the mapping read from the
stored configuration, not from the volatile copy the loader refreshes a moment
after a write.

Check the effect on the route itself: the filled fields land in that provider's
`llm-pi-ai.providers.<route>.models` array, and the adapter picks them up on the
next request without a restart.

`dryRun: true` is the safe way to see the plan: the pass logs what it *would*
write and writes nothing.

## Refusals: why nothing was written

Per route, all-or-nothing: a refused route writes nothing at all, so you never
get a half-filled models array. Routes are independent — one refusal does not
block another.

| kind | when |
| --- | --- |
| `malformed-source` | the mapping value is not `provider/model` |
| `unknown-provider` | that provider id is not in the catalog |
| `unknown-model` | that model id is not under that provider |
| `ambiguous-source` | several catalog models match case-insensitively |
| `not-agent-capable` | the matched model cannot call tools, or is deprecated |
| `missing-mapping` | `requireCompleteMapping` is on and a route model is undeclared |
| `undeclared-mapping` | a mapping names a local model the route does not configure |

`undeclared-mapping` fires even with `requireCompleteMapping: false`, so a typo
in a local id is never silently ignored. A route name that is not a configurable
provider of `llm-pi-ai` is reported too, with the reason
`route "<name>" is not a configurable provider of llm-pi-ai` — a typo cannot
hide behind a silent skip.

Turning `requireCompleteMapping` off is the intended way to fill a few models of
a route while leaving others alone — unmapped models are simply untouched. It
does not weaken any other check.

## Troubleshooting

**Nothing happened after install.** There is no mapping yet — that is the
correct post-install state. Declare one, then `POST /apply`.

**A route refuses with `unknown-*` / `ambiguous-source`.** The catalog has moved
or the id is spelled differently. Ask `/catalog?q=` for the exact `source`, and
remember that the *local* model id on the left is the wire id, not the catalog
id.

**A mapped field is not filled.** It is already declared by the profile (declared
fields win), the catalog value was `0`/absent, the model is not tool-capable or
is deprecated, or `dryRun` is on.

**The page's save says the mapping moved.** The profile patch changed while the
page was open (another window, or a hand edit). Reload and reapply your edit; the
page refuses rather than overwriting.

**A save is refused with "overridden by a home patch or command-line overlay".**
A `$DSH_HOME/cordis.patch.yml` row or a `--patch` overlay shadows this row. The
settings page cannot write through a higher layer — edit that layer instead, or
remove the override.

**The page does not appear.** The host-generated form is kept until the browser
half reports in, and stays if the bundle never loads. Check that the client half
is served at `/plugins/dsh-autofill-model-metadata/client.js`, then reload the
page or restart DSH.

**Read the plugin's own trace.** The host half appends one line per bootstrap and
per pass to:

```
$DSH_HOME/plugins/dsh-autofill-model-metadata/bootstrap.log
```

It records whether the settings seam and the web-server seat were claimed,
whether the catalog loaded (`stale=` tells you it came from cache), and the
outcome of every route, including the refusal reasons. The catalog cache itself
lives beside it in `models.dev.json`; deleting it forces a refetch. A failed
fetch never takes a pass down: it falls back to the cache, stale or not.

**Reach the catalog through a proxy or a mirror.** Point `modelsDevUrl` at it;
`cacheTTLHours: 0` refetches on every pass.
