# Màxims Golejadors 26-27 · Juvenil Segona Divisió (Futbol 11)

Pàgina web estàtica que mostra el llistat de **màxims golejadors** de la competició
**Juvenil Segona Divisió · Futbol 11 · temporada 2026-27**, amb les dades oficials de la
[Federació Catalana de Futbol (FCF)](https://www.fcf.cat).

El projecte es construeix amb **React + Vite + TypeScript** i es publica automàticament a
**GitHub Pages** mitjançant un **GitHub Action diari** que descarrega les dades fresques de
l'API de la FCF, genera el site i el desplega.

## Funcionalitats

- **Selecció múltiple de grups**: pots marcar i combinar diversos grups alhora
  (per exemple, selecciona el Grup 8 i després el Grup 9: tots dos queden
  seleccionats i la llista mostra els golejadors dels dos grups junts). La
  selecció es reflecteix a l’URL (`#/?grups=8,9`) i es pot compartir.
- **Rànquing combinat**: els golejadors dels grups seleccionats, ordenats per gols,
  amb la columna «Grup» per saber d'on surt cada jugador.
- **Ordenació per columnes**: clic a qualsevol capçalera (Jugador, Equip, Grup, Gols,
  Partits, Gols/partit) per ordenar la taula de més a menys o a la inversa; un clic més
  inverteix la direcció.
- Botons ràpids **Tots** i **Cap** per seleccionar-ho tot o res.
- Per golejador: posició, nom, equip (amb escut), gols (amb indicació de penals), partits
  jugats i gols per partit.
- **Configurable**: pots indicar quins grups vols que apareguin (els jugadors de la resta de
  grups queden fora del lloc).
- **Robust**: si l'API de la FCF falla (l'origen retorna 403/502 de manera intermitent des
  d'IPs de centres de dades), es mantenen les dades de l'últim snapshot i el build continua
  sense aturar-se. Si la llista de grups no es pot obtenir, es reutilitza la del snapshot
  anterior per intentar actualitzar igualment els golejadors.
- **Snapshot actualitzat**: el workflow commiteja `src/data/scorers.json` al repositori
  quan les dades canvien, de manera que el snapshot (la xarxa de seguretat) sempre està tan
  fresc com l'última generació correcta.

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
- **403 des de centres de dades**: CloudFront de la FCF retorna «Error from cloudfront»
  quan les peticions venen d'IPs de centres de dades (com les de GitHub Actions), mentre
  que des de connexions residencials (la teva) funciona. El fetcher intenta primer la via
  directa i després un proxy públic (r.jina.ai); si tot falla, fa servir l'últim snapshot i
  l'acció **mai no falla**. Per forçar l'actualització manual: executa `npm run fetch` al
  teu ordinador i fes `git push` (el push publica automàticament el build amb les dades
  noves).
- L'API retorna com a molt **50 golejadors per grup** (és el que mostra la web oficial).
- Els noms dels equips es resolen amb l'endpoint `equipos`; si no es troba un equip, es mostra
  «Equip desconegut».
- Els escuts s'enllacen directament des de `files.fcf.cat`; si un escut falla, es mostra una
  insígnia amb les inicials de l'equip.

## Estructura

```
scripts/            # fetcher de la FCF (capçaleres de navegador, reintents ràpids, filtre de grups)
src/config.ts       # configuració de temporada, competició i grups
src/data/scorers.json  # snapshot generat per npm run fetch
src/lib/            # lògica pura (rànquings, mapeig, filtres) + tests
src/components/     # taules, selector de grups, cel·les d'equip, banner d'actualització
src/pages/          # pàgina principal amb rànquing combinat i selecció múltiple de grups
.github/workflows/  # workflow diari de build + publicació a GitHub Pages
```
