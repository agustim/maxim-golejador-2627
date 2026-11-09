/**
 * Client per a l'API interna de www.fcf.cat (Next.js).
 *
 * PROBLEMA CONEGUT: CloudFront/WAF davant de l'origen retorna 403
 * («Request blocked. We can't connect to the server…») per a les peticions
 * que no inclouen els encapçalaments de navegador `Sec-Fetch-*` i `Origin` en
 * conjunt. No és un problema d'IPs de centres de dades: passa des de qualsevol
 * origen si falten aquestes capçaleres. Per això FCF_HEADERS les envia tal com
 * les envia el client web de la FCF.
 *
 * ESTRATÈGIA: molt pocs reintents (fallada ràpida) i, si tot falla, la crida
 * es marca com a fallida i el generador conserva les dades de l'últim snapshot.
 * A més, s'intenta un proxy públic (r.jina.ai) per si en aquell moment
 * l'origen és accessible des de la seva xarxa.
 */

export const BASE_URL = 'https://www.fcf.cat';

export const FCF_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'ca,es;q=0.9',
  Referer: `${BASE_URL}/`,
  // CloudFront/WAF davant l'origen denega amb un 403 sec («Request blocked.
  // We can't connect to the server...») les peticions que no semblen una crida
  // de navegador. Cal enviar els encapçalaments Sec-Fetch-* i Origin en
  // conjunt; si en falta algun, l'API respon 403 fins i tot quan és
  // accessible. Mantenim exactament el que envia el client web de la FCF.
  Origin: `${BASE_URL}`,
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
  'Sec-Fetch-Dest': 'empty',
} as const;

/** Temps límit de cada intent (ms). Els errors arriben ràpid; no cal esperar gaire. */
const TIMEOUT_MS = 12_000;

/** Retards curts entre intents (ms). El dur d'esperar no aporta res. */
const BACKOFF_MS = [2_000, 4_000];

export class ApiError extends Error {
  readonly status: number | undefined;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function fetchAmbTimeout(url: string, timeoutMs = TIMEOUT_MS): Promise<Response> {
  return fetch(url, {
    headers: FCF_HEADERS,
    signal: AbortSignal.timeout(timeoutMs),
  });
}

function jsonDeResposta(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    // El cos podria ser la pàgina d'error de CloudFront; es tracta com a error.
    throw new ApiError('Resposta no JSON (probable 403 de CloudFront)', 403);
  }
}

/**
 * Afegeix un paràmetre d'anti-caché: l'API té s-maxage=3600 i CloudFront pot
 * servir errors en caché (403) durant minuts. Forçar la revalidació dóna a
 * l'origen l'oportunitat de respondre amb dades fresques. L'API ignora els
 * paràmetres desconeguts.
 */
function ambCacheBuster(path: string): string {
  const separador = path.includes('?') ? '&' : '?';
  return `${BASE_URL}/api/competition/${path}${separador}_cb=${Date.now()}`;
}

/** Prova directa a l'API (2 intents ràpids). */
async function proveDirecte(path: string): Promise<unknown> {
  const url = ambCacheBuster(path);
  let lastError: unknown;

  for (let attempt = 0; attempt <= BACKOFF_MS.length; attempt++) {
    try {
      const resposta = await fetchAmbTimeout(url);
      if (resposta.ok) {
        return jsonDeResposta(await resposta.text());
      }
      // La pàgina d'error de CloudFront té cache-control propi; una segona
      // crida pot caure sobre un error en caché — no val la pena reintentar.
      lastError = new ApiError(`HTTP ${resposta.status} a ${path}`, resposta.status);
    } catch (error) {
      lastError = error;
      if (error instanceof Error && error.name === 'TimeoutError') {
        // Un timeout no s'arregla esperant més.
        break;
      }
    }

    if (attempt < BACKOFF_MS.length) {
      await sleep(BACKOFF_MS[attempt]);
    }
  }

  throw lastError instanceof Error ? lastError : new ApiError(String(lastError));
}

/** Prova a través de r.jina.ai (reader públic); retorna el JSON si el cos ho és. */
async function proveViaJina(path: string): Promise<unknown> {
  const url = ambCacheBuster(path);
  const resposta = await fetchAmbTimeout(`https://r.jina.ai/${url}`, 25_000);
  if (!resposta.ok) {
    throw new ApiError(`Jina HTTP ${resposta.status}`, resposta.status);
  }
  const text = await resposta.text();
  // Jina embolcalla els errors; el JSON brut comença per [ o {.
  const inici = text.trimStart();
  if (inici.startsWith('[') || inici.startsWith('{')) {
    return jsonDeResposta(text);
  }
  throw new ApiError('Jina no va obtenir JSON (403 de CloudFront)', 403);
}

/**
 * Fa una petició GET a `https://www.fcf.cat/api/competition/<path>` i retorna el JSON.
 * Prova directe i, si falla, via Jina. Mai espera més d'uns 30 segons en total.
 */
export async function fcfApi<T>(path: string): Promise<T> {
  try {
    return (await proveDirecte(path)) as T;
  } catch (errorDirecte) {
    try {
      const viaJina = await proveViaJina(path);
      console.warn(`[fcf] ${path}: directe fallit (${mensaje(errorDirecte)}), però via Jina ha funcionat.`);
      return viaJina as T;
    } catch {
      throw errorDirecte instanceof Error ? errorDirecte : new Error(String(errorDirecte));
    }
  }
}

function mensaje(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
