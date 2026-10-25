import type { Golejador, GrupData } from '../types';

/** Retorna els gols per partit amb arrodoniment a dos decimals, o null si no hi ha partits. */
export function golsPerPartit(gols: number, partits: number): number | null {
  if (!Number.isFinite(gols) || !Number.isFinite(partits) || partits <= 0) return null;
  return Math.round((gols / partits) * 100) / 100;
}

const formatNumeroCa = new Intl.NumberFormat('ca-ES', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formata un valor numèric en format català (coma decimal): 2,33 */
export function formatNumero(value: number): string {
  return formatNumeroCa.format(value);
}

/** Formata gols/partit per a la taula; retorna «—» quan no hi ha partits disputats. */
export function formatGolsPerPartit(value: number | null): string {
  return value === null ? '—' : formatNumero(value);
}

/** Mostra els gols i, si n'hi ha, indica quants han estat de penal: "3 (1 de penal)". */
export function formatGolsAmbPenals(gols: number, penals: number): string {
  if (penals > 0) return `${gols} (${penals} ${penals === 1 ? 'de penal' : 'de penals'})`;
  return String(gols);
}

/**
 * Assigna posicions (1..N) mantenint l'ordre donat, com fa la taula oficial de la FCF.
 * No agrupa empats: cada fila rep la seva posició seqüencial.
 */
export function assignarPosicions(
  entries: Array<Omit<Golejador, 'posicio'>>,
): Golejador[] {
  return entries.map((entry, index) => ({ ...entry, posicio: index + 1 }));
}

/**
 * Fusiona els golejadors de tots els grups en un únic rànquing combinat,
 * ordenat per gols (desc), gols/partit (desc) i nom. Les posicions són seqüencials.
 */
export function combinarGrups(grups: GrupData[]): Golejador[] {
  const tots = gruposAplanats(grups).map((entry) => ({ ...entry, posicio: 0 }));
  tots.sort((a, b) => {
    if (b.gols !== a.gols) return b.gols - a.gols;
    const gpa = a.golsPerPartit ?? -1;
    const gpb = b.golsPerPartit ?? -1;
    if (gpb !== gpa) return gpb - gpa;
    return a.jugador.localeCompare(b.jugador, 'ca');
  });
  return assignarPosicions(tots);
}

/** Concatena tots els golejadors de tots els grups. */
export function gruposAplanats(grups: GrupData[]): Golejador[] {
  return grups.flatMap((grup) => grup.golejadors);
}

/**
 * Filtra els grups segons la llista configurada.
 *   - 'tots': no filtra res.
 *   - llista de números: només conserva els grups amb aquest número.
 * Els grups es tornen ordenats per número ascendent.
 */
export function filtrarGrups(grups: GrupData[], inclosos: number[] | 'tots'): GrupData[] {
  const seleccionats = [...grups].sort((a, b) => a.numero - b.numero);
  if (inclosos === 'tots') return seleccionats;
  const set = new Set(inclosos);
  return seleccionats.filter((grup) => set.has(grup.numero));
}
