import type { CSSProperties, ReactNode } from 'react';

/** ISTAT statistical macro-areas ("ripartizioni geografiche"). */
export type MacroArea = 'nord-ovest' | 'nord-est' | 'centro' | 'sud' | 'isole';

export interface RegionInfo {
    /** ISO 3166-2 code, e.g. `IT-25`. */
    code: string;
    /** Two-digit ISTAT code, e.g. `03`. */
    istat: string;
    name: string;
    nameEn: string;
    capital: string;
    area: MacroArea;
}

export interface ProvinceInfo {
    /** Two-letter vehicle/postal code ("sigla"), e.g. `MI`. */
    code: string;
    /** Three-digit ISTAT code, e.g. `015`. */
    istat: string;
    name: string;
    /** Official ISTAT name when it differs from `name` (e.g. `Bolzano/Bozen`). */
    officialName?: string;
    /** Name of the region the province belongs to. */
    region: string;
    /** ISO code of the region the province belongs to. */
    regionCode: string;
    /** Administrative type: Provincia, Città metropolitana, … */
    type: string;
    aliases?: string[];
}

/** Geometry of one area. `d` is on the GRID scale, `label` and `bbox` in viewBox units. */
export interface AreaShape {
    d: string;
    label: number[];
    bbox: number[];
}

export type AreaKind = 'region' | 'province' | 'foreign';

/** Per-area customisation passed through the `data` prop. */
export interface AreaData<TMeta = unknown> {
    /**
     * Identifies the area. Accepts the ISO/sigla code, the ISTAT code, the Italian or
     * English name or a slug, case- and accent-insensitive: `IT-25`, `03`, `Lombardia`,
     * `lombardy`, `MI`, `milano`, …
     */
    id: string;
    /** Fill colour. Takes precedence over `colorScale`. */
    color?: string;
    /** Fill colour on hover. */
    hoverColor?: string;
    /** Numeric value, coloured through `colorScale` and shown in the default tooltip. */
    value?: number;
    /** Overrides the label text when `showLabels` is on. */
    label?: string;
    /** Content (any React node) rendered at the centre of the area. */
    child?: ReactNode;
    /** Disabled areas are not clickable, selectable nor focusable. */
    disabled?: boolean;
    className?: string;
    /** Any extra data, handed back in callbacks and tooltips. */
    meta?: TMeta;
}

/** `data` can be an array of entries or an object keyed by id. */
export type AreaDataInput<TMeta = unknown> =
    | readonly AreaData<TMeta>[]
    | Readonly<Record<string, Omit<AreaData<TMeta>, 'id'>>>;

/** An area as handed to callbacks, tooltips and label functions. */
export interface MapArea<TMeta = unknown> {
    /** ISO code for regions (`IT-25`), sigla for provinces (`MI`), `SM`/`VA`/`FR-H` for neighbours. */
    code: string;
    name: string;
    kind: AreaKind;
    istat?: string;
    /** Parent region ISO code (provinces only). */
    regionCode?: string;
    data?: AreaData<TMeta>;
    selected: boolean;
    disabled: boolean;
}

export interface MapTheme {
    /** Default fill. @default '#e2e8f0' */
    fill?: string;
    /** Border colour. @default '#ffffff' */
    stroke?: string;
    /** Border width in screen pixels (it does not grow when zooming). @default 1 */
    strokeWidth?: number;
    /** Fill on hover. @default selectedFill */
    hoverFill?: string;
    /** Fill of selected areas. @default '#3b82f6' */
    selectedFill?: string;
    /** Fill of disabled areas without their own colour. @default '#f1f5f9' */
    disabledFill?: string;
    /** Fill of San Marino, Vatican City and Corsica. @default fill */
    foreignFill?: string;
    /** Opacity of the other areas while one is selected (see `dimUnselected`). @default 0.3 */
    dimOpacity?: number;
    /** Keyboard focus outline. @default '#0f172a' */
    focusStroke?: string;
    /** @default '#1e293b' */
    labelColor?: string;
    /** Outline around label text. @default '#ffffff' */
    labelHalo?: string;
    /** Label size, relative to the full-map width of ~610 units. @default 9 */
    labelSize?: number;
    /** Region borders on the province map. @default '#475569' */
    regionBorder?: string;
}

export interface ColorScaleOptions {
    /** Two or more hex colours, from the lowest to the highest value. */
    colors: readonly string[];
    /** `[min, max]`. Defaults to the range of the values in `data`. */
    domain?: readonly [number, number];
    /** Number of discrete classes. Omit for a continuous scale. */
    steps?: number;
}

export type ColorScaleInput<TMeta = unknown> =
    | ColorScaleOptions
    | ((value: number, area: MapArea<TMeta>) => string);

export type SelectionMode = 'none' | 'single' | 'multiple';

export interface ZoomToOptions {
    /** Space around the areas, as a fraction of their size. @default 0.15 */
    padding?: number;
    /** @default true (false when the user prefers reduced motion) */
    animate?: boolean;
}

/** Imperative API, available through `ref`. */
export interface ItalyMapHandle {
    zoomIn(): void;
    zoomOut(): void;
    resetZoom(): void;
    /** Zooms to fit one or more areas (any id accepted by `data`). */
    zoomTo(ids: string | readonly string[], options?: ZoomToOptions): void;
    getSvgElement(): SVGSVGElement | null;
    /** Standalone SVG markup of the current map, ready to download. */
    toSVGString(): string;
}

export interface BaseMapProps<TMeta = unknown> {
    data?: AreaDataInput<TMeta>;
    /** Colours areas by their `value`. */
    colorScale?: ColorScaleInput<TMeta>;
    /** Formats `value` in the default tooltip and in `aria-label`s. */
    formatValue?: (value: number, area: MapArea<TMeta>) => string;

    theme?: MapTheme;
    className?: string;
    /** CSS for the container. */
    style?: CSSProperties;
    /** CSS width. @default '100%' (or auto from `height`) */
    width?: number | string;
    /** CSS height. @default auto, from the map aspect ratio */
    height?: number | string;
    /** Accessible name of the map. */
    title?: string;

    /** Selected area(s), controlled. */
    selected?: string | readonly string[] | null;
    /** Initially selected area(s), uncontrolled. */
    defaultSelected?: string | readonly string[] | null;
    /**
     * `'single'` toggles one area, `'multiple'` toggles many.
     * @default 'single' when any selection prop is set, 'none' otherwise
     */
    selectionMode?: SelectionMode;
    onSelectionChange?: (codes: string[], area: MapArea<TMeta>) => void;
    /** Fade the other areas while something is selected. @default true for 'single' */
    dimUnselected?: boolean;

    /** Set to `false` to hide the tooltip. @default true */
    tooltip?: boolean;
    renderTooltip?: (area: MapArea<TMeta>) => ReactNode;
    /** Same as `renderTooltip`. */
    children?: ReactNode | ((area: MapArea<TMeta>) => ReactNode);

    showLabels?: boolean;
    /** Label text per area. Return `null` to hide one. */
    labelText?: (area: MapArea<TMeta>) => string | null | undefined;

    /** Wheel / pinch zoom, drag to pan, double-click to zoom in. */
    zoomable?: boolean;
    /** @default 10 */
    maxZoom?: number;
    /** @default zoomable */
    showZoomControls?: boolean;
    /** Zooms to the selection when it changes. */
    zoomOnSelect?: boolean;

    /** Only show these areas; the view fits them. */
    include?: readonly string[];
    /** Hide these areas. */
    exclude?: readonly string[];
    /** @default true */
    showCorsica?: boolean;
    /** @default true */
    showSanMarino?: boolean;
    /** @default true */
    showVatican?: boolean;
}
