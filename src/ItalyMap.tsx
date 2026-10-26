import { forwardRef, useMemo, type ReactElement, type Ref, type SyntheticEvent } from 'react';
import type { BaseMapProps, ItalyMapHandle, MapArea } from './types';
import { REGIONS } from './data/regions.meta';
import { REGION_SHAPES } from './data/regions.geo';
import { buildIndex, CORSICA, normalizeId, SAN_MARINO, VATICAN, type AreaDef } from './core/areas';
import { regionKeys } from './core/keys';
import { MapView, type AreaEventHandler, type AreaHoverHandler } from './core/MapView';

const REGION_AREAS: AreaDef[] = REGIONS.map((r) => ({
    code: r.code,
    name: r.name,
    kind: 'region',
    istat: r.istat,
    shape: REGION_SHAPES[r.code]!,
    keys: regionKeys(r),
}));

const ALL_AREAS = [...REGION_AREAS, SAN_MARINO, VATICAN, CORSICA];
const INDEX = buildIndex(ALL_AREAS);

export interface ItalyMapProps<TMeta = unknown> extends BaseMapProps<TMeta> {
    onRegionClick?: (region: MapArea<TMeta>, event: SyntheticEvent) => void;
    onRegionHover?: (region: MapArea<TMeta> | null, event: SyntheticEvent | null) => void;
    /** @deprecated Use `selected`. */
    selectedRegion?: string | null;
}

/** @deprecated Use `ItalyMapProps`. */
export type InteractiveItalyMapProps<TMeta = unknown> = ItalyMapProps<TMeta>;

function ItalyMapInner<TMeta>(
    {
        onRegionClick,
        onRegionHover,
        include,
        exclude,
        showCorsica = true,
        showSanMarino = true,
        showVatican = true,
        ...rest
    }: ItalyMapProps<TMeta>,
    ref: Ref<ItalyMapHandle>,
) {
    const includeKey = include?.join('\u0000');
    const excludeKey = exclude?.join('\u0000');
    const areas = useMemo(() => {
        const only = include && new Set(include.map((id) => INDEX.get(normalizeId(id))));
        const hidden = new Set(exclude?.map((id) => INDEX.get(normalizeId(id))));
        if (!showCorsica) hidden.add(CORSICA.code);
        if (!showSanMarino) hidden.add(SAN_MARINO.code);
        if (!showVatican) hidden.add(VATICAN.code);
        return ALL_AREAS.filter((a) => !hidden.has(a.code) && (!only || only.has(a.code)));
    }, [includeKey, excludeKey, showCorsica, showSanMarino, showVatican]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <MapView<TMeta>
            {...rest}
            ref={ref}
            areas={areas}
            index={INDEX}
            fit={!!include}
            defaultTitle="Mappa delle regioni d'Italia"
            defaultLabel={(a) => (a.kind === 'region' ? a.name : null)}
            onAreaClick={onRegionClick as AreaEventHandler<TMeta> | undefined}
            onAreaHover={onRegionHover as AreaHoverHandler<TMeta> | undefined}
        />
    );
}

/**
 * Interactive SVG map of the 20 Italian regions.
 *
 * ```tsx
 * <ItalyMap
 *   data={[{ id: 'Lombardia', value: 10 }, { id: 'IT-62', value: 6 }]}
 *   colorScale={{ colors: ['#dbeafe', '#1e3a8a'] }}
 *   onRegionClick={(region) => console.log(region.name)}
 * />
 * ```
 */
export const ItalyMap = forwardRef(ItalyMapInner) as <TMeta = unknown>(
    props: ItalyMapProps<TMeta> & { ref?: Ref<ItalyMapHandle> },
) => ReactElement;
