// Drill-down: click a region to switch to the map of its provinces.
import { useState } from 'react';
import { ItalyMap, PROVINCES, PROVINCES_BY_REGION, findProvince } from 'react-italy-map';
import { ItalyProvincesMap } from 'react-italy-map/provinces';
import { PROVINCE_POP } from './data/population';

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

export default function Drilldown() {
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
}
