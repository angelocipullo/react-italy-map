import {
    forwardRef,
    memo,
    useCallback,
    useEffect,
    useImperativeHandle,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type FocusEvent as ReactFocusEvent,
    type KeyboardEvent as ReactKeyboardEvent,
    type MouseEvent as ReactMouseEvent,
    type PointerEvent as ReactPointerEvent,
    type ReactElement,
    type ReactNode,
    type Ref,
    type SyntheticEvent,
} from 'react';
import { createPortal } from 'react-dom';
import type { AreaData, BaseMapProps, ItalyMapHandle, MapArea, SelectionMode } from '../types';
import { FRAME, GRID } from '../data/frame';
import { normalizeId, type AreaDef, type AreaIndex } from './areas';
import { createColorScale } from './color';
import { CSS } from './styles';
import { useViewBox, type Box } from './useViewBox';

declare const process: { env: { NODE_ENV?: string } } | undefined;
const devWarn = (msg: string) => {
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') console.warn(`[react-italy-map] ${msg}`);
};

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export type AreaEventHandler<TMeta> = (area: MapArea<TMeta>, event: SyntheticEvent) => void;
export type AreaHoverHandler<TMeta> = (area: MapArea<TMeta> | null, event: SyntheticEvent | null) => void;

export interface MapViewProps<TMeta> extends BaseMapProps<TMeta> {
    /** Areas to draw (already filtered). */
    areas: readonly AreaDef[];
    /** Resolves any id to an area code. */
    index: AreaIndex;
    /** Non-interactive shapes drawn below the areas. */
    decorations?: readonly AreaDef[];
    /** SVG drawn above the areas, in GRID units. */
    overlay?: ReactNode;
    /** Fit the view to `areas` instead of the whole of Italy. */
    fit?: boolean;
    defaultTitle: string;
    defaultLabel: (area: AreaDef) => string | null;
    onAreaClick?: AreaEventHandler<TMeta> | undefined;
    onAreaHover?: AreaHoverHandler<TMeta> | undefined;
}

const FULL: Box = { x: 0, y: 0, w: FRAME.width, h: FRAME.height };
const EMPTY: readonly string[] = [];

const toList = (v: string | readonly string[] | null | undefined): readonly string[] =>
    v == null ? EMPTY : typeof v === 'string' ? [v] : v;

const unionBox = (defs: readonly AreaDef[]): Box | null => {
    if (!defs.length) return null;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const { shape: { bbox } } of defs) {
        x0 = Math.min(x0, bbox[0]!); y0 = Math.min(y0, bbox[1]!);
        x1 = Math.max(x1, bbox[2]!); y1 = Math.max(y1, bbox[3]!);
    }
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
};

const pad = (b: Box, k: number): Box => {
    const p = Math.max(b.w, b.h) * k;
    return { x: b.x - p, y: b.y - p, w: b.w + 2 * p, h: b.h + 2 * p };
};

interface AreaPathProps {
    def: AreaDef;
    className: string;
    fill: string | undefined;
    hover: string | undefined;
    focusable: boolean;
    role: string | undefined;
    pressed: boolean | undefined;
    disabled: boolean;
    ariaLabel: string;
}

const AreaPath = memo(function AreaPath({ def, className, fill, hover, focusable, role, pressed, disabled, ariaLabel }: AreaPathProps) {
    const style = (fill || hover)
        ? ({ '--a-fill': fill, '--a-hover': hover } as CSSProperties)
        : undefined;
    return (
        <path
            d={def.shape.d}
            data-code={def.code}
            className={className}
            style={style}
            tabIndex={focusable ? 0 : undefined}
            role={role}
            aria-label={ariaLabel}
            aria-pressed={pressed}
            aria-disabled={disabled || undefined}
        />
    );
});

const codeOf = (target: EventTarget | null): string | null => {
    const el = target as Element | null;
    return el?.closest?.('[data-code]')?.getAttribute('data-code') ?? null;
};

function MapViewInner<TMeta>(props: MapViewProps<TMeta>, ref: Ref<ItalyMapHandle>) {
    const {
        areas, index, decorations, overlay, fit, defaultTitle, defaultLabel,
        data, colorScale, formatValue,
        theme = {}, className, style: styleProp, width, height, title,
        selected, defaultSelected, selectionMode, onSelectionChange, dimUnselected,
        tooltip = true, renderTooltip, children,
        showLabels = false, labelText,
        zoomable = false, maxZoom = 10, showZoomControls, zoomOnSelect = false,
        onAreaClick, onAreaHover,
    } = props;

    // ── v1 `style` compatibility ──────────────────────────────────
    const { baseColor, borderColor, selectedRegionColor, hoverColor, ...cssStyle } = styleProp ?? {};
    const fillColor = theme.fill ?? baseColor ?? '#e2e8f0';
    const selectedFill = theme.selectedFill ?? selectedRegionColor ?? '#3b82f6';

    // ── Lookup ────────────────────────────────────────────────────
    const byCode = useMemo(() => new Map(areas.map((a) => [a.code, a])), [areas]);
    const resolve = useCallback((id: string) => index.get(normalizeId(id)), [index]);

    const dataByCode = useMemo(() => {
        const map = new Map<string, AreaData<TMeta>>();
        if (!data) return map;
        const entries: AreaData<TMeta>[] = Array.isArray(data)
            ? (data as AreaData<TMeta>[])
            : Object.entries(data as Record<string, Omit<AreaData<TMeta>, 'id'>>).map(([id, d]) => ({ ...d, id }));
        for (const entry of entries) {
            const code = resolve(entry.id);
            if (code) map.set(code, entry);
            else devWarn(`no area matches data id "${entry.id}"`);
        }
        return map;
    }, [data, resolve]);

    const scale = useMemo(() => {
        if (!colorScale) return null;
        if (typeof colorScale === 'function') return colorScale;
        let domain = colorScale.domain;
        if (!domain) {
            // Only the visible areas count, so a filtered map uses its full colour range.
            const values = areas.map((a) => dataByCode.get(a.code)?.value).filter((v): v is number => typeof v === 'number');
            domain = values.length ? [Math.min(...values), Math.max(...values)] : [0, 1];
        }
        const fn = createColorScale({ ...colorScale, domain });
        return (value: number) => fn(value);
    }, [colorScale, dataByCode, areas]);

    // ── Selection ─────────────────────────────────────────────────
    const legacySelected = (props as { selectedRegion?: string | null }).selectedRegion;
    const controlledValue = selected !== undefined ? selected : legacySelected;
    const isControlled = controlledValue !== undefined;
    const mode: SelectionMode = selectionMode
        ?? (isControlled || defaultSelected !== undefined || onSelectionChange ? 'single' : 'none');

    const toCodes = useCallback((v: string | readonly string[] | null | undefined) => {
        const out: string[] = [];
        for (const id of toList(v)) {
            const code = resolve(id);
            if (code && !out.includes(code)) out.push(code);
        }
        return out;
    }, [resolve]);

    const [innerSelected, setInnerSelected] = useState<string[]>(() => toCodes(defaultSelected));
    const controlledKey = toList(controlledValue).join('\u0000');
    const controlledCodes = useMemo(() => toCodes(controlledValue), [controlledKey, toCodes]); // eslint-disable-line react-hooks/exhaustive-deps
    const selectedCodes = isControlled ? controlledCodes : innerSelected;
    const selectedSet = useMemo(() => new Set(selectedCodes), [selectedCodes]);
    const dim = (dimUnselected ?? mode === 'single') && selectedSet.size > 0;

    const interactive = mode !== 'none' || !!onAreaClick;

    // ── Area model handed to user callbacks ───────────────────────
    const makeArea = useCallback((code: string, selectedNow = selectedSet.has(code)): MapArea<TMeta> => {
        const def = byCode.get(code)!;
        const d = dataByCode.get(code);
        const area: MapArea<TMeta> = {
            code,
            name: def.name,
            kind: def.kind,
            selected: selectedNow,
            disabled: !!d?.disabled,
        };
        if (def.istat) area.istat = def.istat;
        if (def.regionCode) area.regionCode = def.regionCode;
        if (d) area.data = d;
        return area;
    }, [byCode, dataByCode, selectedSet]);

    // ── View / zoom ───────────────────────────────────────────────
    const svgRef = useRef<SVGSVGElement>(null);
    const frame = useMemo(() => {
        if (!fit) return FULL;
        const b = unionBox(areas);
        return b ? pad(b, 0.04) : FULL;
    }, [fit, areas]);
    const { view, viewRef, zoom, animateTo, zoomAt, panBy, toView } = useViewBox(frame, maxZoom, svgRef);

    const zoomTo = useCallback((ids: string | readonly string[], options: { padding?: number; animate?: boolean } = {}) => {
        const defs = toCodes(ids).map((c) => byCode.get(c)).filter((d): d is AreaDef => !!d);
        const b = unionBox(defs);
        if (b) animateTo(pad(b, options.padding ?? 0.15), options.animate ?? true);
    }, [animateTo, byCode, toCodes]);

    const zoomKey = selectedCodes.join(',');
    const zoomed = useRef(false);
    useEffect(() => {
        if (!zoomOnSelect) return;
        if (selectedCodes.length) { zoomTo(selectedCodes); zoomed.current = true; }
        else if (zoomed.current) { animateTo(frame); zoomed.current = false; }
    }, [zoomKey, zoomOnSelect]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Hover / focus / tooltip ───────────────────────────────────
    const [hovered, setHovered] = useState<string | null>(null);
    const [focused, setFocused] = useState<{ code: string; visible: boolean } | null>(null);
    const [panning, setPanning] = useState(false);
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const onAreaHoverRef = useRef(onAreaHover);
    onAreaHoverRef.current = onAreaHover;
    const tipRef = useRef<HTMLDivElement>(null);
    const tipPos = useRef({ x: 0, y: 0 });
    const touchTip = useRef(false);

    const placeTooltip = useCallback((x: number, y: number) => {
        tipPos.current = { x, y };
        const el = tipRef.current;
        if (!el) return;
        const w = el.offsetWidth, h = el.offsetHeight;
        const vw = window.innerWidth, vh = window.innerHeight;
        let left = x + 14, top = y + 14;
        if (left + w > vw - 4) left = x - 14 - w;
        if (top + h > vh - 4) top = y - 14 - h;
        el.style.transform = `translate(${Math.max(4, left)}px,${Math.max(4, top)}px)`;
    }, []);

    const tipCode = hovered ?? (focused?.visible ? focused.code : null);
    useIsoLayoutEffect(() => {
        if (tipCode) placeTooltip(tipPos.current.x, tipPos.current.y);
    }, [tipCode, placeTooltip]);

    // A tooltip opened by a tap stays until the next tap elsewhere.
    useEffect(() => {
        if (!hovered || !touchTip.current) return;
        const onDown = (e: PointerEvent) => {
            if (!svgRef.current?.contains(e.target as Node)) { touchTip.current = false; setHovered(null); }
        };
        document.addEventListener('pointerdown', onDown);
        return () => document.removeEventListener('pointerdown', onDown);
    }, [hovered]);

    // Scrolling moves the map under a still pointer: drop a mouse hover.
    useEffect(() => {
        if (!hovered || touchTip.current) return;
        const onScroll = () => { setHovered(null); onAreaHoverRef.current?.(null, null); };
        window.addEventListener('scroll', onScroll, { capture: true, passive: true });
        return () => window.removeEventListener('scroll', onScroll, { capture: true });
    }, [hovered]);

    const handlePointerOver = (e: ReactPointerEvent<SVGGElement>) => {
        const code = codeOf(e.target);
        if (!code || panning) return;
        touchTip.current = e.pointerType === 'touch';
        tipPos.current = { x: e.clientX, y: e.clientY };
        if (code !== hovered) {
            setHovered(code);
            onAreaHover?.(makeArea(code), e);
        }
    };

    const handlePointerMoveArea = (e: ReactPointerEvent<SVGGElement>) => {
        if (hovered && !touchTip.current) placeTooltip(e.clientX, e.clientY);
    };

    const handlePointerOut = (e: ReactPointerEvent<SVGGElement>) => {
        if (e.pointerType === 'touch') return;
        if (codeOf(e.relatedTarget)) return; // moving straight onto another area
        if (hovered) {
            setHovered(null);
            onAreaHover?.(null, e);
        }
    };

    const activate = (code: string, e: SyntheticEvent) => {
        const d = dataByCode.get(code);
        if (d?.disabled) return;
        if (mode !== 'none') {
            const was = selectedSet.has(code);
            const next = mode === 'single'
                ? (was ? [] : [code])
                : (was ? selectedCodes.filter((c) => c !== code) : [...selectedCodes, code]);
            if (!isControlled) setInnerSelected(next);
            onAreaClick?.(makeArea(code, !was), e);
            onSelectionChange?.(next, makeArea(code, !was));
        } else {
            onAreaClick?.(makeArea(code), e);
        }
    };

    const suppressClick = useRef(false);
    const handleClick = (e: ReactMouseEvent<SVGGElement>) => {
        if (suppressClick.current) { suppressClick.current = false; return; }
        const code = codeOf(e.target);
        if (code) activate(code, e);
    };

    const handleKeyDown = (e: ReactKeyboardEvent<SVGGElement>) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const code = codeOf(e.target);
        if (!code) return;
        e.preventDefault();
        activate(code, e);
    };

    const handleFocus = (e: ReactFocusEvent<SVGGElement>) => {
        const code = codeOf(e.target);
        if (!code) return;
        let visible = true;
        try { visible = (e.target as Element).matches(':focus-visible'); } catch { /* old browser */ }
        if (visible) {
            const r = (e.target as Element).getBoundingClientRect();
            tipPos.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        }
        setFocused({ code, visible });
    };
    const handleBlur = () => setFocused(null);

    // ── Gestures: wheel, drag, pinch, double click ────────────────
    useEffect(() => {
        const svg = svgRef.current;
        if (!zoomable || !svg) return;
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const delta = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1);
            const p = toView(e.clientX, e.clientY);
            zoomAt(Math.exp(Math.max(-100, Math.min(100, delta)) * 0.0025), p.x, p.y);
        };
        svg.addEventListener('wheel', onWheel, { passive: false });
        return () => svg.removeEventListener('wheel', onWheel);
    }, [zoomable, toView, zoomAt]);

    const pointers = useRef(new Map<number, { x: number; y: number }>());
    const drag = useRef<{ x: number; y: number; view: Box; moved: boolean } | null>(null);
    const pinchDist = useRef(0);

    const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
        if (!zoomable || (e.pointerType === 'mouse' && e.button !== 0)) return;
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pointers.current.size === 1) {
            drag.current = { x: e.clientX, y: e.clientY, view: viewRef.current, moved: false };
        } else if (pointers.current.size === 2) {
            const [a, b] = [...pointers.current.values()] as [{ x: number; y: number }, { x: number; y: number }];
            pinchDist.current = Math.hypot(a.x - b.x, a.y - b.y);
            if (drag.current) drag.current.moved = true;
        }
    };

    const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
        // The map can move under a still pointer (wheel zoom): drop a stale hover.
        if (hovered && !touchTip.current && !codeOf(e.target)) {
            setHovered(null);
            onAreaHover?.(null, e);
        }
        if (!pointers.current.has(e.pointerId)) return;
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pointers.current.size === 2) {
            const [a, b] = [...pointers.current.values()] as [{ x: number; y: number }, { x: number; y: number }];
            const dist = Math.hypot(a.x - b.x, a.y - b.y);
            if (pinchDist.current > 0 && dist > 0) {
                const p = toView((a.x + b.x) / 2, (a.y + b.y) / 2);
                zoomAt(pinchDist.current / dist, p.x, p.y);
            }
            pinchDist.current = dist;
            return;
        }
        const d = drag.current;
        if (!d) return;
        const dx = e.clientX - d.x, dy = e.clientY - d.y;
        if (!d.moved && Math.hypot(dx, dy) > 4) {
            d.moved = true;
            if (frame.w / viewRef.current.w > 1.001) {
                setPanning(true);
                setHovered(null);
                try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
            }
        }
        if (d.moved) {
            const { scale: k } = toView(e.clientX, e.clientY);
            panBy(dx * k, dy * k, d.view);
        }
    };

    const onPointerEnd = (e: ReactPointerEvent<SVGSVGElement>) => {
        if (!pointers.current.delete(e.pointerId)) return;
        if (pointers.current.size === 0) {
            if (drag.current?.moved) suppressClick.current = true;
            drag.current = null;
            setPanning(false);
            setTimeout(() => { suppressClick.current = false; }, 0);
        } else if (pointers.current.size === 1) {
            const [p] = [...pointers.current.values()] as [{ x: number; y: number }];
            drag.current = { x: p.x, y: p.y, view: viewRef.current, moved: true };
            pinchDist.current = 0;
        }
    };

    const onDoubleClick = (e: ReactMouseEvent<SVGSVGElement>) => {
        if (!zoomable) return;
        const p = toView(e.clientX, e.clientY);
        zoomAt(e.shiftKey ? 2 : 0.5, p.x, p.y, true);
    };

    const onContainerKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
        if (!zoomable) return;
        if (e.key === '+' || e.key === '=') zoomAt(1 / 1.5, undefined, undefined, true);
        else if (e.key === '-' || e.key === '_') zoomAt(1.5, undefined, undefined, true);
        else if (e.key === '0') animateTo(frame);
        else return;
        e.preventDefault();
    };

    // ── Imperative API ────────────────────────────────────────────
    const themeVars = {
        '--rim-fill': fillColor,
        '--rim-stroke': theme.stroke ?? borderColor ?? '#ffffff',
        '--rim-sw': `${theme.strokeWidth ?? 1}px`,
        '--rim-hover': theme.hoverFill ?? hoverColor ?? selectedFill,
        '--rim-selected': selectedFill,
        '--rim-disabled': theme.disabledFill ?? '#f1f5f9',
        '--rim-foreign': theme.foreignFill ?? fillColor,
        '--rim-dim': String(theme.dimOpacity ?? 0.3),
        '--rim-focus': theme.focusStroke ?? '#0f172a',
        '--rim-label': theme.labelColor ?? '#1e293b',
        '--rim-halo': theme.labelHalo ?? '#ffffff',
        '--rim-region-border': theme.regionBorder ?? '#475569',
    } as Record<string, string>;

    useImperativeHandle(ref, () => ({
        zoomIn: () => zoomAt(1 / 1.5, undefined, undefined, true),
        zoomOut: () => zoomAt(1.5, undefined, undefined, true),
        resetZoom: () => animateTo(frame),
        zoomTo,
        getSvgElement: () => svgRef.current,
        toSVGString: () => {
            const svg = svgRef.current;
            if (!svg) return '';
            const clone = svg.cloneNode(true) as SVGSVGElement;
            clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            const vb = viewRef.current;
            clone.setAttribute('width', String(Math.round(vb.w)));
            clone.setAttribute('height', String(Math.round(vb.h)));
            clone.setAttribute('style', Object.entries(themeVars).map(([k, v]) => `${k}:${v}`).join(';'));
            clone.querySelectorAll('.rim-outline').forEach((n) => n.remove());
            const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
            styleEl.textContent = CSS;
            clone.insertBefore(styleEl, clone.firstChild);
            return new XMLSerializer().serializeToString(clone);
        },
    }));

    // ── Render ────────────────────────────────────────────────────
    const s = view.w / frame.w; // keeps labels and children at a constant screen size
    const labelSize = (theme.labelSize ?? 9) * s;
    const valueText = (code: string, value: number) => formatValue
        ? formatValue(value, makeArea(code))
        : value.toLocaleString();

    const areaNodes: ReactElement[] = [];
    const labelNodes: ReactElement[] = [];
    for (const def of areas) {
        const d = dataByCode.get(def.code);
        const isSelected = selectedSet.has(def.code);
        const disabled = !!d?.disabled;
        let fill = d?.color;
        if (fill == null && scale && typeof d?.value === 'number') fill = scale(d.value, makeArea(def.code));
        const cls = ['rim-area'];
        if (def.kind === 'foreign') cls.push('rim-foreign');
        if (isSelected) cls.push('rim-selected');
        if (disabled) cls.push('rim-disabled');
        if (dim && !isSelected) cls.push('rim-dim');
        if (touchTip.current && hovered === def.code) cls.push('rim-hover');
        if (d?.className) cls.push(d.className);

        areaNodes.push(
            <AreaPath
                key={def.code}
                def={def}
                className={cls.join(' ')}
                fill={fill}
                hover={d?.hoverColor}
                focusable={interactive && !disabled}
                role={interactive ? 'button' : undefined}
                pressed={mode !== 'none' ? isSelected : undefined}
                disabled={disabled}
                ariaLabel={typeof d?.value === 'number' ? `${def.name}: ${valueText(def.code, d.value)}` : def.name}
            />,
        );

        const [lx, ly] = def.shape.label as [number, number];
        const opacity = dim && !isSelected ? Number(themeVars['--rim-dim']) : undefined;
        if (d?.child != null) {
            labelNodes.push(
                <g key={def.code} transform={`translate(${lx} ${ly}) scale(${s})`} opacity={opacity}>
                    <foreignObject x={-25} y={-25} width={50} height={50} className="rim-child">
                        <div>{d.child}</div>
                    </foreignObject>
                </g>,
            );
        } else if (showLabels) {
            const text = labelText ? labelText(makeArea(def.code)) : (d?.label ?? defaultLabel(def));
            if (text) {
                labelNodes.push(
                    <text
                        key={def.code}
                        className="rim-label"
                        x={lx}
                        y={ly}
                        fontSize={labelSize}
                        style={{ strokeWidth: labelSize / 3 }}
                        textAnchor="middle"
                        dominantBaseline="central"
                        opacity={opacity}
                    >
                        {text}
                    </text>,
                );
            }
        }
    }

    const focusDef = focused?.visible ? byCode.get(focused.code) : undefined;
    const tipArea = tipCode && byCode.has(tipCode) ? makeArea(tipCode) : null;
    const tipRender = renderTooltip ?? (typeof children === 'function' ? children : null);
    let tipContent: ReactNode = null;
    if (tipArea && tooltip) {
        if (tipRender) tipContent = tipRender(tipArea);
        else {
            const v = tipArea.data?.value;
            tipContent = (
                <div className="rim-tooltip-default">
                    {tipArea.name}
                    {typeof v === 'number' && <span>{valueText(tipArea.code, v)}</span>}
                </div>
            );
        }
    }

    const w = width ?? cssStyle.width;
    const h = height ?? cssStyle.height;
    const containerStyle: CSSProperties = {
        ...themeVars,
        aspectRatio: `${frame.w} / ${frame.h}`,
        ...cssStyle,
        width: w ?? (h != null ? 'auto' : '100%'),
        height: h ?? 'auto',
    };
    const canZoomOut = zoom > 1.001;
    const controls = showZoomControls ?? zoomable;
    const containerClass = ['rim', interactive && 'rim-clickable', panning && 'rim-panning', className]
        .filter(Boolean).join(' ');

    return (
        <div className={containerClass} style={containerStyle} onKeyDown={onContainerKeyDown}>
            <style>{CSS}</style>
            <svg
                ref={svgRef}
                viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
                preserveAspectRatio="xMidYMid meet"
                role="group"
                aria-label={title ?? defaultTitle}
                style={zoomable ? { touchAction: canZoomOut ? 'none' : 'pan-x pan-y' } : undefined}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerEnd}
                onPointerCancel={onPointerEnd}
                onDoubleClick={onDoubleClick}
            >
                <g transform={`scale(${1 / GRID})`}>
                    {decorations?.map((def) => <path key={def.code} className="rim-deco" d={def.shape.d} />)}
                    <g
                        onPointerOver={handlePointerOver}
                        onPointerMove={handlePointerMoveArea}
                        onPointerOut={handlePointerOut}
                        onClick={handleClick}
                        onKeyDown={handleKeyDown}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                    >
                        {areaNodes}
                    </g>
                    {overlay}
                    {focusDef && <path className="rim-outline" d={focusDef.shape.d} />}
                </g>
                {labelNodes}
            </svg>

            {controls && (
                <div className="rim-controls">
                    <button type="button" aria-label="Zoom in" title="Zoom in" disabled={zoom >= maxZoom - 0.001}
                        onClick={() => zoomAt(1 / 1.5, undefined, undefined, true)}>+</button>
                    <button type="button" aria-label="Zoom out" title="Zoom out" disabled={!canZoomOut}
                        onClick={() => zoomAt(1.5, undefined, undefined, true)}>−</button>
                    <button type="button" aria-label="Reset zoom" title="Reset zoom" disabled={!canZoomOut}
                        onClick={() => animateTo(frame)}>⟲</button>
                </div>
            )}

            {mounted && tipContent != null && createPortal(
                <div ref={tipRef} className="rim-tooltip" role="tooltip">{tipContent}</div>,
                document.body,
            )}
        </div>
    );
}

export const MapView = forwardRef(MapViewInner) as <TMeta>(
    props: MapViewProps<TMeta> & { ref?: Ref<ItalyMapHandle> },
) => ReactElement;
