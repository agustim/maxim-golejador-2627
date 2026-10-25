import { describe, expect, it } from 'vitest';
import {
  extreureNumeroGrup,
  mapEquips,
  mapGolejadors,
  type ApiGolejador,
} from '../api-mapping';
import raw from './fixtures/goleadores_16.json';

const golejadorsApi = raw as ApiGolejador[];

describe('extreureNumeroGrup', () => {
  it('extreu el número d’una etiqueta "GRUP N"', () => {
    expect(extreureNumeroGrup('GRUP 8')).toBe(8);
    expect(extreureNumeroGrup('  grup 16 ')).toBe(16);
  });

  it('retorna null per a etiquetes no reconegudes', () => {
    expect(extreureNumeroGrup('FASE ASCENS')).toBeNull();
    expect(extreureNumeroGrup('')).toBeNull();
  });
});

describe('mapEquips', () => {
  it('deduplica els equips i conserva el primer nom no buit', () => {
    const map = mapEquips([
      { value: '123', label: 'CLUB A' },
      { value: '123', label: 'CLUB A' },
      { value: '456', label: '' },
      { value: '456', label: 'CLUB B' },
    ]);
    expect(map.get('123')).toBe('CLUB A');
    expect(map.get('456')).toBe('CLUB B');
    expect(map.size).toBe(2);
  });
});

describe('mapGolejadors', () => {
  it("mapeja el fixture real de l'API mantenint ordre i posició", () => {
    const equipNoms = new Map<string, string>([
      ['43974937', 'VALDOREX FC'],
      ['25813527', 'APA POBLE SEC, CE. C'],
    ]);
    const resultat = mapGolejadors(golejadorsApi, 16, 'GRUP 16', equipNoms, 50);

    expect(resultat).toHaveLength(50);

    const primer = resultat[0];
    expect(primer.posicio).toBe(1);
    expect(primer.jugador).toBe('AGUIRRE LÓPEZ, JAVIER');
    expect(primer.gols).toBe(8);
    expect(primer.partits).toBe(2);
    expect(primer.golsPerPartit).toBe(4);
    expect(primer.equip).toBe('VALDOREX FC');
    expect(primer.escut).toContain('files.fcf.cat');
    expect(primer.grupLabel).toBe('GRUP 16');
    expect(primer.grupNumero).toBe(16);

    const segon = resultat[1];
    expect(segon.equip).toBe('APA POBLE SEC, CE. C');
  });

  it('usa el fallback per a equips desconeguts i retalla a maxRegistres', () => {
    const resultat = mapGolejadors(golejadorsApi, 16, 'GRUP 16', new Map(), 5);
    expect(resultat).toHaveLength(5);
    expect(resultat[0].equip).toBe('Equip desconegut');
  });
});
