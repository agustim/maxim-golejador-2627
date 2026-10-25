import type { GrupData } from '../types';

interface Props {
  grups: GrupData[];
  seleccionats: Set<number>;
  onToggle: (numero: number) => void;
  onSelectAll: () => void;
  onClear: () => void;
}

/**
 * Selector de grups de selecció múltiple: clicar un grup el marca/desmarca i
 * la llista s'actualitza amb tots els grups seleccionats alhora.
 */
export default function GroupTabs({ grups, seleccionats, onToggle, onSelectAll, onClear }: Props) {
  const totsSeleccionats = grups.every((g) => seleccionats.has(g.numero));

  return (
    <nav className="group-tabs" aria-label="Selecció de grups">
      <button
        type="button"
        className={totsSeleccionats ? 'tab tab--action tab--active' : 'tab tab--action'}
        onClick={onSelectAll}
      >
        Tots
      </button>
      <button type="button" className="tab tab--action" onClick={onClear}>
        Cap
      </button>
      {grups.map((grup) => {
        const actiu = seleccionats.has(grup.numero);
        return (
          <button
            key={grup.grupId}
            type="button"
            aria-pressed={actiu}
            className={actiu ? 'tab tab--selected' : 'tab'}
            onClick={() => onToggle(grup.numero)}
          >
            {actiu ? '✓ ' : ''}Grup {grup.numero}
          </button>
        );
      })}
    </nav>
  );
}
