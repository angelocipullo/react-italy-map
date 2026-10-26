import { forwardRef, useMemo, type ReactElement, type Ref, type SyntheticEvent } from 'react';
import type { BaseMapProps, ItalyMapHandle, MapArea } from './types';
import { PROVINCES } from './data/provinces.meta';
import { PROVINCE_SHAPES, REGION_BORDERS } from './data/provinces.geo';
import { buildIndex, CORSICA, normalizeId, SAN_MARINO, VATICAN, type AreaDef } from './core/areas';
import { provinceKeys } from './core/keys';
import { MapView, type AreaEventHandler, type AreaHoverHandler } from './core/MapView';
import { findRegion } from './lookup';

const PROVINCE_AREAS: AreaDef[] = PROVINCES.map((p) => ({
    code: p.code,
    name: p.name,
    kind: 'province',
    istat: p.istat,
    regionCode: p.regionCode,
    shape: PROVINCE_SHAPES[p.code]!,
    keys: provinceKeys(p),
}));
const INDEX = buildIndex(PROVINCE_AREAS);

export interface ItalyProvincesMapProps<TMeta = unknown> extends BaseMapProps<TMeta> {
    /** Only show the provinces of these regions (any region id), fitting the view to them. */
    region?: string | readonly string[] | null;
    /** Thicker borders between regions. @default true when the whole country is shown */
    showRegionBorders?: boolean;
    onProvinceClick?: (province: MapArea<TMeta>, event: SyntheticEvent) => void;
    onProvinceHover?: (province: MapArea<TMeta> | null, event: SyntheticEvent | null) => void;
}

function ItalyProvincesMapInner<TMeta>(
    {
        region,
        showRegionBorders,
        onProvinceClick,
        onProvinceHover,
        include,
        exclude,
        showCorsica = true,
        showSanMarino = true,
        showVatican = true,
        ...rest
    }: ItalyProvincesMapProps<TMeta>,
    ref: Ref<ItalyMapHandle>,
) {
    const regions = region == null ? [] : typeof region === 'string' ? [region] : region;
    const regionKey = regions.join('\u0000');
    const includeKey = include?.join('\u0000');
    const excludeKey = exclude?.join('\u0000');

    const areas = useMemo(() => {
        const regionCodes = new Set(regions.map((r) => findRegion(r)?.code));
        const only = include && new Set(include.map((id) => INDEX.get(normalizeId(id))));
        const hidden = new Set(exclude?.map((id) => INDEX.get(normalizeId(id))));
        return PROVINCE_AREAS.filter((a) =>
            !hidden.has(a.code)
            && (!only || only.has(a.code))
            && (!regions.length || regionCodes.has(a.regionCode)));
    }, [regionKey, includeKey, excludeKey]); // eslint-disable-line react-hooks/exhaustive-deps

    const fit = regions.length > 0 || !!include;
    const decorations = useMemo(() => [
        ...(showCorsica ? [CORSICA] : []),
        ...(showSanMarino ? [SAN_MARINO] : []),
        ...(showVatican ? [VATICAN] : []),
    ], [showCorsica, showSanMarino, showVatican]);

    return (
        <MapView<TMeta>
            {...rest}
            ref={ref}
            areas={areas}
            index={INDEX}
            fit={fit}
            decorations={decorations}
            overlay={(showRegionBorders ?? !fit) ? <path className="rim-borders" d={REGION_BORDERS} /> : null}
            defaultTitle="Mappa delle province d'Italia"
            defaultLabel={(a) => a.code}
            onAreaClick={onProvinceClick as AreaEventHandler<TMeta> | undefined}
            onAreaHover={onProvinceHover as AreaHoverHandler<TMeta> | undefined}
        />
    );
}

/**
 * Interactive SVG map of the 110 Italian provinces, metropolitan cities and
 * equivalent units (ISTAT boundaries, after the 2025 Sardinian reform). Import it from
 * `react-italy-map/provinces` so the province geometry is only bundled when used.
 *
 * ```tsx
 * <ItalyProvincesMap region="Lombardia" showLabels onProvinceClick={(p) => console.log(p.code)} />
 * ```
 */
export const ItalyProvincesMap = forwardRef(ItalyProvincesMapInner) as <TMeta = unknown>(
    props: ItalyProvincesMapProps<TMeta> & { ref?: Ref<ItalyMapHandle> },
) => ReactElement;
