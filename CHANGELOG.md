# Changelog

## 1.2.1

- Fix: a mouse drag released outside the map no longer leaves the map panning (and jumping back) on the next hover.
- Fix: double-click to zoom no longer selects and then deselects the area under the pointer.
- Fix: `NaN` / `Infinity` values no longer crash colour scales; such areas stay uncoloured and are left out of the automatic domain.
- Fix: a non-integer `steps` in `colorScale` / `Legend` is rounded down instead of producing missing colours.
- Fix: `ItalyDrilldownMap` keeps keyboard focus when a region is opened or closed from the keyboard (back button / previous region), so Escape keeps working.
- Fix: `toSVGString()` no longer exports the province fade-in, which left provinces invisible when rasterised.
- Docs: new "Preparing your data" section in the README (accepted and rejected ids, aggregation, live data, ids in callbacks).
- Docs: `llms.txt`, a guide for AI coding agents, shipped in the npm package and published with the demo.

## 1.2.0

- `ItalyDrilldownMap`: clicking the map background (not another region) goes back to Italy (`closeOnBackgroundClick`, default `true`); a drag never counts as a click.
- `ItalyDrilldownMap`: province selection — `selectedProvinces`, `defaultSelectedProvinces`, `provinceSelectionMode`, `onProvinceSelectionChange`. Region clicks keep opening regions.
- Areas are only dimmed while a selected area is on screen.

## 1.1.0

- New `ItalyDrilldownMap` (`react-italy-map/provinces`): click a region to zoom in and open it into its provinces, with the other regions kept as faded context; back button and Escape to return; `region` / `defaultRegion` / `onRegionChange`, `provinceData`, `provinceColorScale`.
- `zoomTo` ignores far-off islets (Lampedusa, Pantelleria, Tremiti…) so the view frames the main body of an area.

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
