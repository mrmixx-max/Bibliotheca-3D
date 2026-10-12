# Bibliotheca 3D

Ein 3D-EPUB-Reader für den Browser. Bücher werden als Canvas-Texturen auf ein
Three.js-Buchmodell gerendert — mit Seitenblätter-Ansicht, umschaltbarem
2D-Lesemodus, Vorleser und Lesezeichen.

## Funktionen

- **3D-Buchansicht** — Three.js-Szene mit Tisch, Kerzenlicht und prozedural
  erzeugten Holz- und Papiertexturen (keine externen Assets nötig)
- **2D-Lesemodus** — flache Einzel- oder Doppelseitenansicht
- **EPUB-Import** — Drag & Drop oder über die Bibliothek; Container/OPF/Spine
  werden vollständig ausgewertet, Bilder inline eingebettet
- **Markierungen** — Textstellen in vier Farben hervorheben, optional mit Notiz
- **Lesezeichen** — Seiten anheften und mit Kommentar versehen
- **Volltextsuche** — mit Kapitel- und Ganzbuch-Filter
- **Bionic Reading** — fette Wortanker zur schnelleren Erfassung
- **Vorleser** — Web Speech API, deutsch
- **Isochrone Töne** — 15,4 / 10 / 40 / 7,83 Hz über Web Audio
- **Atmosphären** — Kerzenlicht, Mitternacht, Banker, Tageslicht
- **Einzeldatei-Export** — Buch als eine HTML-Datei, offline lesbar

## Entwicklung

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run lint     # tsc --noEmit
npm run build    # dist/
npm run preview  # gebauten Stand lokal ansehen
```

Auf Systemen, die Postinstall-Skripte blockieren (z. B. eingeschränkte
Windows-Umgebungen), hilft:

```bash
npm install --legacy-peer-deps --ignore-scripts
```

## Stack

React 19 · TypeScript 7 · Vite 8 · Tailwind 4 · Three.js 0.186 · JSZip ·
DOMPurify

## Sicherheit

EPUB-Inhalte sind Fremddaten. Der Parser schickt jedes Kapitel durch
DOMPurify, bevor es weiterverarbeitet wird: Skripte, Event-Handler,
`iframe`/`object`/`form` und Inline-`style` werden entfernt. Damit können
geliehene oder heruntergeladene Bücher keinen Code im Reader ausführen und
nicht auf den localStorage zugreifen.

Die Whitelist liegt in `src/utils/epubParser.ts` (`BOOK_SANITIZE_CONFIG`).

## Datenhaltung

Alles bleibt lokal im `localStorage` des Browsers — kein Server, keine
Telemetrie. Lesezeichen, Markierungen und Lesefortschritt sind pro Buch
getrennt (`src/utils/bookIdentity.ts`).

## Lizenz

Apache-2.0
