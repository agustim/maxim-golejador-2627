import { describe, expect, it } from 'vitest';
import {
  assignarPosicions,
  combinarGrups,
  filtrarGrups,
  formatGolsAmbPenals,
  formatGolsPerPartit,
  formatNumero,
  golsPerPartit,
} from '../ranking';
import type { Golejador, GrupData } from '../../types';

function grup(numero: number, golejadors: Array<Partial<Golejador> & { jugador: string; gols: number }>): GrupData {
  return {
    numero,
    grupId: `g-${numero}`,
    label: `GRUP ${numero}`,
    golejadors: golejadors.map((g, i) => ({
      posicio: i + 1,
      equip: `Equip ${i + 1}`,
      codequipo: `c-${i}`,
      penals: 0,
      partits: 3,
      golsPerPartit: null,
      escut: null,
      grupNumero: numero,
      grupLabel: `GRUP ${numero}`,
      ...g,
    })),
  };
}

describe('golsPerPartit', () => {
  it('calcula els gols per partit amb dos decimals', () => {
    expect(golsPerPartit(4, 2)).toBe(2);
    expect(golsPerPartit(7, 3)).toBeCloseTo(2.33, 2);
  });

  it('retorna null si no hi ha partits o els valors no són vàlids', () => {
    expect(golsPerPartit(1, 0)).toBeNull();
    expect(golsPerPartit(1, -2)).toBeNull();
    expect(golsPerPartit(Number.NaN, 2)).toBeNull();
  });
});

describe('formatNumero / formatGolsPerPartit / formatGolsAmbPenals', () => {
  it('formata nombres amb coma decimal (format català)', () => {
    expect(formatNumero(2.33)).toBe('2,33');
    expect(formatGolsPerPartit(null)).toBe('—');
    expect(formatGolsPerPartit(1.5)).toBe('1,50');
  });

  it('mostra els penals com a la web oficial', () => {
    expect(formatGolsAmbPenals(3, 1)).toBe('3 (1 de penal)');
    expect(formatGolsAmbPenals(3, 0)).toBe('3');
  });
});

describe('assignarPosicions', () => {
  it('assigna posicions seqüencials sense agrupar empats', () => {
    const base = [
      { jugador: 'A', gols: 5 } as Golejador,
      { jugador: 'B', gols: 5 } as Golejador,
      { jugador: 'C', gols: 3 } as Golejador,
    ];
    const resultat = assignarPosicions(base);
    expect(resultat.map((r) => r.posicio)).toEqual([1, 2, 3]);
  });
});

describe('filtrarGrups', () => {
  const grups = [grup(16, []), grup(8, []), grup(9, [])];

  it("amb 'tots' retorna tots els grups", () => {
    expect(filtrarGrups(grups, 'tots').map((g) => g.numero)).toEqual([8, 9, 16]);
  });

  it('amb una llista només retorna els grups indicats', () => {
    expect(filtrarGrups(grups, [8, 16]).map((g) => g.numero)).toEqual([8, 16]);
    expect(filtrarGrups(grups, [5]).map((g) => g.numero)).toEqual([]);
  });
});

describe('combinarGrups', () => {
  it('fusiona i ordena per gols, gols/partit i nom', () => {
    const grups = [
      grup(8, [
        { jugador: 'Jugador C', gols: 4, partits: 4, golsPerPartit: 1 },
        { jugador: 'Jugador A', gols: 6, partits: 4, golsPerPartit: 1.5 },
      ]),
      grup(9, [{ jugador: 'Jugador B', gols: 5, partits: 5, golsPerPartit: 1 }]),
    ];
    const combinat = combinarGrups(grups);
    expect(combinat.map((c) => c.jugador)).toEqual(['Jugador A', 'Jugador B', 'Jugador C']);
    expect(combinat.map((c) => c.posicio)).toEqual([1, 2, 3]);
  });

  it('els jugadors del mateix grup mantenen el grup d’origen', () => {
    const grups = [grup(8, [{ jugador: 'X', gols: 1, partits: 1, golsPerPartit: 1 }])];
    const combinat = combinarGrups(grups);
    expect(combinat[0].grupLabel).toBe('GRUP 8');
  });
});
