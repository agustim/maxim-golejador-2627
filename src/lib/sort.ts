import type { Golejador } from '../types';

export type ColumnaOrdenacio = 'jugador' | 'equip' | 'grup' | 'gols' | 'partits' | 'golsPartit';
export type DireccioOrdenacio = 'asc' | 'desc';

export interface EstatOrdenacio {
  columna: ColumnaOrdenacio;
  direccio: DireccioOrdenacio;
}

export const ORDENACIO_PER_DEFECTE: EstatOrdenacio = { columna: 'gols', direccio: 'desc' };

/** Direcció que s'aplica la primera vegada que es clica una columna. */
export function direccioPerDefecte(columna: ColumnaOrdenacio): DireccioOrdenacio {
  return columna === 'jugador' || columna === 'equip' || columna === 'grup' ? 'asc' : 'desc';
}

const collator = new Intl.Collator('ca', { sensitivity: 'base' });

function comparar(a: Golejador, b: Golejador, columna: ColumnaOrdenacio): number {
  switch (columna) {
    case 'jugador':
      return collator.compare(a.jugador, b.jugador);
    case 'equip':
      return collator.compare(a.equip, b.equip);
    case 'grup':
      return a.grupNumero - b.grupNumero;
    case 'gols':
      return a.gols - b.gols;
    case 'partits':
      return a.partits - b.partits;
    case 'golsPartit': {
      const x = a.golsPerPartit ?? -1;
      const y = b.golsPerPartit ?? -1;
      return x - y;
    }
  }
}

/**
 * Retorna una còpia de les files ordenades segons l'estat d'ordenació.
 * L'ordenació és estable: en cas d'empat es conserva l'ordre d'entrada.
 */
export function ordenarGolejadors(rows: Golejador[], estat: EstatOrdenacio): Golejador[] {
  const factor = estat.direccio === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => factor * comparar(a, b, estat.columna));
}
