import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      // The shared UI kit is only resolvable inside the DSH Web shell, where the
      // module loader seeds it; the stubs keep the views renderable in Node.
      '@deepseek-ai/dsh-client-ui-primitives': fileURLToPath(
        new URL('./test/stubs/primitives.tsx', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'node',
    // `forks` runs every test file in its own child process. The page tests need
    // jsdom, and a jsdom realm left in a shared worker keeps that worker's event
    // loop alive: the run reports every test green and then never exits, which
    // shows up as a hung CI job rather than a failure. A per-file process is
    // discarded when it finishes, so nothing can outlive the suite.
    pool: 'forks',
  },
})
