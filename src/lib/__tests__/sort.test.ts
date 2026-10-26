import { describe, expect, it } from 'vitest';
import {
  direccioPerDefecte,
  ordenarGolejadors,
  type EstatOrdenacio,
} from '../sort';
import type { Golejador } from '../../types';

function jugador(parcial: Partial<Golejador> & { jugador: string }): Golejador {
  return {
    posicio: 1,
    equip: 'Equip X',
    codequipo: 'c1',
    gols: 0,
    penals: 0,
    partits: 1,
    golsPerPartit: 0,
    escut: null,
    grupNumero: 1,
    grupLabel: 'GRUP 1',
    ...parcial,
  };
}

const dades: Golejador[] = [
  jugador({ jugador: 'PÉREZ ZAMORA, ÀLEX', equip: 'BÀSQUET CLUB', gols: 5, partits: 4, golsPerPartit: 1.25, grupNumero: 16 }),
  jugador({ jugador: 'GARCIA, BIEL', equip: 'ÀTIC DE GIRONA', gols: 5, partits: 5, golsPerPartit: 1, grupNumero: 8 }),
  jugador({ jugador: 'MARTÍ, ORIOL', equip: 'CARLES ROVIRA', gols: 3, partits: 6, golsPerPartit: null, grupNumero: 9 }),
  jugador({ jugador: 'ARNAU, POL', equip: 'BÀSQUET CLUB', gols: 1, partits: 2, golsPerPartit: 0.5, grupNumero: 8 }),
];

describe('direccioPerDefecte', () => {
  it('ordenació ascendent per columnes de text i descendent per numèriques', () => {
    expect(direccioPerDefecte('jugador')).toBe('asc');
    expect(direccioPerDefecte('equip')).toBe('asc');
    expect(direccioPerDefecte('grup')).toBe('asc');
    expect(direccioPerDefecte('gols')).toBe('desc');
    expect(direccioPerDefecte('partits')).toBe('desc');
    expect(direccioPerDefecte('golsPartit')).toBe('desc');
  });
});

describe('ordenarGolejadors', () => {
  it('ordena per gols descendent i és estable amb empats', () => {
    const estat: EstatOrdenacio = { columna: 'gols', direccio: 'desc' };
    const resultat = ordenarGolejadors(dades, estat);
    expect(resultat.map((g) => g.gols)).toEqual([5, 5, 3, 1]);
    // En cas d'empat es conserva l'ordre d'entrada (estable).
    expect(resultat[0].jugador).toBe('PÉREZ ZAMORA, ÀLEX');
    expect(resultat[1].jugador).toBe('GARCIA, BIEL');
  });

  it('ordena per nom ascendent amb col·lació catalana', () => {
    const estat: EstatOrdenacio = { columna: 'jugador', direccio: 'asc' };
    const resultat = ordenarGolejadors(dades, estat);
    expect(resultat.map((g) => g.jugador)).toEqual([
      'ARNAU, POL',
      'GARCIA, BIEL',
      'MARTÍ, ORIOL',
      'PÉREZ ZAMORA, ÀLEX',
    ]);
  });

  it('ordena per equip ascendent', () => {
    const estat: EstatOrdenacio = { columna: 'equip', direccio: 'asc' };
    const resultat = ordenarGolejadors(dades, estat);
    expect(resultat[0].equip).toBe('ÀTIC DE GIRONA');
    expect(resultat[1].equip).toBe('BÀSQUET CLUB');
  });

  it('ordena per grup ascendent/descendent', () => {
    const asc = ordenarGolejadors(dades, { columna: 'grup', direccio: 'asc' });
    expect(asc.map((g) => g.grupNumero)).toEqual([8, 8, 9, 16]);
    const desc = ordenarGolejadors(dades, { columna: 'grup', direccio: 'desc' });
    expect(desc[0].grupNumero).toBe(16);
  });

  it("els valors null de gols/partit van al final en ordre descendent", () => {
    const estat: EstatOrdenacio = { columna: 'golsPartit', direccio: 'desc' };
    const resultat = ordenarGolejadors(dades, estat);
    expect(resultat[0].golsPerPartit).toBe(1.25);
    expect(resultat.at(-1)?.golsPerPartit).toBeNull();
  });

  it('canvia la direcció segons l’estat', () => {
    const asc = ordenarGolejadors(dades, { columna: 'partits', direccio: 'asc' });
    const desc = ordenarGolejadors(dades, { columna: 'partits', direccio: 'desc' });
    expect(asc[0].partits).toBe(2);
    expect(desc[0].partits).toBe(6);
  });

  it('no muta la llista original', () => {
    const còpia = [...dades];
    ordenarGolejadors(dades, { columna: 'jugador', direccio: 'asc' });
    expect(dades).toEqual(còpia);
  });
});
