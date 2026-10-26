# Changelog

## 1.0.2

- Fix: a selected area keeps `selectedFill` while hovered (the hover colour used to win).

## 1.0.1

First public release.

- `ItalyMap`: the 20 Italian regions plus San Marino, Vatican City and Corsica.
- `ItalyProvincesMap` (`react-italy-map/provinces`): 110 provinces from ISTAT boundaries (2025 Sardinian reform included), `region` filter with auto-fit, region borders overlay.
- Choropleths: `value` + `colorScale` (continuous or `steps`), `formatValue`, `<Legend>`, `createColorScale`, `interpolateColor`.
- Selection: `selected` / `defaultSelected` / `selectionMode` (`single` | `multiple`) / `onSelectionChange`, `dimUnselected`, disabled areas.
- Zoom: wheel, pinch, drag, double click, keyboard `+ − 0`, `maxZoom`, `zoomOnSelect`, animated transitions respecting reduced motion.
- Imperative `ref`: `zoomTo`, `zoomIn`, `zoomOut`, `resetZoom`, `getSvgElement`, `toSVGString`.
- Accessibility: focusable areas, Enter/Space activation, ARIA roles and labels, focus outline, tooltip on focus and on tap.
- Responsive sizing, `theme` prop and CSS variables, labels, custom content per area, `include` / `exclude`.
- Flexible ids (ISO, ISTAT, Italian/English names, slugs, aliases) and data helpers: `REGIONS`, `PROVINCES`, `findRegion`, `findProvince`, `getProvincesOfRegion`, `getRegionsOfArea`.
- `"use client"`, ESM + CJS, tree-shakable, SSR support.
