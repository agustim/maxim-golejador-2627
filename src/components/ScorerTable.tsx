import type { Golejador } from '../types';
import { formatGolsAmbPenals, formatGolsPerPartit } from '../lib/ranking';
import TeamCell from './TeamCell';

interface Props {
  rows: Golejador[];
  mostrarGrup?: boolean;
}

export default function ScorerTable({ rows, mostrarGrup = false }: Props) {
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
            <th>Jugador</th>
            <th>Equip</th>
            {mostrarGrup && <th>Grup</th>}
            <th className="col-num">Gols</th>
            <th className="col-num">Partits</th>
            <th className="col-num">Gols/partit</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.grupNumero}-${row.codequipo}-${row.posicio}-${row.jugador}`}>
              <td className="col-pos">{row.posicio}</td>
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
