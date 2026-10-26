import { useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ItalyMap,
  Legend,
  PROVINCES,
  PROVINCES_BY_REGION,
  REGIONS,
  findProvince,
  type ItalyMapHandle,
} from '../src';
import { ItalyProvincesMap } from '../src/provinces';
import './App.css';

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

const Switch = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <div className="control-group">
    <div className="switch-container">
      <span className="label" style={{ marginBottom: 0 }}>{label}</span>
      <label className="switch">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} aria-label={label} />
        <span className="slider" />
      </label>
    </div>
  </div>
);

const download = (svg: string, name: string) => {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
};

// ─── Hero configurator ────────────────────────────────────────────
const HERO_DATA = [
  { id: 'lombardia', color: '#10b981', child: <span style={{ fontSize: '20px' }}>🌲</span> },
  { id: 'lazio', color: '#f59e0b', child: <span style={{ fontSize: '20px' }}>🏛️</span> },
  { id: 'IT-82', color: '#ef4444', child: <span style={{ fontSize: '20px' }}>🍋</span> },
  { id: 'sardinia', color: '#3b82f6', child: <span style={{ color: 'white', fontWeight: 'bold', background: '#2b2b2b', borderRadius: 5, padding: '2px 6px' }}>Ciao!</span> },
];

// ─── Example 1: Choropleth ────────────────────────────────────────
const POPULATION: Record<string, number> = {
  'Lombardia': 10060574, 'Lazio': 5879082, 'Campania': 5712143,
  'Sicilia': 4875290, 'Veneto': 4905854, 'Piemonte': 4311217,
  'Emilia-Romagna': 4464119, 'Puglia': 3953305, 'Toscana': 3692555,
  'Calabria': 1894110, 'Sardegna': 1611621, 'Liguria': 1524826,
  'Marche': 1512672, 'Abruzzo': 1293941, 'Friuli-Venezia Giulia': 1206216,
  'Trentino-Alto Adige': 1072276, 'Umbria': 870165, 'Basilicata': 545131,
  'Molise': 290769, "Valle d'Aosta": 125034,
};
const POP_COLORS = ['#dbeafe', '#3b82f6', '#1e3a8a'];
const POP_DOMAIN: [number, number] = [0, 10_500_000];
const millions = (v: number) => `${(v / 1_000_000).toFixed(1)}M`;

const ChoroplethExample = () => {
  const [hovered, setHovered] = useState<string | null>(null);
  const [stepped, setStepped] = useState(false);
  const data = Object.entries(POPULATION).map(([id, value]) => ({ id, value }));
  const sorted = Object.entries(POPULATION).sort((a, b) => b[1] - a[1]);

  return (
    <div className="ex-layout">
      <div className="ex-sidebar">
        <p className="ex-desc">
          Passa un <code>value</code> per regione e una <code>colorScale</code>: i colori
          vengono calcolati dalla libreria. Il componente <code>Legend</code> usa la stessa scala.
        </p>
        <Legend colors={POP_COLORS} domain={POP_DOMAIN} steps={stepped ? 5 : undefined} title="Popolazione" format={millions} />
        <Switch label="Classi discrete (steps: 5)" checked={stepped} onChange={setStepped} />
        <div className="ex-list">
          {sorted.map(([name, pop]) => (
            <div key={name} className={`ex-list-row${hovered === name ? ' ex-list-row--active' : ''}`}>
              <span className="ex-list-name">{name}</span>
              <span className="ex-list-value">{(pop / 1_000_000).toFixed(2)}M</span>
            </div>
          ))}
        </div>
      </div>
      <div className="ex-map">
        <ItalyMap
          height={460}
          theme={{ fill: '#e2e8f0', hoverFill: '#f59e0b' }}
          data={data}
          colorScale={{ colors: POP_COLORS, domain: POP_DOMAIN, steps: stepped ? 5 : undefined }}
          formatValue={v => `${v.toLocaleString('it-IT')} abitanti`}
          showCorsica={false}
          onRegionHover={r => setHovered(r?.name ?? null)}
        />
      </div>
    </div>
  );
};

// ─── Example 2: Content Filter ────────────────────────────────────
interface Startup { name: string; region: string; sector: string; year: number }

const STARTUPS: Startup[] = [
  { name: 'Satispay', region: 'Lombardia', sector: 'Fintech', year: 2013 },
  { name: 'Scalapay', region: 'Lombardia', sector: 'Fintech', year: 2019 },
  { name: 'Casavo', region: 'Lombardia', sector: 'PropTech', year: 2017 },
  { name: 'Bending Spoons', region: 'Lombardia', sector: 'Apps', year: 2013 },
  { name: 'Prima Assicurazioni', region: 'Lombardia', sector: 'InsurTech', year: 2015 },
  { name: 'D-Orbit', region: 'Lombardia', sector: 'SpaceTech', year: 2011 },
  { name: 'Cortilia', region: 'Lombardia', sector: 'FoodTech', year: 2012 },
  { name: 'Moneyfarm', region: 'Lombardia', sector: 'Fintech', year: 2011 },
  { name: 'Musixmatch', region: 'Emilia-Romagna', sector: 'MusicTech', year: 2010 },
  { name: 'Subito.it', region: 'Lazio', sector: 'Marketplace', year: 2007 },
  { name: 'Facile.it', region: 'Lazio', sector: 'Fintech', year: 2008 },
  { name: 'Flowe', region: 'Lazio', sector: 'Fintech', year: 2020 },
  { name: 'Doctolib', region: 'Lazio', sector: 'HealthTech', year: 2013 },
  { name: 'Soldo', region: 'Lazio', sector: 'Fintech', year: 2015 },
  { name: 'Exein', region: 'Lazio', sector: 'CyberSec', year: 2018 },
  { name: 'Iubenda', region: 'Toscana', sector: 'LegalTech', year: 2011 },
  { name: 'Bugseng', region: 'Toscana', sector: 'CyberSec', year: 2018 },
  { name: 'Credimi', region: 'Lombardia', sector: 'Fintech', year: 2016 },
  { name: 'Tannico', region: 'Lombardia', sector: 'E-commerce', year: 2010 },
  { name: 'Talent Garden', region: 'Lombardia', sector: 'CoWorking', year: 2011 },
];

const countByRegion = STARTUPS.reduce<Record<string, number>>((acc, s) => {
  acc[s.region] = (acc[s.region] ?? 0) + 1;
  return acc;
}, {});

const SECTOR_COLORS: Record<string, string> = {
  'Fintech': '#dbeafe', 'PropTech': '#dcfce7', 'Apps': '#f3e8ff',
  'InsurTech': '#ffedd5', 'SpaceTech': '#e0f2fe', 'FoodTech': '#fef9c3',
  'MusicTech': '#fce7f3', 'Marketplace': '#f1f5f9', 'HealthTech': '#dcfce7',
  'CyberSec': '#fee2e2', 'LegalTech': '#ede9fe', 'E-commerce': '#ffedd5',
  'CoWorking': '#f0fdf4',
};

const FilterExample = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const region = REGIONS.find(r => r.code === selected)?.name ?? null;
  const visible = region ? STARTUPS.filter(s => s.region === region) : STARTUPS;
  const data = Object.entries(countByRegion).map(([id, value]) => ({ id, value }));

  return (
    <div className="ex-layout">
      <div className="ex-sidebar">
        <p className="ex-desc">
          Usa la mappa come filtro geografico: <code>selected</code> + <code>onSelectionChange</code>.
          Le regioni senza startup sono <code>disabled</code>.
        </p>
        {region ? (
          <div className="ex-filter-badge">
            <span>{region}</span>
            <button onClick={() => setSelected(null)} aria-label="Rimuovi filtro">✕</button>
          </div>
        ) : (
          <div className="ex-filter-hint">Tutte le regioni · {STARTUPS.length} risultati</div>
        )}
        <div className="ex-cards">
          {visible.map(s => (
            <div key={s.name} className="ex-card">
              <div className="ex-card-name">{s.name}</div>
              <div className="ex-card-meta">
                <span className="ex-tag" style={{ background: SECTOR_COLORS[s.sector] ?? '#f1f5f9' }}>{s.sector}</span>
                <span className="ex-card-year">{s.year}</span>
              </div>
              {!region && <div className="ex-card-region">{s.region}</div>}
            </div>
          ))}
        </div>
      </div>
      <div className="ex-map">
        <ItalyMap
          height={460}
          theme={{ fill: '#f1f5f9', selectedFill: '#a16207', hoverFill: '#ca8a04', disabledFill: '#f8fafc' }}
          data={[
            ...data,
            ...REGIONS.filter(r => !countByRegion[r.name]).map(r => ({ id: r.code, disabled: true })),
          ]}
          colorScale={{ colors: ['#fef9c3', '#a16207'] }}
          selected={selected}
          onSelectionChange={codes => setSelected(codes[0] ?? null)}
          showCorsica={false}
          renderTooltip={r => (
            <div className="ex-tooltip">
              <strong>{r.name}</strong><br />
              {r.data?.value ? `${r.data.value} startup` : <span style={{ color: '#94a3b8' }}>nessuna startup</span>}
            </div>
          )}
        />
      </div>
    </div>
  );
};

// ─── Example 3: Multi-Select / Zone di spedizione ─────────────────
const SHIPPING: Record<string, { days: number; price: number }> = {
  'Lombardia': { days: 1, price: 4.90 }, 'Piemonte': { days: 1, price: 4.90 },
  'Veneto': { days: 1, price: 4.90 }, 'Emilia-Romagna': { days: 1, price: 4.90 },
  "Valle d'Aosta": { days: 2, price: 5.90 }, 'Liguria': { days: 2, price: 5.90 },
  'Trentino-Alto Adige': { days: 2, price: 5.90 }, 'Friuli-Venezia Giulia': { days: 2, price: 5.90 },
  'Toscana': { days: 2, price: 5.90 }, 'Marche': { days: 2, price: 5.90 },
  'Umbria': { days: 2, price: 5.90 }, 'Lazio': { days: 2, price: 5.90 },
  'Abruzzo': { days: 3, price: 6.90 }, 'Molise': { days: 3, price: 6.90 },
  'Campania': { days: 3, price: 6.90 }, 'Puglia': { days: 3, price: 6.90 },
  'Basilicata': { days: 3, price: 6.90 }, 'Calabria': { days: 4, price: 7.90 },
  'Sicilia': { days: 4, price: 8.90 }, 'Sardegna': { days: 4, price: 8.90 },
};

const TIER_BG: Record<number, string> = { 1: '#bbf7d0', 2: '#fef08a', 3: '#fed7aa', 4: '#fecaca' };
const TIER_SELECTED = '#6366f1';

const MultiSelectExample = () => {
  const [selected, setSelected] = useState<string[]>([]);
  const names = selected.map(code => REGIONS.find(r => r.code === code)!.name).sort();
  const coverage = Math.round((selected.length / REGIONS.length) * 100);
  const data = REGIONS.map(r => ({ id: r.code, color: TIER_BG[SHIPPING[r.name]?.days ?? 0] ?? '#f1f5f9' }));

  return (
    <div className="ex-layout">
      <div className="ex-sidebar">
        <p className="ex-desc">
          <code>selectionMode="multiple"</code>: clicca (o usa Tab + Invio) per aggiungere
          regioni alle zone di spedizione.
        </p>
        <div className="ex-tier-legend">
          {[1, 2, 3, 4].map(d => (
            <div key={d} className="ex-tier-item">
              <span style={{ background: TIER_BG[d] }} />
              {d} {d === 1 ? 'giorno' : 'giorni'} — €{d === 1 ? '4,90' : d === 2 ? '5,90' : d === 3 ? '6,90' : '7,90+'}
            </div>
          ))}
        </div>
        {selected.length > 0 ? (
          <>
            <div className="ex-coverage">
              <div className="ex-coverage-bar">
                <div className="ex-coverage-fill" style={{ width: `${coverage}%` }} />
              </div>
              <span className="ex-coverage-label">{selected.length}/{REGIONS.length} regioni · {coverage}% Italia</span>
            </div>
            <div className="ex-selected-tags">
              {names.map(name => (
                <div key={name} className="ex-selected-tag" onClick={() => setSelected(s => s.filter(c => REGIONS.find(r => r.code === c)!.name !== name))}>
                  {name}
                  {SHIPPING[name] && <span className="ex-tag-days">{SHIPPING[name]!.days}g</span>}
                </div>
              ))}
            </div>
            <button className="ex-reset-btn" onClick={() => setSelected([])}>Azzera selezione</button>
          </>
        ) : (
          <div className="ex-empty">Clicca le regioni sulla mappa per aggiungerle alle zone di spedizione.</div>
        )}
      </div>
      <div className="ex-map">
        <ItalyMap
          height={460}
          theme={{ fill: '#f1f5f9', hoverFill: '#a5b4fc', selectedFill: TIER_SELECTED }}
          data={data}
          selectionMode="multiple"
          selected={selected}
          onSelectionChange={setSelected}
          showCorsica={false}
          showSanMarino={false}
          showVatican={false}
          renderTooltip={r => {
            const tier = SHIPPING[r.name];
            return (
              <div className="ex-tooltip">
                <strong>{r.name}</strong>
                {tier && <><br />{tier.days} {tier.days === 1 ? 'giorno' : 'giorni'} · €{tier.price.toFixed(2)}</>}
                <br />
                <span style={{ color: r.selected ? TIER_SELECTED : '#94a3b8', fontSize: 11 }}>
                  {r.selected ? '✓ selezionata' : 'clicca per aggiungere'}
                </span>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
};

// ─── Example 4: Province Drilldown ───────────────────────────────
// Population per province (fonte: ISTAT, valori approssimati; Sardegna con le province del 2025)
const PROVINCE_POP: Record<string, number> = {
  // Lombardia
  'Milano': 3250315, 'Brescia': 1259378, 'Bergamo': 1111950,
  'Monza e Brianza': 874621, 'Varese': 876889, 'Como': 597413,
  'Pavia': 534490, 'Mantova': 409279, 'Lecco': 336428,
  'Cremona': 355430, 'Sondrio': 181913, 'Lodi': 233645,
  // Lazio
  'Roma': 4343000, 'Latina': 571000, 'Frosinone': 480000,
  'Viterbo': 318000, 'Rieti': 154000,
  // Campania
  'Napoli': 3115320, 'Salerno': 1090000, 'Caserta': 933000,
  'Avellino': 416000, 'Benevento': 278000,
  // Sicilia
  'Palermo': 1252588, 'Catania': 1107702, 'Messina': 626876,
  'Agrigento': 432958, 'Trapani': 430179, 'Siracusa': 398854,
  'Ragusa': 320024, 'Caltanissetta': 260552, 'Enna': 163877,
  // Veneto
  'Padova': 940000, 'Verona': 924000, 'Treviso': 886000,
  'Vicenza': 860000, 'Venezia': 840000, 'Rovigo': 240000, 'Belluno': 199000,
  // Piemonte
  'Torino': 2247780, 'Cuneo': 590000, 'Alessandria': 420000,
  'Novara': 369000, 'Asti': 216000, 'Vercelli': 174000,
  'Biella': 174000, 'Verbano-Cusio-Ossola': 159000,
  // Emilia-Romagna
  'Bologna': 1014000, 'Modena': 703000, 'Reggio Emilia': 530000,
  'Parma': 445000, 'Ferrara': 349000, 'Forlì-Cesena': 394000,
  'Rimini': 335000, 'Ravenna': 389000, 'Piacenza': 286000,
  // Puglia
  'Bari': 1248000, 'Lecce': 797000, 'Foggia': 617000,
  'Taranto': 576000, 'Barletta-Andria-Trani': 392000, 'Brindisi': 389000,
  // Toscana
  'Firenze': 1014000, 'Pisa': 418000, 'Arezzo': 344000,
  'Lucca': 388000, 'Livorno': 332000, 'Pistoia': 293000,
  'Siena': 271000, 'Prato': 253000, 'Grosseto': 225000, 'Massa-Carrara': 198000,
  // Calabria
  'Cosenza': 700000, 'Reggio Calabria': 548000, 'Catanzaro': 360000,
  'Crotone': 170000, 'Vibo Valentia': 160000,
  // Sardegna
  'Cagliari': 480000, 'Sassari': 330000, 'Gallura Nord-Est Sardegna': 160000,
  'Oristano': 150000, 'Nuoro': 150000, 'Sulcis Iglesiente': 120000,
  'Medio Campidano': 90000, 'Ogliastra': 55000,
  // Liguria
  'Genova': 850000, 'Savona': 280000, 'La Spezia': 222000, 'Imperia': 218000,
  // Marche
  'Pesaro e Urbino': 363000, 'Ancona': 477000, 'Macerata': 317000,
  'Fermo': 175000, 'Ascoli Piceno': 205000,
  // Abruzzo
  "L'Aquila": 296000, 'Chieti': 387000, 'Pescara': 320000, 'Teramo': 311000,
  // Friuli-Venezia Giulia
  'Udine': 533000, 'Trieste': 232000, 'Pordenone': 316000, 'Gorizia': 142000,
  // Trentino-Alto Adige
  'Bolzano': 533000, 'Trento': 541000,
  // Umbria
  'Perugia': 667000, 'Terni': 232000,
  // Basilicata
  'Potenza': 362000, 'Matera': 200000,
  // Molise
  'Campobasso': 221000, 'Isernia': 81000,
  // Valle d'Aosta
  'Aosta': 125000,
};

const POP_BY_CODE: Record<string, number> = Object.fromEntries(
  Object.entries(PROVINCE_POP).map(([name, pop]) => [findProvince(name)?.code ?? name, pop]),
);
const REGION_POP = Object.fromEntries(
  Object.entries(PROVINCES_BY_REGION).map(([region, provinces]) => [
    region,
    provinces.reduce((sum, p) => sum + (POP_BY_CODE[p.code] ?? 0), 0),
  ]),
);
const PROVINCE_DATA = PROVINCES.map(p => ({ id: p.code, value: POP_BY_CODE[p.code] ?? 0 }));

const DrilldownExample = () => {
  const [region, setRegion] = useState<string | null>(null);
  const provinces = region
    ? (PROVINCES_BY_REGION[region] ?? []).map(p => ({ ...p, pop: POP_BY_CODE[p.code] ?? 0 })).sort((a, b) => b.pop - a.pop)
    : [];
  const provMax = Math.max(...provinces.map(p => p.pop), 1);
  const sortedRegions = Object.entries(REGION_POP).sort((a, b) => b[1] - a[1]);
  const regionMax = sortedRegions[0]?.[1] ?? 1;

  return (
    <div className="ex-layout">
      <div className="ex-sidebar">
        {region ? (
          <>
            <button className="ex-back-btn" onClick={() => setRegion(null)}>← Tutte le regioni</button>
            <div className="ex-drill-header">
              <span className="ex-drill-title">{region}</span>
              <span className="ex-drill-sub">{provinces.length} province</span>
            </div>
            <div className="ex-drill-list">
              {provinces.map(p => (
                <div key={p.code} className="ex-drill-row">
                  <div className="ex-drill-row-top">
                    <span className="ex-drill-province">{p.name}</span>
                    <span className="ex-drill-code">{p.code}</span>
                    <span className="ex-drill-pop">{p.pop > 0 ? (p.pop / 1_000).toFixed(0) + 'k' : '—'}</span>
                  </div>
                  <div className="ex-drill-bar-track">
                    <div className="ex-drill-bar-fill" style={{ width: `${(p.pop / provMax) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="ex-desc">
              Clicca una regione: la mappa passa a <code>&lt;ItalyProvincesMap region="…"&gt;</code>,
              che mostra solo le sue province e adatta la vista.
            </p>
            <div className="ex-drill-hint">
              <code style={{ fontSize: 11, background: '#f1f5f9', padding: '4px 8px', borderRadius: 4 }}>
                import {'{ ItalyProvincesMap }'} from 'react-italy-map/provinces'
              </code>
            </div>
            <div className="ex-drill-list">
              {sortedRegions.map(([name, pop], i) => (
                <div key={name} className="ex-drill-row ex-drill-row--clickable" onClick={() => setRegion(name)}>
                  <div className="ex-drill-row-top">
                    <span className="ex-drill-rank">{i + 1}</span>
                    <span className="ex-drill-province">{name}</span>
                    <span className="ex-drill-pop">{(pop / 1_000_000).toFixed(2)}M</span>
                  </div>
                  <div className="ex-drill-bar-track">
                    <div className="ex-drill-bar-fill" style={{ width: `${(pop / regionMax) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="ex-map">
        {region ? (
          <ItalyProvincesMap
            key={region}
            region={region}
            height={480}
            showLabels
            theme={{ fill: '#e0f2fe', hoverFill: '#0ea5e9' }}
            data={PROVINCE_DATA}
            colorScale={{ colors: ['#e0f2fe', '#0369a1'] }}
            formatValue={v => `${v.toLocaleString('it-IT')} ab.`}
          />
        ) : (
          <ItalyMap
            height={480}
            theme={{ fill: '#e0f2fe', hoverFill: '#0ea5e9' }}
            data={Object.entries(REGION_POP).map(([id, value]) => ({ id, value }))}
            colorScale={{ colors: ['#e0f2fe', '#0369a1'] }}
            formatValue={v => `${v.toLocaleString('it-IT')} ab. · clicca per il dettaglio`}
            showCorsica={false}
            onRegionClick={r => r.kind === 'region' && setRegion(r.name)}
          />
        )}
      </div>
    </div>
  );
};

// ─── Example 5: Provinces + imperative API ────────────────────────
const ProvincesExample = () => {
  const ref = useRef<ItalyMapHandle>(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const matches = query.length > 1
    ? PROVINCES.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.code === query.toUpperCase()).slice(0, 6)
    : [];

  return (
    <div className="ex-layout">
      <div className="ex-sidebar">
        <p className="ex-desc">
          Tutte le 110 province ISTAT, con zoom (rotella, pinch, doppio click, tasti + / − / 0)
          e API imperativa via <code>ref</code>: <code>zoomTo</code>, <code>resetZoom</code>, <code>toSVGString</code>.
        </p>
        <input
          className="ex-search"
          placeholder="Cerca una provincia… (es. Bari, MI)"
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-label="Cerca una provincia"
        />
        <div className="ex-drill-list">
          {matches.map(p => (
            <div key={p.code} className="ex-drill-row ex-drill-row--clickable" onClick={() => { setSelected([p.code]); ref.current?.zoomTo(p.code, { padding: 1.2 }); }}>
              <div className="ex-drill-row-top">
                <span className="ex-drill-province">{p.name}</span>
                <span className="ex-drill-code">{p.code}</span>
                <span className="ex-drill-pop">{p.region}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          <button className="ex-reset-btn" onClick={() => { setSelected([]); ref.current?.resetZoom(); }}>Reset</button>
          <button className="ex-reset-btn" onClick={() => download(ref.current?.toSVGString() ?? '', 'province-italia.svg')}>Scarica SVG</button>
        </div>
      </div>
      <div className="ex-map">
        <ItalyProvincesMap
          ref={ref}
          height={480}
          zoomable
          showLabels
          selected={selected}
          onSelectionChange={setSelected}
          theme={{ fill: '#e2e8f0', selectedFill: '#e11d48', hoverFill: '#fda4af' }}
          renderTooltip={p => (
            <div className="ex-tooltip">
              <strong>{p.name} ({p.code})</strong><br />
              <span style={{ color: '#94a3b8', fontSize: 11 }}>{PROVINCES.find(x => x.code === p.code)?.region}</span>
            </div>
          )}
        />
      </div>
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
  { prop: 'className / style', type: 'string / CSSProperties', default: '—', desc: 'Applicati al contenitore. Le chiavi v1 di style (baseColor, …) sono ancora supportate.' },
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
      <p className="section-subtitle">Props comuni a <code>ItalyMap</code> e <code>ItalyProvincesMap</code>, tema, dati e utilities.</p>

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

// ─── Example code snippets ────────────────────────────────────────
const EXAMPLE_CODES: Record<ExampleId, string> = {
  choropleth: `import { ItalyMap, Legend } from 'react-italy-map';

const data = [
  { id: 'Lombardia', value: 10060574 },
  { id: 'Lazio',     value: 5879082 },
  // …
];

<Legend colors={['#dbeafe', '#3b82f6', '#1e3a8a']} domain={[0, 10_500_000]} title="Popolazione" />
<ItalyMap
  height={460}
  data={data}
  colorScale={{ colors: ['#dbeafe', '#3b82f6', '#1e3a8a'], domain: [0, 10_500_000], steps: 5 }}
  formatValue={(v) => \`\${v.toLocaleString('it-IT')} abitanti\`}
  onRegionHover={(region) => setHovered(region?.name ?? null)}
/>`,

  filter: `import { useState } from 'react';
import { ItalyMap, findRegion } from 'react-italy-map';

export default function FilterMap() {
  const [selected, setSelected] = useState<string | null>(null);
  const region = selected ? findRegion(selected)?.name : null;
  const visible = region ? STARTUPS.filter(s => s.region === region) : STARTUPS;

  return (
    <ItalyMap
      data={countsByRegion.map(([id, value]) => ({ id, value }))}
      colorScale={{ colors: ['#fef9c3', '#a16207'] }}
      theme={{ selectedFill: '#a16207' }}
      selected={selected}
      onSelectionChange={(codes) => setSelected(codes[0] ?? null)}
      renderTooltip={(r) => \`\${r.name}: \${r.data?.value ?? 0} startup\`}
    />
  );
}`,

  multiselect: `import { useState } from 'react';
import { ItalyMap } from 'react-italy-map';

export default function ShippingZones() {
  const [zones, setZones] = useState<string[]>([]);
  return (
    <ItalyMap
      selectionMode="multiple"
      selected={zones}
      onSelectionChange={setZones}       // ['IT-25', 'IT-62', …]
      theme={{ selectedFill: '#6366f1', hoverFill: '#a5b4fc' }}
      data={REGIONS.map(r => ({ id: r.code, color: TIER_COLOR[days[r.name]] }))}
    />
  );
}`,

  drilldown: `import { useState } from 'react';
import { ItalyMap } from 'react-italy-map';
import { ItalyProvincesMap } from 'react-italy-map/provinces';

export default function Drilldown() {
  const [region, setRegion] = useState<string | null>(null);

  return region ? (
    <ItalyProvincesMap
      region={region}                    // solo le province della regione
      showLabels
      data={provinceData}                // [{ id: 'MI', value: 3250315 }, …]
      colorScale={{ colors: ['#e0f2fe', '#0369a1'] }}
    />
  ) : (
    <ItalyMap
      data={regionData}
      colorScale={{ colors: ['#e0f2fe', '#0369a1'] }}
      onRegionClick={(r) => setRegion(r.name)}
    />
  );
}`,

  provinces: `import { useRef, useState } from 'react';
import { ItalyProvincesMap } from 'react-italy-map/provinces';
import type { ItalyMapHandle } from 'react-italy-map';

export default function Provinces() {
  const ref = useRef<ItalyMapHandle>(null);
  const [selected, setSelected] = useState<string[]>([]);

  return (
    <>
      <button onClick={() => ref.current?.zoomTo('BA')}>Vai a Bari</button>
      <button onClick={() => download(ref.current?.toSVGString())}>Scarica SVG</button>
      <ItalyProvincesMap
        ref={ref}
        zoomable
        showLabels
        selected={selected}
        onSelectionChange={setSelected}
      />
    </>
  );
}`,
};

// ─── App ──────────────────────────────────────────────────────────
type ExampleId = 'choropleth' | 'filter' | 'multiselect' | 'drilldown' | 'provinces';

const EXAMPLES: { id: ExampleId; label: string; component: ReactNode }[] = [
  { id: 'choropleth', label: 'Data Visualization', component: <ChoroplethExample /> },
  { id: 'filter', label: 'Content Filter', component: <FilterExample /> },
  { id: 'multiselect', label: 'Multi-Select', component: <MultiSelectExample /> },
  { id: 'drilldown', label: 'Province Drilldown', component: <DrilldownExample /> },
  { id: 'provinces', label: 'Province + Zoom', component: <ProvincesExample /> },
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
  const [level, setLevel] = useState<'regions' | 'provinces'>('regions');
  const [fill, setFill] = useState('#247f44');
  const [stroke, setStroke] = useState('#ffffff');
  const [selectedFill, setSelectedFill] = useState('#3b82f6');
  const [height, setHeight] = useState(600);
  const [multiple, setMultiple] = useState(false);
  const [showCorsica, setShowCorsica] = useState(true);
  const [showLabels, setShowLabels] = useState(false);
  const [zoomable, setZoomable] = useState(true);
  const [zoomOnSelect, setZoomOnSelect] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [showCode, setShowCode] = useState(false);
  const [activeExample, setActiveExample] = useState<ExampleId>('choropleth');
  const [showExCode, setShowExCode] = useState(false);
  const mapRef = useRef<ItalyMapHandle>(null);

  const theme = useMemo(() => ({ fill, stroke, selectedFill }), [fill, stroke, selectedFill]);
  const Component = level === 'regions' ? 'ItalyMap' : 'ItalyProvincesMap';
  const codeString = `import { useState } from 'react';
import { ${level === 'regions' ? 'ItalyMap' : 'ItalyProvincesMap'} } from 'react-italy-map${level === 'provinces' ? '/provinces' : ''}';

export default function App() {
  const [selected, setSelected] = useState<string[]>(${JSON.stringify(selected)});

  return (
    <${Component}
      height={${height}}
      theme={{ fill: '${fill}', stroke: '${stroke}', selectedFill: '${selectedFill}' }}
      selectionMode="${multiple ? 'multiple' : 'single'}"
      selected={selected}
      onSelectionChange={setSelected}${level === 'regions' ? `
      data={[{ id: 'lombardia', color: '#10b981', child: <span>🌲</span> }, …]}
      showCorsica={${showCorsica}}` : ''}
      showLabels={${showLabels}}
      zoomable={${zoomable}}
      zoomOnSelect={${zoomOnSelect}}
      renderTooltip={(area) => <div className="custom-tooltip">{area.name} ({area.code})</div>}
    />
  );
}`;

  const commonProps = {
    ref: mapRef,
    height,
    theme,
    selectionMode: multiple ? 'multiple' as const : 'single' as const,
    selected,
    onSelectionChange: setSelected,
    showCorsica,
    showLabels,
    zoomable,
    zoomOnSelect,
    renderTooltip: (a: { name: string; code: string }) => <div className="custom-tooltip">{a.name} ({a.code})</div>,
  };

  const activeComp = EXAMPLES.find(e => e.id === activeExample)?.component;

  return (
    <div className="app">
      <nav className="navbar">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0 20px' }}>
          <a href="#" className="logo">React Italy Map</a>
          <div className="nav-links">
            <a href="#home" className="nav-link">Home</a>
            <a href="#features" className="nav-link">Features</a>
            <a href="#api" className="nav-link">API</a>
            <a href="#examples" className="nav-link">Examples</a>
          </div>
        </div>
      </nav>

      <main className="container">
        <section id="home" className="hero">
          <div className="configurator">
            <div className="config-header">
              <h2 className="config-title">Configurator</h2>
              <div className="switch-container" style={{ gap: '10px' }}>
                <span className="label" style={{ marginBottom: 0, color: showCode ? 'white' : '#94a3b8' }}>Code</span>
                <label className="switch">
                  <input type="checkbox" checked={showCode} onChange={e => setShowCode(e.target.checked)} aria-label="Mostra codice" />
                  <span className="slider" />
                </label>
              </div>
            </div>

            {!showCode ? (
              <>
                <div className="control-group">
                  <label className="label">Livello</label>
                  <div className="ex-tabs" style={{ marginBottom: 0 }}>
                    {(['regions', 'provinces'] as const).map(l => (
                      <button key={l} className={`ex-tab${level === l ? ' ex-tab--active' : ''}`} onClick={() => { setLevel(l); setSelected([]); }}>
                        {l === 'regions' ? 'Regioni' : 'Province'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="control-group">
                  <label className="label">Fill</label>
                  <input type="color" className="input-color" value={fill} onChange={e => setFill(e.target.value)} />
                </div>
                <div className="control-group">
                  <label className="label">Stroke</label>
                  <input type="color" className="input-color" value={stroke} onChange={e => setStroke(e.target.value)} />
                </div>
                <div className="control-group">
                  <label className="label">Selected Fill</label>
                  <input type="color" className="input-color" value={selectedFill} onChange={e => setSelectedFill(e.target.value)} />
                </div>
                <div className="control-group">
                  <label className="label">Height: {height}px</label>
                  <input type="range" min="300" max="800" className="input-range" value={height} onChange={e => setHeight(Number(e.target.value))} />
                </div>
                <Switch label="Selezione multipla" checked={multiple} onChange={v => { setMultiple(v); setSelected([]); }} />
                <Switch label="Show Labels" checked={showLabels} onChange={setShowLabels} />
                <Switch label="Zoomable" checked={zoomable} onChange={setZoomable} />
                <Switch label="Zoom on select" checked={zoomOnSelect} onChange={setZoomOnSelect} />
                <Switch label="Show Corsica" checked={showCorsica} onChange={setShowCorsica} />
                <div className="control-group" style={{ display: 'flex', gap: 8 }}>
                  <button className="ex-reset-btn" onClick={() => mapRef.current?.zoomTo(['Calabria', 'Sicilia'])}>zoomTo Sud</button>
                  <button className="ex-reset-btn" onClick={() => download(mapRef.current?.toSVGString() ?? '', 'mappa-italia.svg')}>Export SVG</button>
                </div>
              </>
            ) : (
              <CodeBlock code={codeString} />
            )}
          </div>

          <div className="map-preview">
            {level === 'regions'
              ? <ItalyMap {...commonProps} data={HERO_DATA} />
              : <ItalyProvincesMap {...commonProps} />}
          </div>
        </section>

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
            {showExCode ? <CodeBlock code={EXAMPLE_CODES[activeExample]} /> : activeComp}
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
