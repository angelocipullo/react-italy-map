// All provinces with zoom, search (ref.zoomTo) and SVG export (ref.toSVGString).
import { useRef, useState } from 'react';
import { PROVINCES, type ItalyMapHandle } from 'react-italy-map';
import { ItalyProvincesMap } from 'react-italy-map/provinces';

const download = (svg: string, filename: string) => {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export default function Provinces() {
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
}
