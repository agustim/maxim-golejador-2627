import { NavLink } from 'react-router-dom';
import type { GrupData } from '../types';

interface Props {
  grups: GrupData[];
}

export default function GroupTabs({ grups }: Props) {
  return (
    <nav className="group-tabs" aria-label="Selecció de grup">
      <NavLink
        to="/"
        end
        className={({ isActive }) => (isActive ? 'tab tab--active' : 'tab')}
      >
        Combinat
      </NavLink>
      {grups.map((grup) => (
        <NavLink
          key={grup.grupId}
          to={`/grup/${grup.numero}`}
          className={({ isActive }) => (isActive ? 'tab tab--active' : 'tab')}
        >
          Grup {grup.numero}
        </NavLink>
      ))}
    </nav>
  );
}
