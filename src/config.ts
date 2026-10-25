/**
 * Configuració de la competició i dels grups a mostrar.
 *
 * Per filtrar els grups (per exemple, només 8, 9, 10, 11, 12, 13, 14, 15 i 16),
 * canvia GRUPS_INCLOSOS a [8, 9, 10, 11, 12, 13, 14, 15, 16] i torna a executar:
 *   npm run fetch && npm run build
 */

/** Codi intern de la temporada a la FCF (22 = 2026-27). */
export const TEMPORADA = '22';
/** Nom visible de la temporada. */
export const TEMPORADA_NOM = '2026-27';

/** Disciplina: 19308233 = "Futbol 11". */
export const DISCIPLINA_ID = '19308233';
export const DISCIPLINA_NOM = 'Futbol 11';

/** Competició: 58161949 = "JUVENIL SEGONA DIVISIÓ". */
export const COMPETICIO_ID = '58161949';
export const COMPETICIO_NOM = 'Juvenil Segona Divisió';

/**
 * Grups a incloure a la web.
 *   - 'tots': tots els grups que la FCF retorna per a la competició.
 *   - [8, 9, 10, ...]: només aquests grups; els golejadors de la resta de grups
 *     queden fora del lloc.
 */
export const GRUPS_INCLOSOS: number[] | 'tots' = 'tots';

/** Nombre màxim de golejadors per grup (l'API de la FCF en retorna com a molt 50). */
export const MAX_GOLEJADORS_PER_GRUP = 50;

export const FONT_URL = 'https://www.fcf.cat';
export const COMPETICIO_URL = `https://www.fcf.cat/es/competicio?temporadaId=${TEMPORADA}&disciplinaId=${DISCIPLINA_ID}&competicioId=${COMPETICIO_ID}&tab=gols`;
