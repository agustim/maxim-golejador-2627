import { Link } from 'react-router-dom';
import { DADES, GRUPS } from '../data';
import { combinarGrups } from '../lib/ranking';
import ScorerTable from '../components/ScorerTable';

export default function HomePage() {
  const ranking = combinarGrups(GRUPS);
  const primerGrup = GRUPS[0];

  return (
    <section className="page">
      <h1>Rànquing combinat</h1>
      <p className="page-note">
        Golejadors de{' '}
        {GRUPS.length === 1
          ? 'l’únic grup seleccionat'
          : `tots els grups seleccionats (${GRUPS.length})`}{' '}
        de la {DADES.competicio}, ordenats per nombre de gols. El rànquing oficial de
        cada grup és a la pestanya corresponent.
      </p>
      <ScorerTable rows={ranking} mostrarGrup />
      {GRUPS.length === 0 && (
        <p className="page-note">
          No s’ha trobat cap grup amb la configuració actual. Revisa{' '}
          <code>src/config.ts</code>.
        </p>
      )}
      {primerGrup && (
        <p className="page-note">
          <Link to={`/grup/${primerGrup.numero}`}>
            → Veure el rànquing del {primerGrup.label} individual
          </Link>
        </p>
      )}
    </section>
  );
}
