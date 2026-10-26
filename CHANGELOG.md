# Changelog

## 2.0.0

### Added
- `ItalyProvincesMap` (`react-italy-map/provinces`): 110 provinces from ISTAT boundaries, `region` filter with auto-fit, region borders overlay.
- Choropleths: `value` + `colorScale` (continuous or `steps`), `formatValue`, `<Legend>`, `createColorScale`, `interpolateColor`.
- Selection: `selected` / `defaultSelected` / `selectionMode` (`single` | `multiple`) / `onSelectionChange`, `dimUnselected`, `disabled` areas.
- Zoom: pinch, drag with pointer events (touch and pen), double click, keyboard `+ − 0`, `maxZoom`, `zoomOnSelect`, animated transitions (respecting reduced motion).
- Imperative `ref`: `zoomTo`, `zoomIn`, `zoomOut`, `resetZoom`, `getSvgElement`, `toSVGString`.
- Accessibility: focusable areas, Enter/Space activation, ARIA roles/labels/pressed state, focus outline, tooltip on focus and on tap.
- `theme` prop and CSS variables; `className`, `width`, `height`, `title`; `include` / `exclude`; `showSanMarino`, `showVatican`; `labelText`; per-area `label`, `hoverColor`, `className`, `meta`.
- `data` as an object keyed by id; ids resolve from ISO, ISTAT, Italian/English names, slugs and aliases.
- `REGIONS` with ISTAT code, English name, capital and macro-area; `findRegion`, `findProvince`, `getProvincesOfRegion`, `getRegionsOfArea`.
- `"use client"`, ESM + CJS, one module per file for tree-shaking, SSR support.

### Changed
- Geometry regenerated from ISTAT boundaries in the same frame as v1: adds minor islands (Tremiti, Giglio, Ponza…), exact borders between regions and provinces, ~half the size.
- Responsive by default (fills the container, keeps aspect ratio).
- `onRegionClick(area, event)` and `onRegionHover(area | null, event)` receive an area object instead of `(code, name)`.
- Tooltip render function receives the area object (`area.name`, `area.code`, `area.data`).
- Provinces updated to the 2025 Sardinian reform (110 entries).
- Tooltip and hover no longer re-render the map on every mouse move.

### Deprecated (still working)
- `InteractiveItalyMap`, `selectedRegion`, the v1 `style` keys, `RegionData`, `MapStyle`, `Province`.
