/**
 * Genera src/data/scorers.json amb els màxims golejadors de la competició
 * configurada a src/config.ts (Futbol 11 · Juvenil Segona Divisió · 2026-27).
 *
 * - Resol els grupId dinàmicament des de l'API (cap ID no està hardcoded).
 * - Si GRUPS_INCLOSOS és una llista, només es descarreguen aquests grups.
 * - Cada grup es processa amb concurrència limitada (els 403 de CloudFront
 *   arriben de pressa; la pèrdua de temps és esperar reintents llargs).
 * - Si un grup falla, es conserven les dades de l'últim snapshot; el build
 *   no s'atura mai per un 403 de la FCF.
 *
 * Ús: npm run fetch
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  COMPETICIO_ID,
  COMPETICIO_NOM,
  DISCIPLINA_NOM,
  GRUPS_INCLOSOS,
  MAX_GOLEJADORS_PER_GRUP,
  TEMPORADA,
  TEMPORADA_NOM,
} from '../src/config';
import {
  extreureNumeroGrup,
  mapEquips,
  mapGolejadors,
  type ApiEquip,
  type ApiGolejador,
  type ApiGrup,
} from '../src/lib/api-mapping';
import type { FitxerDades, GrupData } from '../src/types';
import { fcfApi } from './fcf-client';

const arrel = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_PATH = path.join(arrel, 'src', 'data', 'scorers.json');

/** Grups processats en paral·lel (CloudFront no es queixa de poques connexions). */
const CONCURRENCIA = 6;

interface GrupNode {
  grupId: string;
  label: string;
  numero: number;
}

type ResultatGrup =
  | { estat: 'ok'; grup: GrupData }
  | { estat: 'snapshot'; grup: GrupData }
  | { estat: 'sense_dades'; label: string };

async function carregarSnapshotAnterior(): Promise<Map<string, GrupData>> {
  try {
    const text = await readFile(DATA_PATH, 'utf8');
    const dades = JSON.parse(text) as FitxerDades;
    return new Map(dades.grups.map((g) => [g.grupId, g]));
  } catch {
    return new Map();
  }
}

/** Processa un grup: descarrega golejadors + equips i construeix les dades. */
async function processarGrup(
  grup: GrupNode,
  snapshot: Map<string, GrupData>,
): Promise<ResultatGrup> {
  try {
    const [golejadores, equips] = await Promise.all([
      fcfApi<ApiGolejador[]>(`goleadores?grupId=${grup.grupId}&temporada=${TEMPORADA}`),
      fcfApi<ApiEquip[]>(`equipos?grupId=${grup.grupId}`),
    ]);

    const equipNoms = mapEquips(Array.isArray(equips) ? equips : []);
    const golejadors = mapGolejadors(
      Array.isArray(golejadores) ? golejadores : [],
      grup.numero,
      grup.label,
      equipNoms,
      MAX_GOLEJADORS_PER_GRUP,
    );

    return {
      estat: 'ok',
      grup: { numero: grup.numero, grupId: grup.grupId, label: grup.label, golejadors },
    };
  } catch (error) {
    const anterior = snapshot.get(grup.grupId);
    if (anterior) {
      return { estat: 'snapshot', grup: anterior };
    }
    return { estat: 'sense_dades', label: grup.label };
  }
}

/** Executa `fn` sobre `items` amb un màxim de `limit` tasques en paral·lel. */
async function mapAmbConcurrencia<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const resultats = new Array<R>(items.length);
  let seguent = 0;

  async function treballador(): Promise<void> {
    while (seguent < items.length) {
      const index = seguent;
      seguent += 1;
      resultats[index] = await fn(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, () => treballador()),
  );
  return resultats;
}

async function main(): Promise<void> {
  console.log(`Descarregant competició ${COMPETICIO_NOM} (${COMPETICIO_ID}) · temporada ${TEMPORADA_NOM} (${TEMPORADA})`);

  const snapshot = await carregarSnapshotAnterior();

  // 1) Resolució de la llista de grups. Si la llista no es pot obtenir, es
  //    reutilitza la del snapshot perquè els golejadors es puguin continuar
  //    intentant actualitzar.
  let grups: GrupNode[];
  let grupsDesDeSnapshot = false;
  try {
    const grupsApi = await fcfApi<ApiGrup[]>(`grupos?competicioId=${COMPETICIO_ID}`);
    if (!Array.isArray(grupsApi) || grupsApi.length === 0) {
      throw new Error('L’API no ha retornat cap grup.');
    }
    grups = [];
    for (const node of grupsApi) {
      const numero = extreureNumeroGrup(node.label);
      if (numero === null) {
        console.warn(`[fetch] Etiqueta de grup no reconeguda, s'omet: "${node.label}"`);
        continue;
      }
      grups.push({ grupId: node.value, label: node.label, numero });
    }
  } catch (error) {
    console.warn(
      `[fetch] No s'ha pogut obtenir la llista de grups (${error instanceof Error ? error.message : error}); s'usa la del snapshot anterior.`,
    );
    grups = [...snapshot.values()].map((g) => ({
      grupId: g.grupId,
      label: g.label,
      numero: g.numero,
    }));
    grupsDesDeSnapshot = true;
  }

  if (grups.length === 0) {
    console.error(`[fetch] Sense llista de grups (API i snapshot buit) per a competicioId=${COMPETICIO_ID}.`);
    process.exit(1);
  }

  let seleccionats: GrupNode[];
  if (GRUPS_INCLOSOS === 'tots') {
    seleccionats = grups;
  } else {
    const inclosos = new Set(GRUPS_INCLOSOS);
    seleccionats = grups.filter((g) => inclosos.has(g.numero));
  }
  seleccionats.sort((a, b) => a.numero - b.numero);

  console.log(
    `Grups disponibles: ${grups.length}${grupsDesDeSnapshot ? ' (del snapshot)' : ''} · seleccionats: ${seleccionats.length} · màxim golejadors per grup: ${MAX_GOLEJADORS_PER_GRUP}`,
  );
  console.log('Grups: ' + (seleccionats.map((g) => g.numero).join(', ') || '(cap)'));

  const resultats = await mapAmbConcurrencia(seleccionats, CONCURRENCIA, async (grup) => {
    const resultat = await processarGrup(grup, snapshot);
    const detall =
      resultat.estat === 'ok'
        ? `${resultat.grup.golejadors.length} golejadors`
        : resultat.estat === 'snapshot'
          ? "dades de l'últim snapshot (FCF inaccessible)"
          : 'sense dades prèvies (s’omet)';
    console.log(`[${grup.numero}] ${grup.label} (${grup.grupId}): ${detall}`);
    return resultat;
  });

  const grupsOk = resultats
    .filter((r): r is Extract<ResultatGrup, { estat: 'ok' }> => r.estat === 'ok')
    .map((r) => r.grup);
  const grupsSnapshot = resultats.filter((r) => r.estat === 'snapshot').map((r) => r.grup);
  const senseDades = resultats
    .filter((r) => r.estat === 'sense_dades')
    .map((r) => r.label);

  const totsGrups = [...grupsOk, ...grupsSnapshot].sort((a, b) => a.numero - b.numero);

  if (totsGrups.length === 0) {
    console.error('[fetch] Cap grup descarregat i sense dades prèvies.');
    process.exit(1);
  }

  const dades: FitxerDades = {
    temporada: TEMPORADA,
    temporadaNom: TEMPORADA_NOM,
    competicio: COMPETICIO_NOM,
    disciplina: DISCIPLINA_NOM,
    actualitzat: new Date().toISOString(),
    grups: totsGrups,
  };

  await writeFile(DATA_PATH, JSON.stringify(dades, null, 2), 'utf8');

  const totalGolejadors = totsGrups.reduce((suma, g) => suma + g.golejadors.length, 0);
  console.log('---');
  console.log(
    `Fet: ${grupsOk.length}/${seleccionats.length} grups actualitzats · ${totalGolejadors} golejadors en total.`,
  );
  if (grupsSnapshot.length > 0) {
    console.log(`Grups amb dades de l'últim snapshot: ${grupsSnapshot.map((g) => g.label).join(', ')}`);
  }
  if (senseDades.length > 0) {
    console.log(`Grups sense cap dada: ${senseDades.join(', ')}`);
  }
  console.log(`Fitxer generat: ${DATA_PATH}`);
  console.log('Per canviar els grups mostrats, edita GRUPS_INCLOSOS a src/config.ts.');
}

main().catch((error) => {
  console.error('[fetch] Error inesperat:', error);
  process.exit(1);
});
