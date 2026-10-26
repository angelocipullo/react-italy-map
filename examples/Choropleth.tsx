// Choropleth: colour regions by a numeric value, with a matching legend.
import { useState } from 'react';
import { ItalyMap, Legend } from 'react-italy-map';
import { POPULATION } from './data/population';

const POP_COLORS = ['#dbeafe', '#3b82f6', '#1e3a8a'];
const POP_DOMAIN: [number, number] = [0, 10_500_000];
const millions = (v: number) => `${(v / 1_000_000).toFixed(1)}M`;

export default function Choropleth() {
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
        <label className="ex-check">
          <input type="checkbox" checked={stepped} onChange={e => setStepped(e.target.checked)} />
          Classi discrete (steps: 5)
        </label>
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
}
