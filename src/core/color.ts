import type { ColorScaleOptions } from '../types';

const parseHex = (hex: string): [number, number, number] => {
    let h = hex.trim().replace(/^#/, '');
    if (h.length === 3 || h.length === 4) h = h.slice(0, 3).replace(/./g, (c) => c + c);
    const n = parseInt(h.slice(0, 6), 16);
    if (Number.isNaN(n)) throw new Error(`react-italy-map: "${hex}" is not a hex colour`);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const toHex = (rgb: number[]) =>
    '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

/** Mixes two hex colours: `t = 0` gives `from`, `t = 1` gives `to`. */
export const interpolateColor = (from: string, to: string, t: number): string => {
    const a = parseHex(from);
    const b = parseHex(to);
    const k = Math.min(1, Math.max(0, t));
    return toHex(a.map((v, i) => v + (b[i]! - v) * k));
};

/**
 * Returns a function mapping a number to a colour.
 *
 * ```ts
 * const color = createColorScale({ colors: ['#dbeafe', '#1e3a8a'], domain: [0, 100] });
 * color(50); // '#7d93c3'
 * ```
 */
export const createColorScale = ({
    colors,
    domain = [0, 1],
    steps,
}: ColorScaleOptions): ((value: number) => string) => {
    if (colors.length === 0) throw new Error('react-italy-map: colorScale needs at least one colour');
    if (colors.length === 1) return () => colors[0]!;
    const [min, max] = domain;
    const span = max - min || 1;
    const last = colors.length - 1;

    const at = (t: number) => {
        const pos = Math.min(1, Math.max(0, t)) * last;
        const i = Math.min(last - 1, Math.floor(pos));
        return interpolateColor(colors[i]!, colors[i + 1]!, pos - i);
    };

    if (steps && steps > 1) {
        const palette = Array.from({ length: steps }, (_, i) => at(i / (steps - 1)));
        return (value) => {
            const t = Math.min(1, Math.max(0, (value - min) / span));
            return palette[Math.min(steps - 1, Math.floor(t * steps))]!;
        };
    }
    return (value) => at((value - min) / span);
};
