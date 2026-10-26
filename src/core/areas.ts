import type { AreaKind, AreaShape } from '../types';
import { FOREIGN_SHAPES } from '../data/foreign.geo';

/** Lowercase, accent-free, dash-separated key: "Valle d’Aosta" → "valle-daosta". */
export const normalizeId = (id: string | number): string =>
    String(id)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/['’`,.]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

/** An area the map engine can draw. */
export interface AreaDef {
    code: string;
    name: string;
    kind: AreaKind;
    istat?: string;
    regionCode?: string;
    shape: AreaShape;
    /** Every identifier the area answers to. */
    keys: readonly (string | undefined)[];
}

export type AreaIndex = Map<string, string>;

export const buildIndex = (defs: readonly { code: string; keys: readonly (string | undefined)[] }[]): AreaIndex => {
    const index: AreaIndex = new Map();
    for (const def of defs) {
        for (const key of [def.code, ...def.keys]) {
            if (key == null) continue;
            const k = normalizeId(key);
            if (!index.has(k)) index.set(k, def.code);
        }
    }
    return index;
};

const foreign = (code: string, name: string, keys: string[]): AreaDef => ({
    code,
    name,
    kind: 'foreign',
    shape: FOREIGN_SHAPES[code]!,
    keys,
});

export const SAN_MARINO = foreign('SM', 'San Marino', ['San Marino', 'Repubblica di San Marino']);
export const VATICAN = foreign('VA', 'Città del Vaticano', [
    'Vatican City', 'Vatican', 'Vaticano', 'Stato della Città del Vaticano', 'Holy See',
]);
export const CORSICA = foreign('FR-H', 'Corsica', ['Corsica', 'Corsica, France', 'Corse', 'FR-COR', '20R']);
