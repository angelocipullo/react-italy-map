import { PROVINCES } from '../data/provinces.meta';
import { PROVINCE_SHAPES } from '../data/provinces.geo';
import type { AreaDef } from './areas';
import { provinceKeys } from './keys';

export const PROVINCE_AREAS: AreaDef[] = PROVINCES.map((p) => ({
    code: p.code,
    name: p.name,
    kind: 'province',
    istat: p.istat,
    regionCode: p.regionCode,
    shape: PROVINCE_SHAPES[p.code]!,
    keys: provinceKeys(p),
}));
