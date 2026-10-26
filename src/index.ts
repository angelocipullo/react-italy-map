export { ItalyMap } from './ItalyMap';
export type { ItalyMapProps } from './ItalyMap';
export { Legend } from './Legend';
export type { LegendProps } from './Legend';

export { REGIONS } from './data/regions.meta';
export { PROVINCES } from './data/provinces.meta';
export { findRegion, findProvince, getProvincesOfRegion, getRegionsOfArea, PROVINCES_BY_REGION } from './lookup';
export { createColorScale, interpolateColor } from './core/color';
export { normalizeId } from './core/areas';

export type {
    AreaData,
    AreaDataInput,
    AreaKind,
    BaseMapProps,
    ColorScaleInput,
    ColorScaleOptions,
    ItalyMapHandle,
    MacroArea,
    MapArea,
    MapTheme,
    ProvinceInfo,
    RegionInfo,
    SelectionMode,
    ZoomToOptions,
} from './types';
