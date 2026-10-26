import type { CSSProperties } from 'react';
import { createColorScale } from './core/color';

export interface LegendProps {
    /** Same colours passed to `colorScale`. */
    colors: readonly string[];
    /** `[min, max]` of the scale. */
    domain: readonly [number, number];
    /** Discrete classes, as in `colorScale.steps`. */
    steps?: number;
    title?: string;
    format?: (value: number) => string;
    className?: string;
    style?: CSSProperties;
}

/** Colour legend for a choropleth map, matching `colorScale`. */
export function Legend({ colors, domain, steps, title, format = (v) => v.toLocaleString(), className, style }: LegendProps) {
    const [min, max] = domain;
    let background: string;
    if (steps && steps > 1) {
        const color = createColorScale({ colors, domain, steps });
        const stops = Array.from({ length: steps }, (_, i) => {
            const c = color(min + ((i + 0.5) / steps) * (max - min));
            return `${c} ${(i / steps) * 100}% ${((i + 1) / steps) * 100}%`;
        });
        background = `linear-gradient(to right, ${stops.join(', ')})`;
    } else {
        background = `linear-gradient(to right, ${colors.join(', ')})`;
    }
    return (
        <div
            className={className}
            style={{ font: '12px/1.4 system-ui, sans-serif', minWidth: 120, ...style }}
            role="img"
            aria-label={`${title ? `${title}: ` : ''}${format(min)} – ${format(max)}`}
        >
            {title && <div style={{ fontWeight: 600, marginBottom: 4 }}>{title}</div>}
            <div style={{ height: 10, borderRadius: 3, background }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2, opacity: 0.75 }}>
                <span>{format(min)}</span>
                <span>{format(max)}</span>
            </div>
        </div>
    );
}
