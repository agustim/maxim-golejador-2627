import type { Golejador } from '../types';
import { golsPerPartit } from './ranking';

/** Format de la resposta de l'endpoint /api/competition/goleadores de la FCF. */
export interface ApiGolejador {
  nombre_jugador: string;
  codtemporada: string;
  codequipo: string;
  licencia: string;
  codjugador: string;
  codgrupo: string;
  goles: number;
  penalti: number;
  escudo: string;
  total: number;
}

/** Format de la resposta de l'endpoint /api/competition/grupos de la FCF. */
export interface ApiGrup {
  value: string;
  label: string;
}

/** Format de la resposta de l'endpoint /api/competition/equipos de la FCF. */
export interface ApiEquip {
  value: string;
  label: string;
}

const RE_GRUP = /^GRUP\s+(\d+)$/i;

/** Extreu el número de grup d'una etiqueta com "GRUP 8"; retorna null si no hi encaixa. */
export function extreureNumeroGrup(label: string): number | null {
  const match = RE_GRUP.exec(label.trim());
  return match ? Number(match[1]) : null;
}

/**
 * Converteix la llista d'equips (amb duplicats) en un mapa codequipo → nom.
 * El primer valor no buit guanya.
 */
export function mapEquips(equips: ApiEquip[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const equip of equips) {
    const nom = (equip.label ?? '').trim();
    if (!map.has(equip.value) && nom) map.set(equip.value, nom);
  }
  return map;
}

/** Normalitza un text per a comparacions (sense accents ni majúscules). */
export function normalitza(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Resol el nom d'equip: pel codequipo o, si no es troba, pel camp escudo/nom de l'API. */
export function nomEquip(
  codequipo: string,
  equipNoms: Map<string, string>,
  fallback: string,
): string {
  const nom = equipNoms.get(codequipo);
  return nom && nom.trim() ? nom.trim() : fallback;
}

/**
 * Converteix els registres de l'API en el model de la web, mantenint l'ordre de l'API
 * i copiant el nom d'equip del mapa (sense modificar cap sentit de puntuació/oficial).
 */
export function mapGolejadors(
  api: ApiGolejador[],
  grupNumero: number,
  grupLabel: string,
  equipNoms: Map<string, string>,
  maxRegistres: number,
): Golejador[] {
  return api.slice(0, maxRegistres).map((registre, index) => {
    const gols = Number(registre.goles) || 0;
    const partits = Number(registre.total) || 0;
    const penals = Number(registre.penalti) || 0;
    return {
      posicio: index + 1,
      jugador: (registre.nombre_jugador ?? '').trim(),
      equip: nomEquip(registre.codequipo, equipNoms, 'Equip desconegut'),
      codequipo: registre.codequipo,
      gols,
      penals,
      partits,
      golsPerPartit: golsPerPartit(gols, partits),
      escut: registre.escudo?.trim() ? registre.escudo : null,
      grupNumero,
      grupLabel,
    };
  });
}
