import { describe, expect, it } from 'vitest';
import dades from '../../data/scorers.json';

/**
 * Comprovacions d'integritat sobre el snapshot generat per `npm run fetch`.
 * Aquestes proves fallen si el fitxer de dades és buit o mal format.
 */
describe('integritat de src/data/scorers.json', () => {
  it('conté la competició i la temporada esperades', () => {
    expect(dades.competicio).toBe('Juvenil Segona Divisió');
    expect(dades.disciplina).toBe('Futbol 11');
    expect(dades.temporada).toBe('22');
    expect(dades.temporadaNom).toBe('2026-27');
    expect(Number.isNaN(Date.parse(dades.actualitzat))).toBe(false);
  });

  it('conté grups amb golejadors i posicions seqüencials', () => {
    expect(Array.isArray(dades.grups)).toBe(true);
    expect(dades.grups.length).toBeGreaterThan(0);

    for (const grup of dades.grups) {
      expect(grup.golejadors.length).toBeGreaterThan(0);
      expect(grup.golejadors.length).toBeLessThanOrEqual(50);
      grup.golejadors.forEach((g, i) => {
        expect(g.posicio).toBe(i + 1);
        expect(g.jugador.length).toBeGreaterThan(0);
        expect(g.equip.length).toBeGreaterThan(0);
        expect(g.gols).toBeGreaterThanOrEqual(0);
      });
    }
  });

  it('tots els golejadors pertanyen al grup que els conté', () => {
    for (const grup of dades.grups) {
      for (const g of grup.golejadors) {
        expect(g.grupNumero).toBe(grup.numero);
        expect(g.grupLabel).toBe(grup.label);
      }
    }
  });

  it('els golejadors estan ordenats per gols de manera no ascendent', () => {
    for (const grup of dades.grups) {
      for (let i = 1; i < grup.golejadors.length; i++) {
        expect(grup.golejadors[i].gols).toBeLessThanOrEqual(grup.golejadors[i - 1].gols);
      }
    }
  });
});
