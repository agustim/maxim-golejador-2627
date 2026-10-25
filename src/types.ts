export interface Golejador {
  posicio: number;
  jugador: string;
  equip: string;
  codequipo: string;
  gols: number;
  penals: number;
  partits: number;
  golsPerPartit: number | null;
  escut: string | null;
  grupNumero: number;
  grupLabel: string;
}

export interface GrupData {
  numero: number;
  grupId: string;
  label: string;
  golejadors: Golejador[];
}

export interface FitxerDades {
  temporada: string;
  temporadaNom: string;
  competicio: string;
  disciplina: string;
  actualitzat: string;
  grups: GrupData[];
}
