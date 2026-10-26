import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
    type ReactElement,
    type Ref,
    type SyntheticEvent,
} from 'react';
import type { AreaData, AreaDataInput, BaseMapProps, ColorScaleInput, ItalyMapHandle, MapArea, SelectionMode } from './types';
import { REGION_SHAPES } from './data/regions.geo';
import { buildIndex, CORSICA, SAN_MARINO, VATICAN, type AreaDef } from './core/areas';
import { REGION_AREAS } from './core/regionAreas';
import { PROVINCE_AREAS } from './core/provinceAreas';
import { createColorScale } from './core/color';
import { MapView, type AreaEventHandler, type AreaHoverHandler } from './core/MapView';
import { findProvince, findRegion } from './lookup';

const INDEX = buildIndex([...REGION_AREAS, ...PROVINCE_AREAS]);
const PROVINCE_CODES = new Set(PROVINCE_AREAS.map((p) => p.code));
const isProvince = (code: string) => PROVINCE_CODES.has(code);
const PROVINCES_OF = (regionCode: string) => PROVINCE_AREAS.filter((p) => p.regionCode === regionCode);

type Omitted = 'selected' | 'defaultSelected' | 'selectionMode' | 'onSelectionChange' | 'dimUnselected'
    | 'zoomOnSelect' | 'include' | 'exclude';

export interface ItalyDrilldownMapProps<TMeta = unknown> extends Omit<BaseMapProps<TMeta>, Omitted> {
    /** Open region (any region id), controlled. `null` shows the whole of Italy. */
    region?: string | null;
    /** Initially open region, uncontrolled. */
    defaultRegion?: string | null;
    /** A region was opened (`region`) or closed (`null`). */
    onRegionChange?: (region: MapArea<TMeta> | null) => void;
    /** Per-province data; `data` applies to regions. */
    provinceData?: AreaDataInput<TMeta>;
    /**
     * Colours provinces by `value`. Defaults to `colorScale`. Without a `domain`, it spans
     * the provinces of the open region, so each region uses the full colour range.
     */
    provinceColorScale?: ColorScaleInput<TMeta>;
    /** Fade the other regions while one is open. @default true */
    dimOthers?: boolean;
    /** @default true */
    showBackButton?: boolean;
    /** Clicking the map background (not another region) closes the open region. @default true */
    closeOnBackgroundClick?: boolean;
    /** Selected province(s), controlled (any province id). Kept while regions open and close. */
    selectedProvinces?: string | readonly string[] | null;
    /** Initially selected province(s), uncontrolled. */
    defaultSelectedProvinces?: string | readonly string[] | null;
    /**
     * `'single'` or `'multiple'` province selection.
     * @default 'single' when any province selection prop is set, 'none' otherwise
     */
    provinceSelectionMode?: SelectionMode;
    onProvinceSelectionChange?: (codes: string[], province: MapArea<TMeta>) => void;
    /** @default '← Italia' */
    backLabel?: string;
    onRegionClick?: (region: MapArea<TMeta>, event: SyntheticEvent) => void;
    onRegionHover?: (region: MapArea<TMeta> | null, event: SyntheticEvent | null) => void;
    onProvinceClick?: (province: MapArea<TMeta>, event: SyntheticEvent) => void;
    onProvinceHover?: (province: MapArea<TMeta> | null, event: SyntheticEvent | null) => void;
}

const entriesOf = <T,>(input: AreaDataInput<T> | undefined): AreaData<T>[] =>
    !input ? [] : Array.isArray(input)
        ? (input as AreaData<T>[])
        : Object.entries(input as Record<string, Omit<AreaData<T>, 'id'>>).map(([id, d]) => ({ ...d, id }));

const areaOf = <T,>(def: AreaDef, data?: AreaData<T>): MapArea<T> => {
    const area: MapArea<T> = { code: def.code, name: def.name, kind: def.kind, selected: false, disabled: !!data?.disabled };
    if (def.istat) area.istat = def.istat;
    if (def.regionCode) area.regionCode = def.regionCode;
    if (data) area.data = data;
    return area;
};

/** Fills in `color` from a scale, with the domain taken from these entries unless given. */
function applyScale<T>(
    entries: { code: string; entry: AreaData<T> }[],
    scale: ColorScaleInput<T> | undefined,
    defOf: (code: string) => AreaDef,
) {
    if (!scale) return entries;
    let fn: (value: number, code: string, entry: AreaData<T>) => string;
    if (typeof scale === 'function') {
        fn = (v, code, entry) => scale(v, areaOf(defOf(code), entry));
    } else {
        const values = entries.map((e) => e.entry.value).filter((v): v is number => typeof v === 'number');
        const domain = scale.domain ?? (values.length ? [Math.min(...values), Math.max(...values)] as const : [0, 1] as const);
        const color = createColorScale({ ...scale, domain });
        fn = (v) => color(v);
    }
    return entries.map((e) =>
        e.entry.color == null && typeof e.entry.value === 'number'
            ? { ...e, entry: { ...e.entry, color: fn(e.entry.value, e.code, e.entry) } }
            : e);
}

const join = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ') || undefined;

function ItalyDrilldownMapInner<TMeta>(
    {
        region,
        defaultRegion,
        onRegionChange,
        data,
        provinceData,
        colorScale,
        provinceColorScale,
        dimOthers = true,
        showBackButton = true,
        closeOnBackgroundClick = true,
        selectedProvinces,
        defaultSelectedProvinces,
        provinceSelectionMode,
        onProvinceSelectionChange,
        backLabel = '← Italia',
        onRegionClick,
        onRegionHover,
        onProvinceClick,
        onProvinceHover,
        showCorsica = true,
        showSanMarino = true,
        showVatican = true,
        ...rest
    }: ItalyDrilldownMapProps<TMeta>,
    ref: Ref<ItalyMapHandle>,
) {
    const isControlled = region !== undefined;
    const [innerRegion, setInnerRegion] = useState<string | null>(() =>
        defaultRegion ? findRegion(defaultRegion)?.code ?? null : null);
    const active = isControlled ? (region ? findRegion(region)?.code ?? null : null) : innerRegion;

    const regionDef = (code: string) => REGION_AREAS.find((r) => r.code === code)!;
    const provinceDef = (code: string) => PROVINCE_AREAS.find((p) => p.code === code)!;

    // ── Data: regions and provinces are resolved and coloured separately ──
    const regionEntries = useMemo(() => applyScale(
        entriesOf(data).flatMap((entry) => {
            const code = findRegion(entry.id)?.code;
            return code ? [{ code, entry }] : [];
        }),
        colorScale,
        regionDef,
    ), [data, colorScale]); // eslint-disable-line react-hooks/exhaustive-deps

    const provinceEntries = useMemo(() => {
        if (!active) return [];
        const resolved = entriesOf(provinceData).flatMap((entry) => {
            const p = findProvince(entry.id);
            return p && p.regionCode === active ? [{ code: p.code, entry }] : [];
        });
        return applyScale(resolved, provinceColorScale ?? colorScale, provinceDef);
    }, [active, provinceData, provinceColorScale, colorScale]); // eslint-disable-line react-hooks/exhaustive-deps

    const areas = useMemo(
        () => (active ? [...REGION_AREAS.filter((r) => r.code !== active), ...PROVINCES_OF(active)] : REGION_AREAS),
        [active],
    );

    const mapData = useMemo(() => {
        const byCode = new Map(regionEntries.map((e) => [e.code, e.entry]));
        const out: AreaData<TMeta>[] = [];
        for (const r of REGION_AREAS) {
            const entry = byCode.get(r.code);
            const dim = !!active && r.code !== active && dimOthers;
            if (entry || dim) out.push({ ...entry, id: r.code, className: join(entry?.className, dim && 'rim-dim') });
        }
        const provinceByCode = new Map(provinceEntries.map((e) => [e.code, e.entry]));
        if (active) {
            for (const p of PROVINCES_OF(active)) {
                const entry = provinceByCode.get(p.code);
                out.push({ ...entry, id: p.code, className: join(entry?.className, 'rim-reveal') });
            }
        }
        return out;
    }, [regionEntries, provinceEntries, active, dimOthers]);

    const decorations = useMemo(() => [
        ...(showCorsica ? [CORSICA] : []),
        ...(showSanMarino ? [SAN_MARINO] : []),
        ...(showVatican ? [VATICAN] : []),
    ], [showCorsica, showSanMarino, showVatican]);

    // ── Opening / closing ──────────────────────────────────────────
    const open = (code: string | null) => {
        if (code === active) return;
        if (!isControlled) setInnerRegion(code);
        onRegionChange?.(code ? areaOf(regionDef(code), regionEntries.find((e) => e.code === code)?.entry) : null);
    };

    const innerRef = useRef<ItalyMapHandle>(null);
    useImperativeHandle(ref, () => ({
        zoomIn: () => innerRef.current?.zoomIn(),
        zoomOut: () => innerRef.current?.zoomOut(),
        resetZoom: () => innerRef.current?.resetZoom(),
        zoomTo: (ids, options) => innerRef.current?.zoomTo(ids, options),
        getSvgElement: () => innerRef.current?.getSvgElement() ?? null,
        toSVGString: () => innerRef.current?.toSVGString() ?? '',
    }), []);

    const firstRun = useRef(true);
    useEffect(() => {
        const map = innerRef.current;
        const first = firstRun.current;
        firstRun.current = false;
        if (!map) return;
        if (active) map.zoomTo(PROVINCES_OF(active).map((p) => p.code), { padding: 0.12, animate: !first });
        else if (!first) map.resetZoom();
    }, [active]);

    const lastHoverKind = useRef<'region' | 'province' | null>(null);
    const handleClick: AreaEventHandler<TMeta> = (area, e) => {
        if (area.kind === 'province') {
            onProvinceClick?.(area, e);
        } else if (area.kind === 'region') {
            onRegionClick?.(area, e);
            open(area.code);
        }
    };
    const handleHover: AreaHoverHandler<TMeta> = (area, e) => {
        if (!area) {
            if (lastHoverKind.current === 'province') onProvinceHover?.(null, e);
            else if (lastHoverKind.current === 'region') onRegionHover?.(null, e);
            lastHoverKind.current = null;
            return;
        }
        if (lastHoverKind.current && lastHoverKind.current !== area.kind) {
            (lastHoverKind.current === 'province' ? onProvinceHover : onRegionHover)?.(null, e);
        }
        lastHoverKind.current = area.kind === 'province' ? 'province' : 'region';
        (area.kind === 'province' ? onProvinceHover : onRegionHover)?.(area, e);
    };

    return (
        <MapView<TMeta>
            {...rest}
            ref={innerRef}
            areas={areas}
            index={INDEX}
            data={mapData}
            decorations={decorations}
            overlay={active ? <path className="rim-borders" d={REGION_SHAPES[active]!.d} /> : null}
            htmlOverlay={active && showBackButton
                ? <button type="button" className="rim-back" onClick={() => open(null)}>{backLabel}</button>
                : null}
            onEscape={active ? () => open(null) : undefined}
            onBackgroundClick={active && closeOnBackgroundClick ? () => open(null) : undefined}
            selectionMode={provinceSelectionMode
                ?? (selectedProvinces !== undefined || defaultSelectedProvinces !== undefined || onProvinceSelectionChange
                    ? 'single' : 'none')}
            selected={selectedProvinces}
            defaultSelected={defaultSelectedProvinces}
            onSelectionChange={onProvinceSelectionChange}
            isSelectable={isProvince}
            defaultTitle="Mappa delle regioni e delle province d'Italia"
            defaultLabel={(a) => (a.kind === 'province' ? a.code : active ? null : a.name)}
            onAreaClick={handleClick}
            onAreaHover={handleHover}
        />
    );
}

/**
 * Regions that open into their provinces: click a region to zoom in and reveal its
 * provinces, with the rest of Italy kept as context. Back button or Escape to return.
 *
 * ```tsx
 * <ItalyDrilldownMap
 *   data={regionPopulation}
 *   provinceData={provincePopulation}
 *   colorScale={{ colors: ['#e0f2fe', '#0369a1'] }}
 *   onProvinceClick={(p) => console.log(p.name)}
 * />
 * ```
 */
export const ItalyDrilldownMap = forwardRef(ItalyDrilldownMapInner) as <TMeta = unknown>(
    props: ItalyDrilldownMapProps<TMeta> & { ref?: Ref<ItalyMapHandle> },
) => ReactElement;
