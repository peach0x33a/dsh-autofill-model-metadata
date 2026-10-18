/**
 * A `fetch` double standing in for the plugin's own host endpoints.
 *
 * The container talks to `/api/dsh-autofill-model-metadata/*`; this stub answers
 * those from canned payloads and records what was requested, so the page's
 * load/save state machine can be driven in a test without a host.
 */
export interface RecordedCall {
  url: string
  method: string
  body?: string
}

/** The canned answers, by endpoint name. */
export interface EndpointAnswers {
  status?: unknown
  inspect?: unknown
  mapping?: unknown
  apply?: unknown
  catalog?: unknown
}

/** Build a fetch double over canned answers. */
export function stubFetch(answers: EndpointAnswers): { fetch: typeof fetch; calls: RecordedCall[] } {
  const calls: RecordedCall[] = []
  const impl = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const url = String(input)
    const method = init?.method ?? 'GET'
    calls.push({ url, method, body: typeof init?.body === 'string' ? init.body : undefined })
    const pick = (): { body: unknown; status?: number } => {
      if (url.endsWith('/status')) return { body: answers.status ?? { ok: true, mapping: {}, reports: [], last: [], log: [] } }
      if (url.endsWith('/inspect')) return { body: answers.inspect ?? { ok: true, mapping: {}, reports: [] } }
      if (url.endsWith('/mapping')) return { body: answers.mapping ?? { ok: true, mapping: {} } }
      if (url.endsWith('/apply')) return { body: answers.apply ?? { ok: true, results: [], log: [] } }
      if (url.includes('/catalog')) return { body: answers.catalog ?? { ok: true, candidates: [], count: 0, query: '', limit: 30 } }
      return { body: { ok: false, error: 'not found' }, status: 404 }
    }
    const { body, status } = pick()
    return {
      ok: status === undefined || status < 400,
      status: status ?? 200,
      json: async () => body,
    } as Response
  }
  return { fetch: impl as unknown as typeof fetch, calls }
}
