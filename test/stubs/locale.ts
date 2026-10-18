/**
 * A translator that mimics the host's locale service.
 *
 * This is `LocaleFace.translate` from `@deepseek-ai/dsh-client-locale`, reduced
 * to the part that matters here: the resolved entry is treated as a string and
 * `String.prototype.replace` is called on it whenever parameters are passed. A
 * dictionary entry that is not a string therefore throws here exactly as it
 * throws in the running app — which is the failure this stub exists to catch.
 *
 * @param dictionaries - locale namespace -> (locale -> dictionary).
 * @param active - the active locale id.
 */
export function platformTranslator(
  dictionaries: Record<string, Record<string, unknown>>,
  active = 'zh',
): (ns: string) => (key: string, params?: Record<string, string | number>) => string {
  return (ns: string) => (key, params) => {
    // Mirrors `lookup(ns, key, chain) ?? key`: the fallback chain, then the key.
    const entry = dictionaries[ns]?.[key]
    const template = (entry === undefined ? key : entry) as string
    if (!params) return template
    return template.replace(/\{(\w+)\}/g, (match, name: string) =>
      name in params ? String(params[name]) : match,
    )
  }
}
