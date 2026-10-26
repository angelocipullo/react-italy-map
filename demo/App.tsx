import { useState, type ReactNode } from 'react';
import Choropleth from '../examples/Choropleth';
import Filter from '../examples/Filter';
import MultiSelect from '../examples/MultiSelect';
import Drilldown from '../examples/Drilldown';
import Provinces from '../examples/Provinces';
import choroplethSource from '../examples/Choropleth.tsx?raw';
import filterSource from '../examples/Filter.tsx?raw';
import multiSelectSource from '../examples/MultiSelect.tsx?raw';
import drilldownSource from '../examples/Drilldown.tsx?raw';
import provincesSource from '../examples/Provinces.tsx?raw';
import './App.css';
import Hero from './Hero';

// ─── Shared ───────────────────────────────────────────────────────
const CodeBlock = ({ code }: { code: string }) => {
  const lines = code.split('\n');
  return (
    <div className="vscode-editor">
      <div className="line-numbers">
        {lines.map((_, i) => <span key={i}>{i + 1}</span>)}
      </div>
      <pre className="code-content"><code>{code}</code></pre>
    </div>
  );
};

// ─── API Reference ────────────────────────────────────────────────
type ApiTab = 'props' | 'theme' | 'data' | 'ref' | 'utils';

const PROPS_TABLE = [
  { prop: 'data', type: 'AreaData[] | Record<id, …>', default: '—', desc: 'Personalizza le singole aree: color, value, label, child, disabled, className, meta. Gli id accettano codice ISO, codice ISTAT, nome italiano o inglese, slug.' },
  { prop: 'colorScale', type: '{ colors, domain?, steps? } | fn', default: '—', desc: 'Colora le aree in base a value (mappe coropletiche). Il dominio di default è min–max dei valori.' },
  { prop: 'formatValue', type: '(value, area) => string', default: 'toLocaleString', desc: 'Formatta value nel tooltip di default e negli aria-label.' },
  { prop: 'theme', type: 'MapTheme', default: '{}', desc: 'Colori, bordi, etichette, focus. Vedi tab "theme".' },
  { prop: 'width / height', type: 'number | string', default: "'100%' / auto", desc: 'Responsive di default: la mappa riempie la larghezza e mantiene le proporzioni. Con solo height, la larghezza si adatta.' },
  { prop: 'className / style', type: 'string / CSSProperties', default: '—', desc: 'Applicati al contenitore.' },
  { prop: 'selected', type: 'string | string[] | null', default: '—', desc: 'Selezione controllata (qualsiasi id).' },
  { prop: 'defaultSelected', type: 'string | string[]', default: '—', desc: 'Selezione iniziale non controllata.' },
  { prop: 'selectionMode', type: "'none' | 'single' | 'multiple'", default: 'auto', desc: "'single' se passi una prop di selezione, altrimenti 'none'." },
  { prop: 'onSelectionChange', type: '(codes, area) => void', default: '—', desc: 'Nuova selezione (codici canonici) e area cliccata.' },
  { prop: 'dimUnselected', type: 'boolean', default: "true in 'single'", desc: 'Opacizza le altre aree quando qualcosa è selezionato.' },
  { prop: 'onRegionClick', type: '(area, event) => void', default: '—', desc: 'Click o Invio/Spazio su una regione (onProvinceClick per le province).' },
  { prop: 'onRegionHover', type: '(area | null, event) => void', default: '—', desc: 'Hover su una regione; null quando il puntatore esce.' },
  { prop: 'tooltip', type: 'boolean', default: 'true', desc: 'Mostra il tooltip (anche al focus da tastiera e al tap su mobile).' },
  { prop: 'renderTooltip / children', type: '(area) => ReactNode', default: '—', desc: 'Tooltip personalizzato. Riceve { code, name, kind, data, selected, … }.' },
  { prop: 'showLabels', type: 'boolean', default: 'false', desc: 'Etichette sulle aree (nome regione, sigla provincia). Restano leggibili durante lo zoom.' },
  { prop: 'labelText', type: '(area) => string | null', default: '—', desc: 'Testo personalizzato delle etichette.' },
  { prop: 'zoomable', type: 'boolean', default: 'false', desc: 'Zoom con rotella, pinch e doppio click; pan con drag; tasti + − 0.' },
  { prop: 'maxZoom', type: 'number', default: '10', desc: 'Zoom massimo.' },
  { prop: 'showZoomControls', type: 'boolean', default: 'zoomable', desc: 'Pulsanti +/−/reset.' },
  { prop: 'zoomOnSelect', type: 'boolean', default: 'false', desc: 'Zooma automaticamente sulla selezione.' },
  { prop: 'include / exclude', type: 'string[]', default: '—', desc: 'Mostra solo / nascondi alcune aree. Con include la vista si adatta.' },
  { prop: 'showCorsica / showSanMarino / showVatican', type: 'boolean', default: 'true', desc: 'Territori non italiani.' },
  { prop: 'region', type: 'string | string[]', default: '—', desc: 'Solo ItalyProvincesMap: mostra le province delle regioni indicate.' },
  { prop: 'provinceData / selectedProvinces', type: 'AreaData[] / string[]', default: '—', desc: 'Solo ItalyDrilldownMap: dati e selezione delle province; region / onRegionChange per la regione aperta; closeOnBackgroundClick per tornare all\'Italia cliccando lo sfondo.' },
  { prop: 'showRegionBorders', type: 'boolean', default: 'true (Italia intera)', desc: 'Solo ItalyProvincesMap: confini regionali in evidenza.' },
];

const THEME_TABLE = [
  { key: 'fill', def: "'#e2e8f0'", desc: 'Riempimento di default.' },
  { key: 'stroke', def: "'#ffffff'", desc: 'Colore dei confini.' },
  { key: 'strokeWidth', def: '1', desc: 'Spessore dei confini in px (non cresce con lo zoom).' },
  { key: 'hoverFill', def: 'selectedFill', desc: 'Riempimento al passaggio del mouse.' },
  { key: 'selectedFill', def: "'#3b82f6'", desc: 'Riempimento delle aree selezionate.' },
  { key: 'disabledFill', def: "'#f1f5f9'", desc: 'Aree disabilitate senza colore proprio.' },
  { key: 'foreignFill', def: 'fill', desc: 'San Marino, Vaticano, Corsica.' },
  { key: 'dimOpacity', def: '0.3', desc: 'Opacità delle aree non selezionate.' },
  { key: 'focusStroke', def: "'#0f172a'", desc: 'Contorno di focus da tastiera.' },
  { key: 'labelColor / labelHalo / labelSize', def: "'#1e293b' / '#fff' / 9", desc: 'Etichette.' },
  { key: 'regionBorder', def: "'#475569'", desc: 'Confini regionali sulla mappa delle province.' },
];

const DATA_EXAMPLE = `import type { AreaData } from 'react-italy-map';

// Tutti questi id indicano la stessa regione:
// 'IT-25'  '03'  3  'Lombardia'  'lombardia'  'Lombardy'
const data: AreaData<{ sales: number }>[] = [
  { id: 'lombardia', color: '#10b981' },
  { id: 'IT-62', value: 42, child: <span>🏛️</span> },
  { id: 'Sicily', value: 18, label: 'SIC', meta: { sales: 1200 } },
  { id: 'molise', disabled: true },
];

// …oppure come oggetto:
const data2 = { Lazio: { value: 42 }, Sicilia: { value: 18 } };

<ItalyMap
  data={data}
  colorScale={{ colors: ['#dbeafe', '#1e3a8a'], steps: 5 }}
  renderTooltip={(area) => \`\${area.name}: \${area.data?.meta?.sales ?? '—'}\`}
/>`;

const REF_EXAMPLE = `import { useRef } from 'react';
import { ItalyMap, type ItalyMapHandle } from 'react-italy-map';

const ref = useRef<ItalyMapHandle>(null);

<ItalyMap ref={ref} zoomable />

ref.current.zoomTo('Sicilia');            // anche più aree: ['Calabria', 'Sicilia']
ref.current.zoomIn();
ref.current.zoomOut();
ref.current.resetZoom();
ref.current.getSvgElement();              // SVGSVGElement
const svg = ref.current.toSVGString();    // SVG standalone, pronto da scaricare`;

const UTILS_TABLE = [
  {
    name: 'REGIONS', type: 'RegionInfo[]',
    desc: 'Le 20 regioni: code (ISO), istat, name, nameEn, capital, area (macro-area ISTAT).',
    example: `import { REGIONS } from 'react-italy-map';

REGIONS[2]; // { code: 'IT-25', istat: '03', name: 'Lombardia',
            //   nameEn: 'Lombardy', capital: 'Milano', area: 'nord-ovest' }`,
  },
  {
    name: 'PROVINCES', type: 'ProvinceInfo[]',
    desc: 'Le 110 province e città metropolitane (ISTAT, riordino sardo 2025 incluso).',
    example: `import { PROVINCES, PROVINCES_BY_REGION } from 'react-italy-map';

PROVINCES.find(p => p.code === 'MI');
// { code: 'MI', istat: '015', name: 'Milano', region: 'Lombardia',
//   regionCode: 'IT-25', type: 'Città metropolitana' }
PROVINCES_BY_REGION['Puglia'].length; // 6`,
  },
  {
    name: 'findRegion / findProvince', type: '(id) => Info | undefined',
    desc: 'Risolve qualsiasi identificativo: ISO, ISTAT, nome IT/EN, slug, alias.',
    example: `import { findRegion, findProvince, getProvincesOfRegion } from 'react-italy-map';

findRegion('Tuscany')?.code;       // 'IT-52'
findProvince('Reggio Emilia')?.code; // 'RE'
getProvincesOfRegion('IT-88');      // province della Sardegna`,
  },
  {
    name: 'createColorScale', type: '(options) => (value) => string',
    desc: 'La stessa scala usata da colorScale, utilizzabile ovunque (grafici, legende…).',
    example: `import { createColorScale, interpolateColor } from 'react-italy-map';

const color = createColorScale({ colors: ['#fff', '#000'], domain: [0, 100], steps: 4 });
color(60); // '#555555'
interpolateColor('#ff0000', '#0000ff', 0.5); // '#800080'`,
  },
  {
    name: 'Legend', type: 'component',
    desc: 'Legenda coerente con colorScale (continua o a classi).',
    example: `import { Legend } from 'react-italy-map';

<Legend colors={['#dbeafe', '#1e3a8a']} domain={[0, 100]} steps={5} title="Vendite" />`,
  },
];

const ApiReference = () => {
  const [tab, setTab] = useState<ApiTab>('props');
  const labels: Record<ApiTab, string> = { props: 'Props', theme: 'theme', data: 'data', ref: 'ref', utils: 'Utilities' };
  return (
    <section id="api" className="section">
      <h2 className="section-title">API Reference</h2>
      <p className="section-subtitle">Props comuni a <code>ItalyMap</code>, <code>ItalyProvincesMap</code> e <code>ItalyDrilldownMap</code>, tema, dati e utilities.</p>

      <div className="api-tabs">
        {(Object.keys(labels) as ApiTab[]).map(t => (
          <button key={t} className={`api-tab${tab === t ? ' api-tab--active' : ''}`} onClick={() => setTab(t)}>{labels[t]}</button>
        ))}
      </div>

      {tab === 'props' && (
        <div className="api-table-wrap">
          <table className="api-table">
            <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
            <tbody>
              {PROPS_TABLE.map(row => (
                <tr key={row.prop}>
                  <td><code className="api-code">{row.prop}</code></td>
                  <td><code className="api-code api-code--type">{row.type}</code></td>
                  <td><code className="api-code api-code--default">{row.default}</code></td>
                  <td className="api-desc">{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'theme' && (
        <div className="api-table-wrap">
          <table className="api-table">
            <thead><tr><th>Key</th><th>Default</th><th>Description</th></tr></thead>
            <tbody>
              {THEME_TABLE.map(row => (
                <tr key={row.key}>
                  <td><code className="api-code">{row.key}</code></td>
                  <td><code className="api-code api-code--default">{row.def}</code></td>
                  <td className="api-desc">{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="ex-desc" style={{ marginTop: 20 }}>
            Ogni valore diventa una variabile CSS (<code>--rim-fill</code>, <code>--rim-selected</code>, …) sul contenitore
            <code> .rim</code>; le aree hanno le classi <code>rim-area</code>, <code>rim-selected</code>, <code>rim-disabled</code>
            e l'attributo <code>data-code</code>, quindi puoi stilizzarle anche da CSS.
          </p>
        </div>
      )}

      {tab === 'data' && <CodeBlock code={DATA_EXAMPLE} />}
      {tab === 'ref' && <CodeBlock code={REF_EXAMPLE} />}

      {tab === 'utils' && (
        <div className="api-utils-list">
          {UTILS_TABLE.map(item => (
            <div key={item.name} className="api-util-card">
              <div className="api-util-header">
                <code className="api-util-name">{item.name}</code>
                <span className="api-util-type">{item.type}</span>
              </div>
              <p className="api-util-desc">{item.desc}</p>
              <CodeBlock code={item.example} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

// ─── App ──────────────────────────────────────────────────────────
type ExampleId = 'choropleth' | 'filter' | 'multiselect' | 'drilldown' | 'provinces';

const REPO = 'https://github.com/angelocipullo/react-italy-map';

const EXAMPLES: { id: ExampleId; label: string; file: string; component: ReactNode; source: string }[] = [
  { id: 'choropleth', label: 'Data Visualization', file: 'Choropleth.tsx', component: <Choropleth />, source: choroplethSource },
  { id: 'filter', label: 'Content Filter', file: 'Filter.tsx', component: <Filter />, source: filterSource },
  { id: 'multiselect', label: 'Multi-Select', file: 'MultiSelect.tsx', component: <MultiSelect />, source: multiSelectSource },
  { id: 'drilldown', label: 'Province Drilldown', file: 'Drilldown.tsx', component: <Drilldown />, source: drilldownSource },
  { id: 'provinces', label: 'Province + Zoom', file: 'Provinces.tsx', component: <Provinces />, source: provincesSource },
];

const FEATURES = [
  { icon: '🗺️', title: 'Regioni e province', desc: '20 regioni e 110 province da confini ISTAT, con la mappa delle province in un entry point separato.' },
  { icon: '⚡', title: 'Leggera', desc: '~20 KB gzip per la mappa delle regioni, zero dipendenze, tree-shakable, SSR e Next.js ready.' },
  { icon: '📊', title: 'Coropletiche', desc: 'value + colorScale (continua o a classi) e componente Legend.' },
  { icon: '✅', title: 'Selezione', desc: 'Singola o multipla, controllata o no, aree disabilitate.' },
  { icon: '♿', title: 'Accessibile', desc: 'Navigazione da tastiera, ruoli ARIA, focus visibile, tooltip al focus.' },
  { icon: '🔍', title: 'Zoom & touch', desc: 'Rotella, pinch, drag, doppio click, zoomTo animato ed export SVG.' },
];

function App() {
  const [activeExample, setActiveExample] = useState<ExampleId>('choropleth');
  const [showExCode, setShowExCode] = useState(false);
  const active = EXAMPLES.find(e => e.id === activeExample)!;

  return (
    <div className="app">
      <Hero />

      <main className="container">
        <section id="features" className="section">
          <h2 className="section-title">Why use this library?</h2>
          <div className="features-grid">
            {FEATURES.map(f => (
              <div key={f.title} className="feature-card">
                <span className="feature-icon">{f.icon}</span>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <ApiReference />

        <section id="examples" className="section">
          <h2 className="section-title">Live Examples</h2>
          <p className="section-subtitle">Casi d'uso reali, pronti da copiare.</p>

          <div className="ex-tabs-row">
            <div className="ex-tabs">
              {EXAMPLES.map(ex => (
                <button key={ex.id} className={`ex-tab${activeExample === ex.id ? ' ex-tab--active' : ''}`} onClick={() => setActiveExample(ex.id)}>
                  {ex.label}
                </button>
              ))}
            </div>
            <button className={`ex-code-toggle${showExCode ? ' ex-code-toggle--active' : ''}`} onClick={() => setShowExCode(v => !v)}>
              {showExCode ? 'Hide Code' : 'Show Code'}
            </button>
          </div>

          <div className="ex-panel">
            {showExCode ? (
              <>
                <a className="ex-source-link" href={`${REPO}/blob/main/examples/${active.file}`} target="_blank" rel="noreferrer">
                  examples/{active.file} su GitHub ↗
                </a>
                <CodeBlock code={active.source} />
              </>
            ) : active.component}
          </div>
        </section>
      </main>

      <footer style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', borderTop: '1px solid var(--surface-border)' }}>
        <p>© 2026 React Italy Map. Licenza MIT · Confini amministrativi: ISTAT (CC-BY 4.0) via openpolis/geojson-italy.</p>
      </footer>
    </div>
  );
}

export default App;
