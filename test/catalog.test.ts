import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CatalogStore, validateCatalog } from '../src/core/catalog.ts'
import { CATALOG } from './fixtures.ts'

/** A fresh cache file path inside a throwaway directory. */
function cachePath(): string {
  return join(mkdtempSync(join(tmpdir(), 'dsh-meta-')), 'models.dev.json')
}

/** A fetch double answering one payload. */
function fetchOk(payload: unknown = CATALOG) {
  return vi.fn(async () => ({ ok: true, status: 200, json: async () => payload })) as unknown as typeof fetch
}

/** A fetch double that always fails. */
function fetchDown(message = 'getaddrinfo ENOTFOUND models.dev') {
  return vi.fn(async () => {
    throw new Error(message)
  }) as unknown as typeof fetch
}

describe('validateCatalog', () => {
  it('accepts a well-formed payload', () => {
    expect(validateCatalog(CATALOG)).toBe(CATALOG)
  })

  it('rejects payloads that are not a models.dev catalog', () => {
    expect(() => validateCatalog(null)).toThrow(/not an object/)
    expect(() => validateCatalog({})).toThrow(/no providers/)
    expect(() => validateCatalog({ openai: 42 })).toThrow(/not an object/)
    expect(() => validateCatalog({ openai: { models: [] } })).toThrow(/non-object "models"/)
  })
})

describe('CatalogStore', () => {
  let path: string

  beforeEach(() => {
    path = cachePath()
  })

  it('fetches once and serves the cache within its lifetime', async () => {
    const fetchImpl = fetchOk()
    const store = new CatalogStore({ url: 'https://models.dev/api.json', cachePath: path, ttlMs: 60_000, fetchImpl })

    const first = await store.load()
    expect(first.fromCache).toBe(false)
    const second = await store.load()
    expect(second.fromCache).toBe(true)
    expect(second.stale).toBe(false)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(Object.keys(second.data)).toEqual(Object.keys(CATALOG))
  })

  it('refetches when the cache expired and when forced', async () => {
    const fetchImpl = fetchOk()
    const store = new CatalogStore({ url: 'https://models.dev/api.json', cachePath: path, ttlMs: 60_000, fetchImpl })
    await store.load()
    await store.load({ force: true })
    expect(fetchImpl).toHaveBeenCalledTimes(2)

    const eager = new CatalogStore({ url: 'https://models.dev/api.json', cachePath: path, ttlMs: 0, fetchImpl })
    await eager.load()
    expect(fetchImpl).toHaveBeenCalledTimes(3)
  })

  it('falls back to the cached catalog when the network is down', async () => {
    const store = new CatalogStore({ url: 'https://models.dev/api.json', cachePath: path, ttlMs: 0, fetchImpl: fetchOk() })
    await store.load()

    const warn = vi.fn()
    const offline = new CatalogStore({ url: 'https://models.dev/api.json', cachePath: path, ttlMs: 0, fetchImpl: fetchDown(), logger: { warn } })
    const result = await offline.load()
    expect(result.stale).toBe(true)
    expect(result.fromCache).toBe(true)
    expect(Object.keys(result.data)).toEqual(Object.keys(CATALOG))
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('models.dev unreachable'))
  })

  it('throws when the network is down and nothing was cached', async () => {
    const store = new CatalogStore({ url: 'https://models.dev/api.json', cachePath: path, ttlMs: 0, fetchImpl: fetchDown() })
    await expect(store.load()).rejects.toThrow(/ENOTFOUND/)
  })

  it('rejects a malformed payload instead of caching it', async () => {
    const store = new CatalogStore({ url: 'https://models.dev/api.json', cachePath: path, ttlMs: 0, fetchImpl: fetchOk({ nope: true }) })
    await expect(store.load()).rejects.toThrow(/not an object/)
    expect(() => JSON.parse(readFileSync(path, 'utf8'))).toThrow()
  })

  it('surfaces a non-200 answer as a failure', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) })) as unknown as typeof fetch
    const store = new CatalogStore({ url: 'https://models.dev/api.json', cachePath: path, ttlMs: 0, fetchImpl })
    await expect(store.load()).rejects.toThrow(/HTTP 503/)
  })

  it('ignores a corrupt or unknown-shaped cache file', async () => {
    writeFileSync(path, '{ this is not json')
    const corrupt = new CatalogStore({ url: 'https://models.dev/api.json', cachePath: path, ttlMs: 60_000, fetchImpl: fetchOk() })
    const result = await corrupt.load()
    expect(result.fromCache).toBe(false)

    writeFileSync(path, JSON.stringify({ fetchedAt: Date.now(), data: { nope: 1 } }))
    const shaped = new CatalogStore({ url: 'https://models.dev/api.json', cachePath: path, ttlMs: 60_000, fetchImpl: fetchOk() })
    expect((await shaped.load()).fromCache).toBe(false)
  })

  it('writes the cache atomically, leaving no temp file behind', async () => {
    const store = new CatalogStore({ url: 'https://models.dev/api.json', cachePath: path, ttlMs: 60_000, fetchImpl: fetchOk() })
    await store.load()
    const files = readdirSync(join(path, '..'))
    expect(files).toEqual(['models.dev.json'])
    const envelope = JSON.parse(readFileSync(path, 'utf8'))
    expect(typeof envelope.fetchedAt).toBe('number')
    expect(Object.keys(envelope.data)).toEqual(Object.keys(CATALOG))
  })

  it('keeps working when the cache directory cannot be written', async () => {
    // A regular file used as a parent directory: `mkdirSync(recursive)` fails
    // with ENOTDIR everywhere, including the Linux runner. A path under /proc
    // was used here first and hung the CI job — that filesystem is not a normal
    // one, so it is exactly the kind of environment-dependent value a test must
    // not depend on.
    const blocker = join(mkdtempSync(join(tmpdir(), 'dsh-meta-file-')), 'not-a-dir')
    writeFileSync(blocker, 'x')
    const store = new CatalogStore({
      url: 'https://models.dev/api.json',
      cachePath: join(blocker, 'models.dev.json'),
      ttlMs: 60_000,
      fetchImpl: fetchOk(),
      logger: { warn: () => undefined },
    })
    const result = await store.load()
    expect(result.fromCache).toBe(false)
    expect(Object.keys(result.data).length).toBeGreaterThan(0)
  })
})
