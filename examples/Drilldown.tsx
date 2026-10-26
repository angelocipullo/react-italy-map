// Drill-down: click a region and it opens into its provinces (Esc or "← Italia" to go back).
import { useState } from 'react';
import { PROVINCES_BY_REGION, findProvince, type MapArea } from 'react-italy-map';
import { ItalyDrilldownMap } from 'react-italy-map/provinces';
import { PROVINCE_POP } from './data/population';

const POP_BY_CODE: Record<string, number> = Object.fromEntries(
  Object.entries(PROVINCE_POP).map(([name, pop]) => [findProvince(name)?.code ?? name, pop]),
);
const REGION_DATA = Object.entries(PROVINCES_BY_REGION).map(([region, provinces]) => ({
  id: region,
  value: provinces.reduce((sum, p) => sum + (POP_BY_CODE[p.code] ?? 0), 0),
}));
const PROVINCE_DATA = Object.entries(POP_BY_CODE).map(([id, value]) => ({ id, value }));
const COLORS = ['#e0f2fe', '#0369a1'];

export default function Drilldown() {
  const [region, setRegion] = useState<MapArea | null>(null);
  const provinces = region
    ? (PROVINCES_BY_REGION[region.name] ?? []).map(p => ({ ...p, pop: POP_BY_CODE[p.code] ?? 0 })).sort((a, b) => b.pop - a.pop)
    : [];
  const max = Math.max(...provinces.map(p => p.pop), 1);
  const regions = [...REGION_DATA].sort((a, b) => b.value - a.value);

  return (
    <div className="ex-layout">
      <div className="ex-sidebar">
        {region ? (
          <>
            <div className="ex-drill-header">
              <span className="ex-drill-title">{region.name}</span>
              <span className="ex-drill-sub">{provinces.length} province</span>
            </div>
            <div className="ex-drill-list">
              {provinces.map(p => (
                <div key={p.code} className="ex-drill-row">
                  <div className="ex-drill-row-top">
                    <span className="ex-drill-province">{p.name}</span>
                    <span className="ex-drill-code">{p.code}</span>
                    <span className="ex-drill-pop">{(p.pop / 1_000).toFixed(0)}k</span>
                  </div>
                  <div className="ex-drill-bar-track">
                    <div className="ex-drill-bar-fill" style={{ width: `${(p.pop / max) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="ex-desc">
              <code>ItalyDrilldownMap</code>: clicca una regione e la mappa zooma aprendola
              nelle sue province, lasciando il resto d'Italia sullo sfondo.
              Torna indietro con il pulsante o con Esc.
            </p>
            <div className="ex-drill-list">
              {regions.map((r, i) => (
                <div key={r.id} className="ex-drill-row">
                  <div className="ex-drill-row-top">
                    <span className="ex-drill-rank">{i + 1}</span>
                    <span className="ex-drill-province">{r.id}</span>
                    <span className="ex-drill-pop">{(r.value / 1_000_000).toFixed(2)}M</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="ex-map">
        <ItalyDrilldownMap
          height={480}
          showLabels
          theme={{ fill: '#e0f2fe', hoverFill: '#0ea5e9', regionBorder: '#0c4a6e', labelSize: 13 }}
          data={REGION_DATA}
          provinceData={PROVINCE_DATA}
          colorScale={{ colors: COLORS }}
          formatValue={v => `${v.toLocaleString('it-IT')} ab.`}
          showCorsica={false}
          onRegionChange={setRegion}
        />
      </div>
    </div>
  );
}
