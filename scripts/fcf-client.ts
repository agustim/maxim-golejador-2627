/**
 * Client mínim per a l'API interna de www.fcf.cat (Next.js).
 *
 * CloudFront sovint respon 403 a peticions sense capçaleres de navegador,
 * de manera que enviem un User-Agent real i reintentem amb backoff exponencial.
 */

export const BASE_URL = 'https://www.fcf.cat';

export const FCF_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'ca,es;q=0.9',
  Referer: `${BASE_URL}/`,
} as const;

/**
 * Retards entre reintents (ms). L'origen de la FCF respon 403/502 de manera
 * intermitent (CloudFront no connecta amb el backend); s'espera prou temps
 * (~6 minuts en total) abans de donar-ho per perdut.
 */
const BACKOFF_MS = [3_000, 6_000, 10_000, 20_000, 35_000, 60_000, 90_000, 120_000];

export class ApiError extends Error {
  readonly status: number | undefined;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export interface FcfApiOptions {
  /** Nombre màxim de reintents després del primer intent. Per defecte 8. */
  retries?: number;
  /** Temps límit de cada intent (ms). Per defecte 20 s. */
  timeoutMs?: number;
}

/**
 * Fa una petició GET a `https://www.fcf.cat/api/competition/<path>` i retorna el JSON.
 * Reintenta en cas d'error de xarxa, timeout o 4xx/5xx intermitents (403/429/5xx).
 */
export async function fcfApi<T>(
  path: string,
  { retries = 8, timeoutMs = 20_000 }: FcfApiOptions = {},
): Promise<T> {
  const url = `${BASE_URL}/api/competition/${path}`;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const resposta = await fetch(url, {
        headers: FCF_HEADERS,
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (resposta.ok) {
        return (await resposta.json()) as T;
      }

      lastError = new ApiError(`HTTP ${resposta.status} a ${path}`, resposta.status);

      // 404 vol dir que la ruta no existeix: no té sentit reintentar.
      if (resposta.status === 404) throw lastError;
    } catch (error) {
      lastError = error;
    }

    if (attempt < retries) {
      const espera = BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)];
      const motiu = lastError instanceof Error ? lastError.message : String(lastError);
      console.warn(`[fcf] ${path}: reintent ${attempt + 1}/${retries} en ${espera / 1000}s — ${motiu}`);
      await sleep(espera);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
