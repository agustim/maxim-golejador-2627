import { Route, Routes } from 'react-router-dom';
import { COMPETICIO_NOM, DISCIPLINA_NOM, TEMPORADA_NOM } from './config';
import { DADES, GRUPS } from './data';
import GroupTabs from './components/GroupTabs';
import UpdateBanner from './components/UpdateBanner';
import HomePage from './pages/HomePage';
import GroupPage from './pages/GroupPage';

export default function App() {
  return (
    <div className="app">
      <header className="site-header">
        <div className="site-header__inner">
          <h1 className="site-title">Màxims Golejadors</h1>
          <p className="site-subtitle">
            {DISCIPLINA_NOM} · {COMPETICIO_NOM} · {TEMPORADA_NOM}
          </p>
          <UpdateBanner actualitzat={DADES.actualitzat} />
        </div>
      </header>

      <GroupTabs grups={GRUPS} />

      <main className="site-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/grup/:num" element={<GroupPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>

      <footer className="site-footer">
        <p>
          Dades oficials de la <a href="https://www.fcf.cat" target="_blank" rel="noreferrer">Federació Catalana de Futbol</a> ·{' '}
          {DADES.competicio} · {DADES.temporadaNom}
        </p>
      </footer>
    </div>
  );
}
