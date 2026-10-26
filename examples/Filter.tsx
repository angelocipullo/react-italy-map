// Content filter: click a region to filter a list. Regions without results are disabled.
import { useState } from 'react';
import { ItalyMap, REGIONS } from 'react-italy-map';
import { STARTUPS, countByRegion } from './data/startups';

const SECTOR_COLORS: Record<string, string> = {
  'Fintech': '#dbeafe', 'PropTech': '#dcfce7', 'Apps': '#f3e8ff',
  'InsurTech': '#ffedd5', 'SpaceTech': '#e0f2fe', 'FoodTech': '#fef9c3',
  'MusicTech': '#fce7f3', 'Marketplace': '#f1f5f9', 'HealthTech': '#dcfce7',
  'CyberSec': '#fee2e2', 'LegalTech': '#ede9fe', 'E-commerce': '#ffedd5',
  'CoWorking': '#f0fdf4',
};

export default function Filter() {
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
}
