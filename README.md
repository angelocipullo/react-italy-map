# React Italy Map

Lightweight, accessible, interactive SVG map of Italy for React — **20 regions and 110 provinces**, choropleths, single/multi selection, zoom & pinch, tooltips and keyboard navigation. Zero dependencies, ~20 KB gzip.

**[Live demo](https://angelocipullo.github.io/react-italy-map/)** · [Examples](examples/)

```bash
npm install react-italy-map
```

```tsx
import { ItalyMap } from 'react-italy-map';

<ItalyMap onRegionClick={(region) => console.log(region.name, region.code)} />
```

## Features

- 🗺️ **Regions and provinces** — 20 regions plus San Marino, Vatican City and Corsica; all 110 provinces / metropolitan cities (ISTAT boundaries, 2025 Sardinian reform included) in a separate entry point.
- ⚡ **Light** — region map ≈ 20 KB gzip, no runtime dependencies, tree-shakable (`sideEffects: false`, one file per module). Province geometry is only bundled if you import it.
- 📊 **Choropleths** — pass a `value` per area and a `colorScale` (continuous or stepped); `<Legend>` matches it.
- ✅ **Selection** — single or multiple, controlled or uncontrolled, disabled areas.
- 🔍 **Zoom** — mouse wheel, pinch, drag to pan, double click, `+ − 0` keys, animated `zoomTo()`, zoom to selection.
- ♿ **Accessible** — keyboard navigation (Tab, Enter, Space), ARIA roles and labels, visible focus, tooltips on focus and on tap.
- 📱 **Responsive** — fills its container by default and keeps its aspect ratio.
- 🧩 **Flexible ids** — `'IT-25'`, `'03'`, `'Lombardia'`, `'lombardy'`, `'MI'`, `'Milano'`… all work, case- and accent-insensitive.
- 🎨 **Themable** — `theme` prop, CSS variables, stable class names and `data-code` attributes.
- ⚙️ **SSR / Next.js ready** — renders on the server, ships `"use client"`, ESM + CJS, TypeScript types.
- 💾 **Export** — `ref.toSVGString()` returns standalone SVG markup.

## Usage

### Choropleth

```tsx
import { ItalyMap, Legend } from 'react-italy-map';

const data = [
  { id: 'Lombardia', value: 10_060_574 },
  { id: 'Lazio', value: 5_879_082 },
  { id: 'Sicily', value: 4_875_290 },
  // …
];

<Legend colors={['#dbeafe', '#1e3a8a']} domain={[0, 10_500_000]} title="Population" />
<ItalyMap
  data={data}
  colorScale={{ colors: ['#dbeafe', '#1e3a8a'], domain: [0, 10_500_000], steps: 5 }}
  formatValue={(v) => `${v.toLocaleString('it-IT')} inhabitants`}
/>
```

Without `domain`, the scale spans the min–max of the visible values.

### Selection

```tsx
const [selected, setSelected] = useState<string[]>([]);

<ItalyMap
  selectionMode="multiple"          // or 'single'
  selected={selected}               // controlled; or use defaultSelected
  onSelectionChange={setSelected}   // ['IT-25', 'IT-62', …]
  zoomOnSelect
/>
```

Selection is enabled (`'single'`) as soon as you pass `selected`, `defaultSelected` or `onSelectionChange`; otherwise clicks only fire `onRegionClick`.

### Provinces and drill-down

```tsx
import { ItalyMap } from 'react-italy-map';
import { ItalyProvincesMap } from 'react-italy-map/provinces';

function Drilldown() {
  const [region, setRegion] = useState<string | null>(null);
  return region
    ? <ItalyProvincesMap region={region} showLabels onProvinceClick={(p) => console.log(p.code)} />
    : <ItalyMap onRegionClick={(r) => setRegion(r.code)} />;
}
```

`region` accepts one or more regions and fits the view to them. On the full province map, region borders are drawn thicker (`showRegionBorders`).

### Click to open a region into its provinces

`ItalyDrilldownMap` starts with the regions; clicking one zooms in and reveals its provinces in place, with the rest of Italy kept as faded context. A back button and the Escape key return to the whole country.

```tsx
import { ItalyDrilldownMap } from 'react-italy-map/provinces';

<ItalyDrilldownMap
  data={regionPopulation}            // [{ id: 'Lombardia', value: 10_060_574 }, …]
  provinceData={provincePopulation}  // [{ id: 'MI', value: 3_250_315 }, …]
  colorScale={{ colors: ['#e0f2fe', '#0369a1'] }}
  showLabels
  onRegionChange={(region) => console.log(region?.name ?? 'Italia')}
  onProvinceClick={(province) => console.log(province.code)}
/>
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `region` / `defaultRegion` | `string \| null` | — | Open region, controlled / uncontrolled (any region id). |
| `onRegionChange` | `(region \| null) => void` | — | A region was opened or closed. |
| `provinceData` | `AreaData[] \| Record<id, …>` | — | Province data; `data` is for regions. |
| `provinceColorScale` | like `colorScale` | `colorScale` | Without `domain`, spans the provinces of the open region. |
| `dimOthers` | `boolean` | `true` | Fade the other regions while one is open. |
| `showBackButton` / `backLabel` | `boolean` / `string` | `true` / `'← Italia'` | |
| `onRegionClick` / `onProvinceClick`, `onRegionHover` / `onProvinceHover` | | — | |

It accepts the other map props (`theme`, `showLabels`, `zoomable`, `renderTooltip`, `ref`…) except the selection ones.

### Custom tooltip, labels and content

```tsx
<ItalyMap
  data={[
    { id: 'Lazio', child: <span>🏛️</span> },             // any React node at the centre
    { id: 'Umbria', label: 'UMB' },                        // custom label
    { id: 'Molise', disabled: true },                      // not clickable
    { id: 'IT-82', value: 18, meta: { manager: 'Anna' } }, // extra data for you
  ]}
  showLabels
  renderTooltip={(area) => (
    <div className="my-tooltip">{area.name} — {area.data?.meta?.manager ?? 'n/a'}</div>
  )}
/>
```

### Imperative API

```tsx
const ref = useRef<ItalyMapHandle>(null);

<ItalyMap ref={ref} zoomable />

ref.current?.zoomTo(['Calabria', 'Sicilia']);
ref.current?.zoomIn();
ref.current?.zoomOut();
ref.current?.resetZoom();
ref.current?.getSvgElement();
const svg = ref.current?.toSVGString(); // standalone SVG, e.g. for a download
```

## API

`ItalyMap`, `ItalyProvincesMap` and `ItalyDrilldownMap` share these props (the drill-down map has no selection props).

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `AreaData[] \| Record<id, …>` | — | Per-area `color`, `hoverColor`, `value`, `label`, `child`, `disabled`, `className`, `meta`. |
| `colorScale` | `{ colors, domain?, steps? } \| (value, area) => string` | — | Colours areas by `value`. `color` wins over it. |
| `formatValue` | `(value, area) => string` | `toLocaleString` | Value in the default tooltip and in `aria-label`. |
| `theme` | `MapTheme` | — | See below. |
| `width` / `height` | `number \| string` | `'100%'` / auto | With only `height`, the width follows the aspect ratio. |
| `className` / `style` | | — | Applied to the container. |
| `title` | `string` | Italian description | Accessible name of the map. |
| `selected` | `string \| string[] \| null` | — | Controlled selection (any id). |
| `defaultSelected` | `string \| string[]` | — | Uncontrolled initial selection. |
| `selectionMode` | `'none' \| 'single' \| 'multiple'` | auto | See *Selection*. |
| `onSelectionChange` | `(codes, area) => void` | — | |
| `dimUnselected` | `boolean` | `true` in single mode | Fade the other areas while something is selected. |
| `onRegionClick` / `onProvinceClick` | `(area, event) => void` | — | Click, Enter or Space. |
| `onRegionHover` / `onProvinceHover` | `(area \| null, event) => void` | — | |
| `tooltip` | `boolean` | `true` | |
| `renderTooltip` / `children` | `(area) => ReactNode` | — | |
| `showLabels` | `boolean` | `false` | Region name / province code; constant size while zooming. |
| `labelText` | `(area) => string \| null` | — | |
| `zoomable` | `boolean` | `false` | Wheel, pinch, drag, double click, `+ − 0`. |
| `maxZoom` | `number` | `10` | |
| `showZoomControls` | `boolean` | `zoomable` | |
| `zoomOnSelect` | `boolean` | `false` | |
| `include` / `exclude` | `string[]` | — | Show only / hide some areas; `include` fits the view. |
| `showCorsica` / `showSanMarino` / `showVatican` | `boolean` | `true` | |
| `region` | `string \| string[]` | — | `ItalyProvincesMap` only. |
| `showRegionBorders` | `boolean` | `true` on the full map | `ItalyProvincesMap` only. |

Callbacks and tooltips receive a `MapArea`:

```ts
{ code: 'IT-25', name: 'Lombardia', kind: 'region', istat: '03', selected: false, disabled: false, data?: AreaData }
// provinces also have regionCode: 'IT-25'
```

### Theme

| Key | Default |
|---|---|
| `fill` | `#e2e8f0` |
| `stroke` | `#ffffff` |
| `strokeWidth` | `1` (screen px) |
| `hoverFill` | `selectedFill` |
| `selectedFill` | `#3b82f6` |
| `disabledFill` | `#f1f5f9` |
| `foreignFill` | `fill` |
| `dimOpacity` | `0.3` |
| `focusStroke` | `#0f172a` |
| `labelColor` / `labelHalo` / `labelSize` | `#1e293b` / `#ffffff` / `9` |
| `regionBorder` | `#475569` |

Every value is also a CSS variable on the `.rim` container (`--rim-fill`, `--rim-selected`, …). Areas are `<path class="rim-area" data-code="IT-25">` with `rim-selected`, `rim-disabled` and `rim-dim` classes, so plain CSS works too:

```css
.rim-area[data-code='IT-62'] { fill: gold; }
.rim-area.rim-selected { filter: drop-shadow(0 2px 4px rgb(0 0 0 / .3)); }
```

### Data and utilities

```ts
import {
  REGIONS, PROVINCES, PROVINCES_BY_REGION,
  findRegion, findProvince, getProvincesOfRegion, getRegionsOfArea,
  createColorScale, interpolateColor, normalizeId,
} from 'react-italy-map';

findRegion('Tuscany');          // { code: 'IT-52', istat: '09', name: 'Toscana', nameEn: 'Tuscany', capital: 'Firenze', area: 'centro' }
findProvince('015');            // { code: 'MI', name: 'Milano', regionCode: 'IT-25', type: 'Città metropolitana', … }
getProvincesOfRegion('IT-88');  // the 8 Sardinian provinces
getRegionsOfArea('isole');      // Sicilia, Sardegna
createColorScale({ colors: ['#fff', '#000'], domain: [0, 100] })(50); // '#808080'
```

Accepted ids: regions by ISO code (`IT-25`), ISTAT code (`03`, `3`), Italian or English name, slug, bilingual official name; provinces by sigla (`MI`), ISTAT code (`015`), `IT-MI`, name and common aliases (`Reggio Emilia`, `Monza e Brianza`, `Bolzano/Bozen`…). Neighbours: `SM`, `VA`, `FR-H`.

## Bundle size

Measured after minification, as your bundler would ship it:

| Import | min | gzip |
|---|---|---|
| `ItalyMap` | 55 KB | 20.5 KB |
| `ItalyProvincesMap` | 110 KB | 36 KB |
| `ItalyDrilldownMap` | 133 KB | 47 KB |
| `findRegion` only | 17 KB | 3.7 KB |

Run `npm run size` to measure again.

## Next.js / SSR

The map renders on the server (tooltips mount on the client). The components already carry `"use client"`, so they work straight from Server Components.

## Examples

Complete, copy-pasteable components in [`examples/`](examples/) — the same ones running in the [live demo](https://angelocipullo.github.io/react-italy-map/):

| Example | Shows |
|---|---|
| [Choropleth](examples/Choropleth.tsx) | `value` + `colorScale`, `Legend`, hover callback |
| [Filter](examples/Filter.tsx) | single selection as a filter, disabled regions, custom tooltip |
| [MultiSelect](examples/MultiSelect.tsx) | `selectionMode="multiple"` |
| [Drilldown](examples/Drilldown.tsx) | `ItalyDrilldownMap`: click a region to open its provinces |
| [Provinces](examples/Provinces.tsx) | all provinces, zoom, `ref.zoomTo`, SVG export |

They use the demo stylesheet for layout; the map code works anywhere.

## Development

```bash
npm run dev        # showcase site (demo/ + examples/)
npm test           # vitest
npm run build      # library → dist/
npm run geo        # regenerate src/data from ISTAT boundaries
npm run size       # bundle size report
```

`scripts/build-geo.mjs` downloads the ISTAT boundaries, projects them into the map frame, simplifies the shared topology (so borders stay exact between regions and provinces) and writes compact SVG paths. Tune detail with `--tolerance`.

## Data attribution

Administrative boundaries © [ISTAT](https://www.istat.it/), licensed [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/), via [openpolis/geojson-italy](https://github.com/openpolis/geojson-italy). Corsica outline drawn in the same frame.

## License

[MIT](LICENSE) © Angelo Cipullo. Boundary data: ISTAT, CC-BY 4.0 (see above).
