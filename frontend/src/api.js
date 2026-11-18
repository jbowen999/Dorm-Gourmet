// Thin fetch wrapper for the backend. credentials: 'include' sends the
// session cookie, which every authenticated request depends on.
// Pass `signal` (from an AbortController) to cancel stale requests.
export async function api(path, { method = 'GET', body, signal } = {}) {
  const res = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
    signal,
  })

  if (!res.ok) {
    let message = `Request failed (${res.status})`
    let fieldErrors = {}
    try {
      const data = await res.json()
      if (data?.error) message = data.error
      // Per-field validation messages, e.g. { rating: "..." } from /api/reviews.
      if (data?.errors && typeof data.errors === 'object') {
        fieldErrors = data.errors
      }
    } catch {
      // Non-JSON error body; keep the generic message.
    }
    const err = new Error(message)
    err.status = res.status
    err.fieldErrors = fieldErrors
    throw err
  }

  if (res.status === 204) return null
  return res.json()
}
