/**
 * Genera src/data/scorers.json amb els màxims golejadors de la competició
 * configurada a src/config.ts (Futbol 11 · Juvenil Segona Divisió · 2026-27).
 *
 * - Resol els grupId dinàmicament des de l'API (cap ID no està hardcoded).
 * - Si GRUPS_INCLOSOS és una llista, només es descarreguen aquests grups.
 * - Si una crida falla després de tots els reintents, es conserven les dades
 *   de l'últim snapshot per a aquell grup (el build mai no s'atura per un
 *   ídem de la FCF).
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
import { fcfApi, sleep } from './fcf-client';

const arrel = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_PATH = path.join(arrel, 'src', 'data', 'scorers.json');

/** Pausa entre grups per no saturar CloudFront (els 403 apareixen en ràfegues). */
const PAUSA_MS = 300;

interface GrupNode {
  grupId: string;
  label: string;
  numero: number;
}

async function carregarSnapshotAnterior(): Promise<Map<string, GrupData>> {
  try {
    const text = await readFile(DATA_PATH, 'utf8');
    const dades = JSON.parse(text) as FitxerDades;
    return new Map(dades.grups.map((g) => [g.grupId, g]));
  } catch {
    return new Map();
  }
}

async function main(): Promise<void> {
  console.log(`Descarregant competició ${COMPETICIO_NOM} (${COMPETICIO_ID}) · temporada ${TEMPORADA_NOM} (${TEMPORADA})`);

  const snapshot = await carregarSnapshotAnterior();

  // 1) Resolució de la llista de grups. Si l'API de grups falla (l'origen de la
  //    FCF és intermitent), es reutilitza la llista de l'últim snapshot perquè
  //    els golejadors de cada grup es puguin continuar actualitzant.
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
      `[fetch] No s'ha pogut obtenir la llista de grups (${error instanceof Error ? error.message : error}); s'usa la llista del snapshot anterior.`,
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
    `Grups disponibles: ${grups.length}${grupsDesDeSnapshot ? ' (del snapshot)' : ''} · grups seleccionats: ${seleccionats.length} · màxim golejadors per grup: ${MAX_GOLEJADORS_PER_GRUP}`,
  );
  console.log('Grups: ' + (seleccionats.map((g) => g.numero).join(', ') || '(cap)'));

  const resultats: Omit<FitxerDades, 'actualitzat'> = {
    temporada: TEMPORADA,
    temporadaNom: TEMPORADA_NOM,
    competicio: COMPETICIO_NOM,
    disciplina: DISCIPLINA_NOM,
    grups: [],
  };

  let totalGolejadors = 0;
  let ok = 0;
  const fallides: string[] = [];
  const desactualitzats: string[] = [];

  for (const [index, grup] of seleccionats.entries()) {
    const prefix = `[${index + 1}/${seleccionats.length}]`;

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

      resultats.grups.push({
        numero: grup.numero,
        grupId: grup.grupId,
        label: grup.label,
        golejadors,
      });
      totalGolejadors += golejadors.length;
      ok += 1;
      console.log(`${prefix} ${grup.label} (${grup.grupId}): ${golejadors.length} golejadors`);
    } catch (error) {
      const anterior = snapshot.get(grup.grupId);
      if (anterior) {
        resultats.grups.push(anterior);
        desactualitzats.push(grup.label);
        console.warn(
          `${prefix} ${grup.label}: fallida (${error instanceof Error ? error.message : error}), es conserven les dades anteriors (${anterior.golejadors.length} golejadors)`,
        );
      } else {
        fallides.push(grup.label);
        console.warn(`${prefix} ${grup.label}: fallida i sense dades prèvies, s'omet.`);
      }
    }

    if (index < seleccionats.length - 1) await sleep(PAUSA_MS);
  }

  resultats.grups.sort((a, b) => a.numero - b.numero);

  if (resultats.grups.length === 0) {
    console.error('[fetch] Cap grup descarregat i sense dades prèvies.');
    process.exit(1);
  }

  const dades: FitxerDades = {
    ...resultats,
    actualitzat: new Date().toISOString(),
  };

  await writeFile(DATA_PATH, JSON.stringify(dades, null, 2), 'utf8');

  console.log('---');
  console.log(`Fet: ${ok}/${seleccionats.length} grups actualitzats · ${totalGolejadors} golejadors.`);
  if (desactualitzats.length > 0) {
    console.log(`Grups amb dades de l'últim snapshot: ${desactualitzats.join(', ')}`);
  }
  if (fallides.length > 0) {
    console.log(`Grups sense cap dada: ${fallides.join(', ')}`);
  }
  console.log(`Fitxer generat: ${DATA_PATH}`);
  console.log("Per canviar els grups mostrats, edita GRUPS_INCLOSOS a src/config.ts.");
}

main().catch((error) => {
  console.error('[fetch] Error inesperat:', error);
  process.exit(1);
});
