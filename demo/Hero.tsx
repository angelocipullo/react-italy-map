import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ItalyMap, Legend, PROVINCES, REGIONS, findProvince, type ItalyMapHandle, type MapArea, type MapTheme } from 'react-italy-map';
import { ItalyDrilldownMap, ItalyProvincesMap } from 'react-italy-map/provinces';
import { POPULATION, PROVINCE_POP } from '../examples/data/population';
import { version as VERSION } from '../package.json';
import './Hero.css';

const REPO = 'https://github.com/angelocipullo/react-italy-map';
const NPM = 'https://www.npmjs.com/package/react-italy-map';

type PresetId = 'playground' | 'choropleth' | 'multi' | 'provinces' | 'drilldown';

const PRESETS: { id: PresetId; label: string; hint: string }[] = [
  { id: 'playground', label: 'Playground', hint: 'Colori, contenuti custom e selezione. Clicca una regione.' },
  { id: 'choropleth', label: 'Coropletica', hint: 'Popolazione per regione con colorScale e Legend.' },
  { id: 'multi', label: 'Multi-selezione', hint: 'selectionMode="multiple": scegli più regioni, anche da tastiera.' },
  { id: 'provinces', label: '110 Province', hint: 'Tutte le province ISTAT, con zoom. Cerca e vola a una provincia.' },
  { id: 'drilldown', label: 'Drill-down', hint: 'ItalyDrilldownMap: clicca una regione e si apre nelle sue province. Esc per tornare.' },
];

// Map colours tuned for the dark hero.
const DARK: MapTheme = {
  fill: '#475569',
  stroke: '#0b1020',
  hoverFill: '#64748b',
  selectedFill: '#818cf8',
  focusStroke: '#e0e7ff',
  labelColor: '#e2e8f0',
  labelHalo: '#0b1020',
  foreignFill: '#2a3446',
  regionBorder: '#cbd5e1',
};

const HEAT = ['#3b4f86', '#3b82f6', '#a5f3fc'];
const POP_DOMAIN: [number, number] = [0, 10_500_000];

const PLAYGROUND_DATA = [
  { id: 'lombardia', color: '#10b981', child: <span className="hero-pin">🌲</span> },
  { id: 'lazio', color: '#f59e0b', child: <span className="hero-pin">🏛️</span> },
  { id: 'IT-82', color: '#ef4444', child: <span className="hero-pin">🍋</span> },
  { id: 'sardinia', color: '#0ea5e9', child: <span className="hero-badge">Ciao!</span> },
];
const POP_DATA = Object.entries(POPULATION).map(([id, value]) => ({ id, value }));
const PROVINCE_DATA = Object.entries(PROVINCE_POP).map(([name, value]) => ({ id: findProvince(name)?.code ?? name, value }));

const fmtPop = (v: number) => `${v.toLocaleString('it-IT')} ab.`;
const millions = (v: number) => `${(v / 1_000_000).toFixed(1)}M`;

interface LogEntry { id: number; text: string }

const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="hero-toggle">
    <span>{label}</span>
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
    <i aria-hidden />
  </label>
);

const ColorField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <label className="hero-color">
    <input type="color" value={value} onChange={e => onChange(e.target.value)} />
    <span>{label}</span>
    <code>{value}</code>
  </label>
);

function codeFor(preset: PresetId, o: { fill: string; stroke: string; selectedFill: string; labels: boolean; zoom: boolean; zoomOnSelect: boolean; steps: boolean }) {
  const common = `${o.labels ? '\n      showLabels' : ''}${o.zoom ? '\n      zoomable' : ''}`;
  switch (preset) {
    case 'playground':
      return `import { useState } from 'react';
import { ItalyMap } from 'react-italy-map';

export function Map() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <ItalyMap
      theme={{ fill: '${o.fill}', stroke: '${o.stroke}', selectedFill: '${o.selectedFill}' }}
      data={[
        { id: 'lombardia', color: '#10b981', child: <span>🌲</span> },
        { id: 'Sicily', color: '#ef4444', child: <span>🍋</span> },
      ]}
      selected={selected}
      onSelectionChange={(codes) => setSelected(codes[0] ?? null)}${o.zoomOnSelect ? '\n      zoomOnSelect' : ''}${common}
    />
  );
}`;
    case 'choropleth':
      return `import { ItalyMap, Legend } from 'react-italy-map';

const data = [
  { id: 'Lombardia', value: 10_060_574 },
  { id: 'Lazio', value: 5_879_082 },
  // …
];
const colors = ['#3b4f86', '#3b82f6', '#a5f3fc'];

export function Population() {
  return (
    <>
      <Legend colors={colors} domain={[0, 10_500_000]}${o.steps ? ' steps={5}' : ''} title="Popolazione" />
      <ItalyMap
        data={data}
        colorScale={{ colors, domain: [0, 10_500_000]${o.steps ? ', steps: 5' : ''} }}
        formatValue={(v) => \`\${v.toLocaleString('it-IT')} ab.\`}${common}
      />
    </>
  );
}`;
    case 'multi':
      return `import { useState } from 'react';
import { ItalyMap } from 'react-italy-map';

export function Zones() {
  const [zones, setZones] = useState<string[]>([]);
  return (
    <ItalyMap
      selectionMode="multiple"
      selected={zones}
      onSelectionChange={setZones}   // ['IT-25', 'IT-62', …]
      theme={{ selectedFill: '${o.selectedFill}' }}${common}
    />
  );
}`;
    case 'provinces':
      return `import { useRef } from 'react';
import type { ItalyMapHandle } from 'react-italy-map';
import { ItalyDrilldownMap, ItalyProvincesMap } from 'react-italy-map/provinces';

export function Provinces() {
  const ref = useRef<ItalyMapHandle>(null);
  return (
    <>
      <button onClick={() => ref.current?.zoomTo('BA')}>Bari</button>
      <ItalyProvincesMap
        ref={ref}
        defaultSelected={[]}
        zoomOnSelect${common}
      />
    </>
  );
}`;
    case 'drilldown':
      return `import { ItalyDrilldownMap } from 'react-italy-map/provinces';

export function Drilldown() {
  return (
    <ItalyDrilldownMap
      data={regionPopulation}          // [{ id: 'Lombardia', value: … }]
      provinceData={provincePopulation} // [{ id: 'MI', value: … }]
      colorScale={{ colors: ['#3b4f86', '#3b82f6', '#a5f3fc'] }}
      onRegionChange={(r) => console.log(r?.name)}
      onProvinceClick={(p) => console.log(p.code)}${common}
    />
  );
}`;
  }
}

export default function Hero() {
  const [preset, setPreset] = useState<PresetId>('playground');
  const [panel, setPanel] = useState<'controls' | 'code'>('controls');
  const [fill, setFill] = useState('#475569');
  const [stroke, setStroke] = useState('#0b1020');
  const [selectedFill, setSelectedFill] = useState('#818cf8');
  const [labels, setLabels] = useState(false);
  const [zoom, setZoom] = useState(true);
  const [zoomOnSelect, setZoomOnSelect] = useState(true);
  const [steps, setSteps] = useState(false);
  const [single, setSingle] = useState<string | null>(null);
  const [multi, setMulti] = useState<string[]>([]);
  const [province, setProvince] = useState<string[]>([]);
  const [drillRegion, setDrillRegion] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [hovered, setHovered] = useState<MapArea | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const mapRef = useRef<ItalyMapHandle>(null);
  const logId = useRef(0);

  const push = (text: string) => setLog(l => [{ id: ++logId.current, text }, ...l].slice(0, 4));
  const switchPreset = (id: PresetId) => {
    setPreset(id);
    setHovered(null);
    setDrillRegion(null);
    setLabels(id === 'provinces' || id === 'drilldown');
    push(`preset → ${id}`);
  };

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  const copyInstall = () => {
    navigator.clipboard?.writeText('npm i react-italy-map').then(() => setCopied(true), () => {});
  };

  const download = () => {
    const svg = mapRef.current?.toSVGString();
    if (!svg) return;
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `italia-${preset}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    push('ref.toSVGString() → download');
  };

  const tooltip = (a: MapArea) => (
    <div className="hero-tip">
      <strong>{a.name}</strong>
      <span>
        {a.code}
        {typeof a.data?.value === 'number' && <> · {fmtPop(a.data.value)}</>}
      </span>
    </div>
  );

  const common = {
    ref: mapRef,
    width: '100%',
    height: '100%',
    showLabels: labels,
    zoomable: zoom,
    renderTooltip: tooltip,
    onRegionHover: (a: MapArea | null) => setHovered(a),
    onProvinceHover: (a: MapArea | null) => setHovered(a),
  };

  let map: ReactNode;
  let overlay: ReactNode = null;
  switch (preset) {
    case 'playground':
      map = (
        <ItalyMap
          {...common}
          theme={{ ...DARK, fill, stroke, selectedFill, hoverFill: '#64748b' }}
          data={PLAYGROUND_DATA}
          selected={single}
          zoomOnSelect={zoomOnSelect}
          onSelectionChange={(codes, a) => { setSingle(codes[0] ?? null); push(`onSelectionChange → [${codes.join(', ')}] · ${a.name}`); }}
        />
      );
      break;
    case 'choropleth':
      map = (
        <ItalyMap
          {...common}
          theme={{ ...DARK, hoverFill: '#f59e0b' }}
          data={POP_DATA}
          colorScale={{ colors: HEAT, domain: POP_DOMAIN, steps: steps ? 5 : undefined }}
          formatValue={fmtPop}
          showCorsica={false}
          onRegionClick={a => push(`onRegionClick → ${a.name}: ${fmtPop(a.data?.value ?? 0)}`)}
        />
      );
      overlay = (
        <div className="hero-legend">
          <Legend colors={HEAT} domain={POP_DOMAIN} steps={steps ? 5 : undefined} title="Popolazione residente" format={millions} />
        </div>
      );
      break;
    case 'multi':
      map = (
        <ItalyMap
          {...common}
          theme={{ ...DARK, selectedFill: '#22d3ee', hoverFill: '#0e7490' }}
          selectionMode="multiple"
          selected={multi}
          showCorsica={false}
          onSelectionChange={(codes, a) => { setMulti(codes); push(`${a.selected ? '+' : '−'} ${a.name} · ${codes.length} selezionate`); }}
        />
      );
      break;
    case 'provinces':
      map = (
        <ItalyProvincesMap
          {...common}
          theme={{ ...DARK, selectedFill: '#f472b6', hoverFill: '#be185d', labelSize: 14 }}
          selected={province}
          zoomOnSelect
          onSelectionChange={(codes, a) => { setProvince(codes); push(`onSelectionChange → ${a.name} (${a.code})`); }}
        />
      );
      break;
    case 'drilldown':
      map = (
        <ItalyDrilldownMap
          {...common}
          theme={{ ...DARK, hoverFill: '#f59e0b', labelSize: 14 }}
          data={POP_DATA}
          provinceData={PROVINCE_DATA}
          colorScale={{ colors: HEAT }}
          formatValue={fmtPop}
          showCorsica={false}
          region={drillRegion}
          onRegionChange={r => { setDrillRegion(r?.code ?? null); setHovered(null); push(r ? `onRegionChange → ${r.name}` : 'onRegionChange → null'); }}
          onProvinceClick={p => push(`onProvinceClick → ${p.name} (${p.code})`)}
          backLabel="← Italia"
        />
      );
      break;
  }

  const matches = query.length > 1
    ? PROVINCES.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.code === query.toUpperCase()).slice(0, 5)
    : [];
  const active = PRESETS.find(p => p.id === preset)!;

  return (
    <section className="hero2" id="home">
      <div className="hero2-bg" aria-hidden />

      <header className="topbar">
        <a href="#home" className="topbar-logo">
          <span className="topbar-mark" aria-hidden>◆</span> react-italy-map
        </a>
        <nav className="topbar-links">
          <a href="#features">Features</a>
          <a href="#api">API</a>
          <a href="#examples">Esempi</a>
          <a href={NPM} target="_blank" rel="noreferrer">npm</a>
          <a href={REPO} target="_blank" rel="noreferrer" className="topbar-gh">GitHub ↗</a>
        </nav>
      </header>

      <div className="hero2-grid">
        <aside className="hero2-panel">
          <div className="hero2-badges">
            <span className="pill pill--glow">v{VERSION}</span>
            <span className="pill">~20 KB gzip</span>
            <span className="pill">MIT</span>
          </div>
          <h1 className="hero2-title">
            L'Italia, <em>interattiva</em>.<br />In un componente React.
          </h1>
          <p className="hero2-sub">
            20 regioni e 110 province da confini ISTAT. Coropletiche, selezione, zoom,
            accessibilità e SSR — zero dipendenze.
          </p>

          <div className="hero2-install">
            <code><span>$</span> npm i react-italy-map</code>
            <button onClick={copyInstall} aria-label="Copia comando">{copied ? '✓ Copiato' : 'Copia'}</button>
          </div>

          <div className="chips" role="tablist" aria-label="Esempi">
            {PRESETS.map(p => (
              <button
                key={p.id}
                role="tab"
                aria-selected={preset === p.id}
                className={`chip${preset === p.id ? ' chip--on' : ''}`}
                onClick={() => switchPreset(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="hero2-hint">{active.hint}</p>

          <div className="card">
            <div className="seg" role="tablist">
              <button role="tab" aria-selected={panel === 'controls'} className={panel === 'controls' ? 'on' : ''} onClick={() => setPanel('controls')}>Controlli</button>
              <button role="tab" aria-selected={panel === 'code'} className={panel === 'code' ? 'on' : ''} onClick={() => setPanel('code')}>Codice</button>
            </div>

            {panel === 'controls' ? (
              <div className="card-body">
                {preset === 'playground' && (
                  <div className="colors">
                    <ColorField label="fill" value={fill} onChange={setFill} />
                    <ColorField label="stroke" value={stroke} onChange={setStroke} />
                    <ColorField label="selectedFill" value={selectedFill} onChange={setSelectedFill} />
                  </div>
                )}
                {preset === 'choropleth' && <Toggle label="Classi discrete (steps: 5)" checked={steps} onChange={setSteps} />}
                {preset === 'multi' && (
                  <div className="sel-list">
                    {multi.length ? multi.map(c => (
                      <button key={c} className="sel-tag" onClick={() => setMulti(m => m.filter(x => x !== c))}>
                        {REGIONS.find(r => r.code === c)?.name} ×
                      </button>
                    )) : <span className="muted">Nessuna regione selezionata</span>}
                    {multi.length > 0 && <button className="link" onClick={() => setMulti([])}>Azzera</button>}
                  </div>
                )}
                {preset === 'provinces' && (
                  <div className="search">
                    <input placeholder="Cerca provincia… (Bari, MI, Trento)" value={query} onChange={e => setQuery(e.target.value)} aria-label="Cerca provincia" />
                    {matches.map(p => (
                      <button key={p.code} onClick={() => { setProvince([p.code]); setQuery(''); push(`zoomTo('${p.code}')`); }}>
                        <span>{p.name}</span><code>{p.code}</code><small>{p.region}</small>
                      </button>
                    ))}
                  </div>
                )}
                <Toggle label="showLabels" checked={labels} onChange={setLabels} />
                <Toggle label="zoomable" checked={zoom} onChange={setZoom} />
                {preset === 'playground' && <Toggle label="zoomOnSelect" checked={zoomOnSelect} onChange={setZoomOnSelect} />}
                <div className="actions">
                  <button onClick={() => { mapRef.current?.zoomTo(['Calabria', 'Sicilia']); push(`zoomTo(['Calabria', 'Sicilia'])`); }} disabled={preset === 'provinces' || !!drillRegion}>Vola al Sud</button>
                  <button onClick={() => { mapRef.current?.resetZoom(); push('resetZoom()'); }}>Reset</button>
                  <button onClick={download}>Export SVG</button>
                </div>
              </div>
            ) : (
              <pre className="code"><code>{codeFor(preset, { fill, stroke, selectedFill, labels, zoom, zoomOnSelect, steps })}</code></pre>
            )}
          </div>

          <div className="log" aria-live="polite">
            <span className="log-title">eventi</span>
            {log.length ? log.map((e, i) => <div key={e.id} style={{ opacity: 1 - i * 0.22 }}>{e.text}</div>) : <div className="muted">Interagisci con la mappa…</div>}
          </div>
        </aside>

        <div className="hero2-map">
          <div className="hero2-map-inner" key={preset}>{map}</div>
          {overlay}
          <div className="hero2-status">
            <span className={`dot${hovered ? ' dot--on' : ''}`} />
            {hovered ? <><b>{hovered.name}</b> <code>{hovered.code}</code>{hovered.istat && <small>ISTAT {hovered.istat}</small>}</> : <span className="muted">Passa sopra la mappa</span>}
          </div>
          <a href="#features" className="hero2-scroll" aria-label="Scorri">↓</a>
        </div>
      </div>
    </section>
  );
}
