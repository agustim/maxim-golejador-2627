import raw from './data/scorers.json';
import { GRUPS_INCLOSOS } from './config';
import { filtrarGrups } from './lib/ranking';
import type { FitxerDades, GrupData } from './types';

/** Dades generades per `npm run fetch` (vegeu scripts/fetch-data.ts). */
const FITXER = raw as FitxerDades;

export const DADES: FitxerDades = FITXER;

/** Grups visibles a la web, ja filtrats segons la configuració. */
export const GRUPS: GrupData[] = filtrarGrups(FITXER.grups, GRUPS_INCLOSOS);
