# Màxims Golejadors 26-27 · Juvenil Segona Divisió (Futbol 11)

Pàgina web estàtica que mostra el llistat de **màxims golejadors** de la competició
**Juvenil Segona Divisió · Futbol 11 · temporada 2026-27**, amb les dades oficials de la
[Federació Catalana de Futbol (FCF)](https://www.fcf.cat).

El projecte es construeix amb **React + Vite + TypeScript** i es publica automàticament a
**GitHub Pages** mitjançant un **GitHub Action diari** que descarrega les dades fresques de
l'API de la FCF, genera el site i el desplega.

## Funcionalitats

- **Rànquing combinat**: tots els golejadors de tots els grups seleccionats, ordenats per gols.
- **Una pàgina per grup**: `/#/grup/8`, `/#/grup/9`, … amb el rànquing oficial de cada grup.
- **Pestanyes de navegació** per a cada grup inclòs.
- Per golejador: posició, nom, equip (amb escut), gols (amb indicació de penals), partits
  jugats i gols per partit.
- **Configurable**: pots indicar quins grups vols que apareguin (els jugadors de la resta de
  grups queden fora del lloc).
- **Robust**: si l'API de la FCF falla (CloudFront retorna 403 intermitents), es mantenen
  les dades de l'últim snapshot i el build continua.

## Com funciona

```
GitHub Action (cada dia 05:00 UTC)
   └─► npm run fetch   → descarrega tots els grups de l'API de FCF i genera src/data/scorers.json
        └─► npm run build → Vite construïx el site estàtic amb les dades incrustades
             └─► actions/deploy-pages → publica a GitHub Pages
```

Les dades s'incrusten al build (no hi ha cap crida a l'API des del navegador), de manera que
el lloc és 100% estàtic i no depèn de la disponibilitat de la FCF en temps d'execució.

## Configuració

Tota la configuració és a [`src/config.ts`](src/config.ts):

```ts
export const TEMPORADA = '22';            // 2026-27
export const DISCIPLINA_ID = '19308233';  // Futbol 11
export const COMPETICIO_ID = '58161949';  // Juvenil Segona Divisió

/** 'tots' = tots els grups; o una llista com [8, 9, 10, 11, 12, 13, 14, 15, 16] */
export const GRUPS_INCLOSOS: number[] | 'tots' = 'tots';
```

Per mostrar **només** els grups 8 a 16, per exemple:

```ts
export const GRUPS_INCLOSOS = [8, 9, 10, 11, 12, 13, 14, 15, 16];
```

i després executa `npm run fetch && npm run build`. Els `grupId` es resolen dinàmicament des
de l'API (no hi ha cap identificador de grup codificat al codi).

## Ús local

```bash
npm install
npm run fetch     # descarrega les dades de la FCF → src/data/scorers.json
npm run dev       # servidor de desenvolupament de Vite
npm run test      # tests (Vitest)
npm run build     # build de producció (inclou tsc --noEmit)
npm run preview   # serveix dist/
```

`src/data/scorers.json` es commita com a snapshot inicial perquè el projecte funcioni sense
xarxa; el workflow el regenera a cada build sense cometre'l.

## Desplegament (GitHub Pages)

El workflow [`.github/workflows/build-deploy.yml`](.github/workflows/build-deploy.yml):

- s'executa **cada dia a les 05:00 UTC** (06:00 a l'hivern / 07:00 a l'estiu a Barcelona),
- també es pot llançar manualment (Run workflow) i s'executa en cada `push` a `main`.

Perquè funcioni cal:

1. Tenir el repositori públic (GitHub Pages en repos privats requereix GitHub Pro).
2. Activar **Settings → Pages → Source: GitHub Actions** (es pot fer a la primera execució;
   el primer cop pot caldre prémer a la UI si el desplegament encara no ha corregut).
3. Si el nom del repositori no és `maxim-golejador-2627`, canvia `BASE_PATH` al workflow
   (i, si saps l'URL, documenta-la al README).

La web es publica a `https://<usuari>.github.io/maxim-golejador-2627/`.

## Font de dades i limitacions

- **Font**: API interna de `https://www.fcf.cat` (`/api/competition/goleadores?grupId=…&temporada=22`,
  `/api/competition/equipos?grupId=…`). No és una API documentada, pot canviar.
- L'API retorna com a molt **50 golejadors per grup** (és el que mostra la web oficial).
- Els noms dels equips es resolen amb l'endpoint `equipos`; si no es troba un equip, es mostra
  «Equip desconegut».
- Els escuts s'enllacen directament des de `files.fcf.cat`; si un escut falla, es mostra una
  insígnia amb les inicials de l'equip.
- Si una crida falla després de 5 reintents (backoff de 2 a 32 segons), es conserven les
  dades antigues d'aquell grup i el build no s'atura.

## Estructura

```
scripts/            # fetcher de la FCF (retries, capçaleres de navegador, filtre de grups)
src/config.ts       # configuració de temporada, competició i grups
src/data/scorers.json  # snapshot generat per npm run fetch
src/lib/            # lògica pura (rànquings, mapeig, filtres) + tests
src/components/     # taules, pestanyes, cel·les d'equip, banner d'actualització
src/pages/          # pàgina combinada i pàgines per grup
.github/workflows/  # workflow diari de build + publicació a GitHub Pages
```
