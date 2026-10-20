import { defineConfig } from 'vitest/config'

export default defineConfig({
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
