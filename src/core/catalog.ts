/**
 * The models.dev catalog reader: one TTL-cached `api.json` read, with an
 * offline fallback to the last structurally valid copy.
 *
 * Download failure is never fatal when a previous copy exists — the plugin keeps
 * working against the last good catalog and says so (`stale: true`), which is
 * what makes an offline machine usable. The cache write is atomic (temp file +
 * rename), so an interrupted process cannot leave a half-written catalog that
 * the next start would reject.
 *
 * @module dsh-autofill-model-metadata/catalog
 */

import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

import type { Catalog, CatalogProvider } from './types.ts'

/** One catalog read. */
export interface CatalogLoad {
  data: Catalog
  /** True when the network read failed and the cached copy was served instead. */
  stale: boolean
  /** True when the payload came from the cache file rather than the network. */
  fromCache: boolean
  /** The epoch millis the served payload was fetched at, when known. */
  fetchedAt?: number
}

/** The on-disk cache envelope. */
interface CacheEnvelope {
  fetchedAt: number
  url: string
  data: Catalog
}

/** What the store needs; all fields explicit so tests can drive it offline. */
export interface CatalogStoreOptions {
  url: string
  cachePath: string
  /** Cache lifetime in milliseconds; 0 always refetches. */
  ttlMs: number
  /** Injected for tests; defaults to the global fetch. */
  fetchImpl?: typeof fetch
  /** Optional sink for the "serving a stale catalog" warning. */
  logger?: { warn?: (message: string) => void }
}

/** Whether one value is a plain object (not null, not an array). */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Validate a decoded models.dev payload, or throw naming what is wrong.
 *
 * Only the structure this plugin reads is checked, so a catalog that adds
 * providers and fields stays usable: the root must key providers, and every
 * provider's `models` — when present — must be an object.
 *
 * @param raw - the decoded payload.
 * @returns the payload, typed.
 * @throws Error when the payload is not a models.dev catalog.
 */
export function validateCatalog(raw: unknown): Catalog {
  if (!isPlainObject(raw)) throw new Error('models.dev payload is not an object')
  const providers = Object.keys(raw)
  if (providers.length === 0) throw new Error('models.dev payload declares no providers')
  for (const [providerId, provider] of Object.entries(raw)) {
    if (!isPlainObject(provider)) throw new Error(`models.dev provider "${providerId}" is not an object`)
    const models = (provider as CatalogProvider).models
    if (models !== undefined && !isPlainObject(models)) {
      throw new Error(`models.dev provider "${providerId}" has a non-object "models"`)
    }
  }
  return raw as Catalog
}

/** The TTL-cached models.dev reader. */
export class CatalogStore {
  private readonly options: CatalogStoreOptions

  constructor(options: CatalogStoreOptions) {
    this.options = options
  }

  /** Parse the cache file; undefined when absent, unreadable or invalid. */
  private readCache(): CacheEnvelope | undefined {
    try {
      const raw: unknown = JSON.parse(readFileSync(this.options.cachePath, 'utf8'))
      if (!isPlainObject(raw)) return undefined
      const { fetchedAt, url, data } = raw
      if (typeof fetchedAt !== 'number' || !Number.isFinite(fetchedAt)) return undefined
      return { fetchedAt, url: typeof url === 'string' ? url : '', data: validateCatalog(data) }
    } catch {
      // absent, unreadable or invalid: all the same to the caller
      return undefined
    }
  }

  /** Write the cache atomically (temp + rename), best effort. */
  private writeCache(envelope: CacheEnvelope): void {
    try {
      mkdirSync(dirname(this.options.cachePath), { recursive: true })
      const temp = join(
        dirname(this.options.cachePath),
        `.${process.pid}-${Math.random().toString(36).slice(2)}.tmp`,
      )
      writeFileSync(temp, JSON.stringify(envelope))
      renameSync(temp, this.options.cachePath)
    } catch (error) {
      this.options.logger?.warn?.(
        `dsh-autofill-model-metadata: cannot cache the models.dev catalog at ` +
          `${this.options.cachePath} (${error instanceof Error ? error.message : String(error)})`,
      )
    }
  }

  /**
   * Read the catalog, from the network when the cache is absent or expired.
   *
   * @param options.force - ignore the cache lifetime and refetch.
   * @returns the payload plus how it was obtained.
   * @throws Error when the network fails and no cached copy exists.
   */
  async load(options: { force?: boolean } = {}): Promise<CatalogLoad> {
    const cached = this.readCache()
    const fresh =
      cached !== undefined &&
      options.force !== true &&
      this.options.ttlMs > 0 &&
      Date.now() - cached.fetchedAt < this.options.ttlMs
    if (cached !== undefined && fresh) {
      return { data: cached.data, stale: false, fromCache: true, fetchedAt: cached.fetchedAt }
    }

    const fetchImpl = this.options.fetchImpl ?? fetch
    try {
      const response = await fetchImpl(this.options.url)
      if (response.ok !== true) {
        throw new Error(`${this.options.url} answered HTTP ${response.status}`)
      }
      const data = validateCatalog(await response.json())
      const fetchedAt = Date.now()
      this.writeCache({ fetchedAt, url: this.options.url, data })
      return { data, stale: false, fromCache: false, fetchedAt }
    } catch (error) {
      if (cached !== undefined) {
        this.options.logger?.warn?.(
          `dsh-autofill-model-metadata: models.dev unreachable — serving the cached catalog ` +
            `from ${new Date(cached.fetchedAt).toISOString()} (${error instanceof Error ? error.message : String(error)})`,
        )
        return { data: cached.data, stale: true, fromCache: true, fetchedAt: cached.fetchedAt }
      }
      throw error
    }
  }
}
