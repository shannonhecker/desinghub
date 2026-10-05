# Fonts

Every font the site uses is a file in this folder. Nothing is fetched from
another host, when the site is built or while a page runs.

`fonts.css` declares them (imported once, in `src/app/layout.tsx`). It keeps
the family names the design systems ask for, the CSS variables the app uses
(`--font-outfit`, `--font-inter`, ...) and a metric-matched Arial fallback for
each family, so text holds its place while a font loads.

## Where the files came from

| Folder | Family | Used for | Licence |
| --- | --- | --- | --- |
| `outfit` | Outfit | landing and login | SIL Open Font License 1.1 (`OFL.txt`) |
| `space-grotesk` | Space Grotesk | login | SIL Open Font License 1.1 |
| `bricolage-grotesque` | Bricolage Grotesque | landing and login display type | SIL Open Font License 1.1 |
| `dm-sans` | DM Sans | builder chrome, toasts | SIL Open Font License 1.1 |
| `inter` | Inter | uoaui DS, landing, builder chrome | SIL Open Font License 1.1 |
| `open-sans` | Open Sans | Salt DS | SIL Open Font License 1.1 |
| `roboto` | Roboto | Material 3 | SIL Open Font License 1.1 |
| `ibm-plex-sans` | IBM Plex Sans | Carbon | SIL Open Font License 1.1 |
| `ibm-plex-mono` | IBM Plex Mono | Carbon, code | SIL Open Font License 1.1 |
| `material-symbols` | Material Symbols Outlined | icons inside Material 3 and uoaui DS specimens and canvas blocks | Apache License 2.0 (`LICENSE.txt`) |

Fluent 2 asks for Segoe UI, which is a system font on Windows and is not
redistributable; elsewhere Fluent falls back as it always has.

The nine text families are the WOFF2 files Google Fonts serves for each
family, unmodified: the same files `next/font/google` downloaded at build
time until 5 October 2026, when they were copied here from that build's
output. Each family is split by script (`latin`, `latin-ext`, `cyrillic`,
`greek`, `vietnamese`, ...) with a `unicode-range`, so a page downloads only
the scripts it draws; Latin is the only one most pages fetch. The licence
texts are from https://github.com/google/fonts (`ofl/<family>/OFL.txt`).

`material-symbols/material-symbols-outlined.woff2` is the variable font from
the `material-symbols` npm package (version 0.47.6, font version 2.973,
Copyright Google LLC, Apache 2.0), reduced with fontTools `instancer`: weight
fixed at 400 and grade at 0, which are the only values the site ever asked
for. The fill and optical-size axes and every glyph are kept, because icon
names in canvas blocks come from content. That takes the file from 4.0 MB to
1.1 MB. To rebuild it:

```
pip install fonttools brotli
python - <<'PY'
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
font = TTFont("node_modules/material-symbols/material-symbols-outlined.woff2")
font = instancer.instantiateVariableFont(font, {"wght": 400, "GRAD": 0})
font.flavor = "woff2"
font.save("src/fonts/material-symbols/material-symbols-outlined.woff2")
PY
```

## Changing a font

Add or replace the files, keep the licence text beside them, and update
`fonts.css`. `src/fonts/__tests__/selfHosted.test.ts` checks that every file
is declared, every declared file exists, and each folder has its licence.
