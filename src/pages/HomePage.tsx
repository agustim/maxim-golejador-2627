import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GRUPS } from '../data';
import { combinarGrups } from '../lib/ranking';
import ScorerTable from '../components/ScorerTable';
import GroupTabs from '../components/GroupTabs';

type Seleccio = 'tots' | 'cap' | Set<number>;

/**
 * Interpreta el paràmetre `grups` de l'URL:
 *   - sense paràmetre → 'tots'
 *   - `grups=` (buit)  → 'cap'
 *   - `grups=8,16`     → Set amb els números vàlids
 */
function parseSeleccio(raw: string | null, disponibles: number[]): Seleccio {
  if (raw === null) return 'tots';
  if (raw.trim() === '') return 'cap';
  const valors = new Set(
    raw
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isInteger(n) && disponibles.includes(n)),
  );
  return valors.size === disponibles.length ? 'tots' : valors;
}

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const totsNumeros = useMemo(() => GRUPS.map((g) => g.numero), []);
  const seleccio = useMemo<Seleccio>(
    () => parseSeleccio(searchParams.get('grups'), totsNumeros),
    [searchParams, totsNumeros],
  );

  const grupsSeleccionats = useMemo(() => {
    if (seleccio === 'tots') return GRUPS;
    if (seleccio === 'cap') return [];
    return GRUPS.filter((g) => seleccio.has(g.numero));
  }, [seleccio]);

  const ranking = useMemo(() => combinarGrups(grupsSeleccionats), [grupsSeleccionats]);

  const mostra = (numeros: Set<number>) => {
    if (numeros.size === 0) {
      setSearchParams({ grups: '' });
    } else if (numeros.size === totsNumeros.length) {
      setSearchParams({});
    } else {
      setSearchParams({ grups: [...numeros].sort((a, b) => a - b).join(',') });
    }
  };

  const toggle = (numero: number) => {
    const actual = new Set(seleccio === 'tots' ? totsNumeros : seleccio === 'cap' ? [] : seleccio);
    if (actual.has(numero)) {
      actual.delete(numero);
    } else {
      actual.add(numero);
    }
    mostra(actual);
  };

  const seleccionats = new Set(seleccio === 'tots' ? totsNumeros : []);
  for (const g of grupsSeleccionats) seleccionats.add(g.numero);

  return (
    <section className="page">
      <GroupTabs
        grups={GRUPS}
        seleccionats={seleccionats}
        onToggle={toggle}
        onSelectAll={() => setSearchParams({})}
        onClear={() => setSearchParams({ grups: '' })}
      />

      <h1>Rànquing combinat</h1>
      <p className="page-note">
        {grupsSeleccionats.length === 0
          ? 'Cap grup seleccionat: marca almenys un grup a dalt.'
          : grupsSeleccionats.length === 1
            ? `Mostrant el ${grupsSeleccionats[0].label.toLowerCase()}.`
            : `Mostrant els golejadors de ${grupsSeleccionats.length} grups (${ranking.length} jugadors).`}{' '}
        Pots seleccionar diversos grups alhora fent clic a les pestanyes: la llista els
        combina i es comparteix amb l’URL.
      </p>

      <ScorerTable rows={ranking} mostrarGrup />

      {ranking.length === 0 && (
        <p className="page-note">
          Cap gol seleccionat: marca almenys un grup a dalt o revisa{' '}
          <code>src/config.ts</code>.
        </p>
      )}
    </section>
  );
}
