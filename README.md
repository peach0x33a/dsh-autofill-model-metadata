# dsh-autofill-model-metadata

English | [中文](README.zh.md)

Fills in a DSH gateway route's model metadata — `name`, `contextWindow`,
`maxTokens`, `input`, `reasoningEfforts` — from the
[models.dev](https://models.dev) catalog, using **only the mappings you declare
by hand**.

DSH has no native metadata filling, and the plugins that add it guess: they
refresh a whole provider from a catalog, or match model names loosely. This one
does neither. You write down which models.dev record each of your model ids is,
and anything ambiguous is refused rather than filled.

A port of the Pi extension `pi-autofill-model-metadata`, moved onto the DSH
settings seam.

## Why explicit mapping

- **You say what each model is.** One line per route and local model id:
  `mapping.<route>.<localModelId> = "<provider>/<model>"`.
- **No guessing.** No fuzzy matching, no case folding across providers, no trying
  another provider when a lookup fails.
- **All or nothing.** A route that does not resolve completely is not written at
  all, so you never get a half-filled model list.
- **Your fields win.** The plugin only fills fields you left empty.

## Install

Needs DSH `>= 0.2.0-rc.2` and `pnpm` on `PATH`.

```sh
npm view dsh-autofill-model-metadata version
dsh plugin --profile web add dsh-autofill-model-metadata@<version>
```

`--profile` is the profile you actually boot (`web` for the browser UI,
`headless` for one-shot runs). Pin the version: pnpm ≥ 11 will not resolve a
release published within its `minimumReleaseAge` window. Then restart the profile
so the bundle mounts.

The plugin stays inert — no catalog fetch, no settings write — until you declare
a mapping. [CONFIGURATION.md](CONFIGURATION.md) covers where that goes.

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

## Looking for the Pi or OpenCode implementation?

This plugin is a port, and the same idea exists on other harnesses:

- [**pi-extensions**](https://github.com/peach0x33a/pi-extensions) —
  `pi-autofill-model-metadata`, the Pi extension this plugin was ported from.
- [**opencode-plugins**](https://github.com/chisaato/opencode-plugins) —
  `opencode-auto-model-config`, the OpenCode plugin that inspired both.

## Documentation

| document | covers |
| --- | --- |
| [CONFIGURATION.md](CONFIGURATION.md) | where the config lives, the mapping, every field, the settings page, what gets filled, refusals, troubleshooting, limitations |
| [CONTRIBUTING.md](CONTRIBUTING.md) | building, tests, the two bundle halves, CI, releasing |

## License

MIT — see [LICENSE](LICENSE).
