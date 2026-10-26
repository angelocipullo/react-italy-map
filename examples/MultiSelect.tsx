// Multi-select: pick several regions (e.g. shipping zones).
import { useState } from 'react';
import { ItalyMap, REGIONS } from 'react-italy-map';
import { SHIPPING } from './data/shipping';

const TIER_BG: Record<number, string> = { 1: '#bbf7d0', 2: '#fef08a', 3: '#fed7aa', 4: '#fecaca' };
const TIER_SELECTED = '#6366f1';

export default function MultiSelect() {
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
}
