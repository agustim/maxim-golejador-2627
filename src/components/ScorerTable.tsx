import { useMemo, useState } from 'react';
import type { Golejador } from '../types';
import { formatGolsAmbPenals, formatGolsPerPartit } from '../lib/ranking';
import {
  ORDENACIO_PER_DEFECTE,
  direccioPerDefecte,
  ordenarGolejadors,
  type ColumnaOrdenacio,
  type EstatOrdenacio,
} from '../lib/sort';
import TeamCell from './TeamCell';

interface Props {
  rows: Golejador[];
  mostrarGrup?: boolean;
}

interface ThProps {
  columna: ColumnaOrdenacio;
  etiqueta: string;
  ordinal: EstatOrdenacio;
  onClic: (columna: ColumnaOrdenacio) => void;
  className?: string;
}

function ThOrdenable({ columna, etiqueta, ordinal, onClic, className }: ThProps) {
  const activa = ordinal.columna === columna;
  const fletxa = activa ? (ordinal.direccio === 'asc' ? ' ▲' : ' ▼') : '';
  return (
    <th
      className={className}
      aria-sort={activa ? (ordinal.direccio === 'asc' ? 'ascending' : 'descending') : undefined}
    >
      <button
        type="button"
        className={activa ? 'th-boto th-boto--actiu' : 'th-boto'}
        onClick={() => onClic(columna)}
      >
        {etiqueta}
        {fletxa}
      </button>
    </th>
  );
}

/**
 * Taula de golejadors amb capçaleres ordenables: clic a una columna per
 * ordenar (nova columna → direcció per defecte; mateixa columna → inverteix).
 */
export default function ScorerTable({ rows, mostrarGrup = false }: Props) {
  const [ordinal, setOrdinal] = useState<EstatOrdenacio>(ORDENACIO_PER_DEFECTE);

  const rowsOrdenades = useMemo(() => ordenarGolejadors(rows, ordinal), [rows, ordinal]);

  const canviarOrdre = (columna: ColumnaOrdenacio) => {
    setOrdinal((actual) =>
      actual.columna === columna
        ? { columna, direccio: actual.direccio === 'asc' ? 'desc' : 'asc' }
        : { columna, direccio: direccioPerDefecte(columna) },
    );
  };

  if (rows.length === 0) {
    return (
      <div className="empty-state">
        <p>Encara no hi ha gols registrats en aquest grup.</p>
      </div>
    );
  }

  return (
    <div className="table-scroll">
      <table className="scorer-table">
        <thead>
          <tr>
            <th className="col-pos">Pos.</th>
            <ThOrdenable columna="jugador" etiqueta="Jugador" ordinal={ordinal} onClic={canviarOrdre} />
            <ThOrdenable columna="equip" etiqueta="Equip" ordinal={ordinal} onClic={canviarOrdre} />
            {mostrarGrup && (
              <ThOrdenable columna="grup" etiqueta="Grup" ordinal={ordinal} onClic={canviarOrdre} />
            )}
            <ThOrdenable
              columna="gols"
              etiqueta="Gols"
              ordinal={ordinal}
              onClic={canviarOrdre}
              className="col-num"
            />
            <ThOrdenable
              columna="partits"
              etiqueta="Partits"
              ordinal={ordinal}
              onClic={canviarOrdre}
              className="col-num"
            />
            <ThOrdenable
              columna="golsPartit"
              etiqueta="Gols/partit"
              ordinal={ordinal}
              onClic={canviarOrdre}
              className="col-num"
            />
          </tr>
        </thead>
        <tbody>
          {rowsOrdenades.map((row, index) => (
            <tr key={`${row.grupNumero}-${row.codequipo}-${row.posicio}-${row.jugador}`}>
              <td className="col-pos">{index + 1}</td>
              <td className="player-name">{row.jugador}</td>
              <td>
                <TeamCell golejador={row} />
              </td>
              {mostrarGrup && <td className="grup-tag">{row.grupLabel}</td>}
              <td className="col-num goals">{formatGolsAmbPenals(row.gols, row.penals)}</td>
              <td className="col-num">{row.partits}</td>
              <td className="col-num">{formatGolsPerPartit(row.golsPerPartit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
