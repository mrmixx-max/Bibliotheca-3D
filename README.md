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

## Desktop-App (Windows)

Neben der Web-Version gibt es einen nativen Desktop-Build auf Tauri 2. Er
ergänzt das, was der Browser nicht kann:

- **Nativer Datei-Dialog** zum Öffnen von EPUBs (kein Datei-Upload nötig)
- **Drag & Drop aus dem Explorer** — Tauri liefert den Pfad, die Datei wird
  direkt gelesen
- **Speichern-Dialog** für den HTML-Export statt Downloads-Ordner
- **Menüleiste mit Tastenkürzeln** (Strg+O öffnen, Strg+F Suche, Strg+B
  Lesezeichen, Strg+D 3D/2D, Strg+R Schnellleser …)
- **Dunkles Fenster** in der App-Farbe, kein weißes Aufblitzen beim Start

Voraussetzungen: Rust (stable) mit MSVC-Toolchain und das WebView2-Runtime
(auf Windows 11 vorinstalliert).

```bash
npm run desktop          # Entwicklungsmodus mit Hot Reload
npm run desktop:build    # Installer bauen (MSI + NSIS)
npm run desktop:nsis     # nur NSIS-Setup
npm run desktop:msi      # nur MSI
```

Die Installer landen in `src-tauri/target/release/bundle/`. Das Setup
installiert pro Maschine, bietet Deutsch und Englisch zur Auswahl und zieht
die WebView2-Runtime nach, falls sie fehlt.

### Icons

`app-icon.svg` ist die Quelle (offenes Buch mit Goldrücken und Lesebändchen).
Daraus entstehen alle Formate:

```bash
# SVG -> PNG (Edge headless, kein zusätzliches Werkzeug nötig)
"$EDGE" --headless=new --window-size=1024,1024 \
  --default-background-color=00000000 --screenshot=app-icon.png app-icon-render.html

npm run installer-art          # NSIS-Header und -Sidebar (BMP)
npx tauri icon app-icon.png    # alle Plattform-Icons nach src-tauri/icons
```

## Stack

React 19 · TypeScript 7 · Vite 8 · Tailwind 4 · Three.js 0.186 · JSZip ·
DOMPurify · Tauri 2 · Rust

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
