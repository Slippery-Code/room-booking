/** Outcome of a domain operation: rule failures are values, never exceptions. */
export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };
