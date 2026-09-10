export type ApiErrorResponse = {
  errorMessage?: string;
  statusCode?: number;
  formErrors?: Record<string, string> | null;
};

/**
 * Extrae el cuerpo de error normalizado del backend (`ErrorResponse`) desde
 * cualquier `HttpErrorResponse`. Válido también cuando la respuesta no es JSON
 * (blob, timeout, red caída), donde `error.error` viene vacío.
 */
export function getApiErrorResponse(err: unknown): ApiErrorResponse | null {
  if (!err || typeof err !== 'object') return null;

  const payload: unknown = (err as { error?: unknown }).error;
  if (!payload || typeof payload !== 'object') return null;

  return { ...(payload as ApiErrorResponse) };
}

/**
 * Mensaje legible para mostrar en un toast. Las reglas de negocio de transición
 * de estado responden con códigos poco intuitivos (p. ej. 404 en
 * `ip.q.incoterms-required`), por lo que siempre se mapea por `errorMessage`.
 */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  return getApiErrorResponse(err)?.errorMessage ?? fallback;
}
