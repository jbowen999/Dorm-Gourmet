/** Thrown for non-2xx responses. `errors` holds per-field validation messages. */
export class ApiError extends Error {
  constructor(status, message, errors = {}) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

/**
 * fetch() wrapper for the Express API: sends and parses JSON, includes the
 * session cookie, and throws ApiError on failure.
 */
export async function apiFetch(path, { method = "GET", body, signal } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    signal,
    credentials: "same-origin",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, data?.error || res.statusText, data?.errors);
  }
  return data;
}

/** Builds "?a=1&b=2" from an object, skipping empty values. */
export function toQueryString(params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, Array.isArray(value) ? value.join(",") : String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}
