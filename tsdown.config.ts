/**
 * dsh-autofill-model-metadata build: the host half and the browser half.
 *
 * **Host half** — an ESM bundle for the dsh host. The only dependency is the
 * schemastery schema helper for the Config form, which stays external (tsdown
 * externalizes `dependencies`) because the host resolves it through the
 * profile's node_modules like every other plugin.
 *
 * **Browser half** — the DSH client contract, taken verbatim from the shipped
 * client bundles: a CJS module wrapped in `window.__ModuleLoader__.load({ id,
 * factory })`, whose factory returns the cordis plugin shape. `react` and the
 * shared UI packages are resolved through the loader's own `require` and must
 * therefore stay external — bundling a second React would break hooks. The
 * banner/footer are the wrapper the loader expects; without them the module
 * loads but never registers.
 */

/** Modules the loader resolves for a client bundle. */
const LOADER_PROVIDED = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  '@deepseek-ai/dsh-client-store',
  '@deepseek-ai/dsh-client-ui-primitives',
]

export default [
  {
    entry: ['src/index.ts'],
    format: 'esm',
    platform: 'node',
    target: 'es2024',
    outDir: 'lib',
    clean: true,
    dts: true,
  },
  {
    entry: { client: 'src/client/index.tsx' },
    format: 'cjs',
    platform: 'browser',
    target: 'es2022',
    outDir: 'lib',
    dts: false,
    clean: false,
    deps: { neverBundle: LOADER_PROVIDED },
    outputOptions: {
      entryFileNames: 'client.js',
      banner:
        'window.__ModuleLoader__.load({ id: "dsh-autofill-model-metadata", factory: (require) => { var module = { exports: {} }; var exports = module.exports;',
      footer: 'return exports; } });',
    },
  },
]
