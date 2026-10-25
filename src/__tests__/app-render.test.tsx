import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

describe('App (renderitzat inicial)', () => {
  it('renderitza la capçalera i la llista sense errors', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    expect(html).toContain('Màxims Golejadors');
    expect(html).toContain('Futbol 11');
    expect(html).toContain('Juvenil Segona Divisió');
  });

  it('renderitza la pàgina d’un grup concret', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/grup/16']}>
        <App />
      </MemoryRouter>,
    );
    expect(html).toContain('GRUP 16');
  });
});
