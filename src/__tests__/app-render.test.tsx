import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

/** Renders react-dom/server leaves comments (<!-- -->) between text nodes. */
function net(html: string): string {
  return html.replace(/<!-- -->/g, '');
}

describe('App (renderitzat inicial)', () => {
  it('renderitza la capçalera i la llista sense errors', () => {
    const html = net(
      renderToString(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>,
      ),
    );
    expect(html).toContain('Màxims Golejadors');
    expect(html).toContain('Futbol 11');
    expect(html).toContain('Juvenil Segona Divisió');
    expect(html).toContain('Grup 16');
  });

  it('respecta la selecció de grups de l’URL (selecció múltiple)', () => {
    const html = net(
      renderToString(
        <MemoryRouter initialEntries={['/?grups=16']}>
          <App />
        </MemoryRouter>,
      ),
    );
    // Amb només el grup 16 seleccionat, el seu màxim golejador apareix a la llista.
    expect(html).toContain('AGUIRRE LÓPEZ, JAVIER');
    // I el conjunt de la pàgina encara mostra tots els grups com a pestanyes.
    expect(html).toContain('Grup 8');
  });
});
