import { REGIONS } from '../data/regions.meta';
import { REGION_SHAPES } from '../data/regions.geo';
import type { AreaDef } from './areas';
import { regionKeys } from './keys';

export const REGION_AREAS: AreaDef[] = REGIONS.map((r) => ({
    code: r.code,
    name: r.name,
    kind: 'region',
    istat: r.istat,
    shape: REGION_SHAPES[r.code]!,
    keys: regionKeys(r),
}));
