import type { Golejador } from '../types';

interface Props {
  golejador: Golejador;
}

function Iniciales({ nom }: { nom: string }) {
  const inicials = nom
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
  return <span className="escut escut--placeholder">{(inicials || '?').slice(0, 2)}</span>;
}

export default function TeamCell({ golejador }: Props) {
  return (
    <span className="team-cell">
      {golejador.escut ? (
        <img
          className="escut"
          src={golejador.escut}
          alt={`Escut de ${golejador.equip}`}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <Iniciales nom={golejador.equip} />
      )}
      <span className="team-name">{golejador.equip}</span>
    </span>
  );
}
