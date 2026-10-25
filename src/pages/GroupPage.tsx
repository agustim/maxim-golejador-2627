import { Link, useParams } from 'react-router-dom';
import { DADES, GRUPS } from '../data';
import ScorerTable from '../components/ScorerTable';

export default function GroupPage() {
  const { num } = useParams<{ num: string }>();
  const numero = Number(num);
  const grup = GRUPS.find((g) => g.numero === numero);

  if (!grup) {
    return (
      <section className="page">
        <h1>Grup {num}</h1>
        <p className="page-note">
          Aquest grup no és a la configuració actual (o encara no té dades). Revisa{' '}
          <code>src/config.ts</code> o torna al{' '}
          <Link to="/">rànquing combinat</Link>.
        </p>
      </section>
    );
  }

  return (
    <section className="page">
      <h1>{grup.label} · Màxims golejadors</h1>
      <p className="page-note">
        {grup.golejadors.length}{' '}
        {grup.golejadors.length === 1 ? 'jugador amb gols' : 'jugadors amb gols'} al{' '}
        {grup.label.toLowerCase()} de la {DADES.competicio}.
      </p>
      <ScorerTable rows={grup.golejadors} />
    </section>
  );
}
