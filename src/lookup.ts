import type { MacroArea, ProvinceInfo, RegionInfo } from './types';
import { REGIONS } from './data/regions.meta';
import { PROVINCES } from './data/provinces.meta';
import { buildIndex, normalizeId, type AreaIndex } from './core/areas';
import { provinceKeys, regionKeys } from './core/keys';

let regionIndex: AreaIndex | undefined;
let provinceIndex: AreaIndex | undefined;

/**
 * Finds a region by ISO code, ISTAT code, Italian/English name or slug.
 * `findRegion('lombardy')`, `findRegion('03')`, `findRegion('IT-25')`.
 */
export const findRegion = (id: string | number): RegionInfo | undefined => {
    regionIndex ??= buildIndex(REGIONS.map((r) => ({ code: r.code, keys: regionKeys(r) })));
    const code = regionIndex.get(normalizeId(id));
    return code ? REGIONS.find((r) => r.code === code) : undefined;
};

/** Finds a province by sigla, ISTAT code or name: `findProvince('MI')`, `findProvince('015')`. */
export const findProvince = (id: string | number): ProvinceInfo | undefined => {
    provinceIndex ??= buildIndex(PROVINCES.map((p) => ({ code: p.code, keys: provinceKeys(p) })));
    const code = provinceIndex.get(normalizeId(id));
    return code ? PROVINCES.find((p) => p.code === code) : undefined;
};

/** Provinces of a region (any region id). */
export const getProvincesOfRegion = (regionId: string | number): ProvinceInfo[] => {
    const region = findRegion(regionId);
    return region ? PROVINCES.filter((p) => p.regionCode === region.code) : [];
};

/** Regions of an ISTAT macro-area. */
export const getRegionsOfArea = (area: MacroArea): RegionInfo[] => REGIONS.filter((r) => r.area === area);

/** Provinces grouped by region name. */
export const PROVINCES_BY_REGION: Readonly<Record<string, ProvinceInfo[]>> = /*#__PURE__*/ Object.fromEntries(
    REGIONS.map((r) => [r.name, PROVINCES.filter((p) => p.regionCode === r.code)]),
);
