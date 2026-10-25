import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// BASE_PATH es defineix al workflow (GitHub Pages serveix el projecte sota /<nom-del-repo>/)
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [react()],
  // El JSON amb els golejadors (~2.350 entrades) va incrustat al bundle.
  build: {
    chunkSizeWarningLimit: 1100,
  },
});
