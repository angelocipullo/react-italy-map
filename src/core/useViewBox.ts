import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

export interface Box { x: number; y: number; w: number; h: number }

const prefersReducedMotion = () =>
    typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Zoom/pan state for an SVG viewBox. `frame` is the zoom-1 view; the view can
 * never be larger than the frame nor leave it.
 */
export function useViewBox(frame: Box, maxZoom: number, svgRef: RefObject<SVGSVGElement | null>) {
    const [view, setViewState] = useState<Box>(frame);
    const viewRef = useRef(view);
    const frameRef = useRef(frame);
    frameRef.current = frame;
    const anim = useRef<number | null>(null);

    const fit = useCallback((b: Box): Box => {
        const f = frameRef.current;
        const minW = f.w / maxZoom;
        let w = clamp(b.w, minW, f.w);
        let h = w * (f.h / f.w);
        // Keep the frame aspect ratio: grow whichever side is too small.
        if (h < b.h) {
            h = clamp(b.h, minW * (f.h / f.w), f.h);
            w = h * (f.w / f.h);
        }
        const cx = b.x + b.w / 2;
        const cy = b.y + b.h / 2;
        return {
            x: clamp(cx - w / 2, f.x, f.x + f.w - w),
            y: clamp(cy - h / 2, f.y, f.y + f.h - h),
            w,
            h,
        };
    }, [maxZoom]);

    const setView = useCallback((b: Box) => {
        if (anim.current != null) cancelAnimationFrame(anim.current);
        anim.current = null;
        viewRef.current = b;
        setViewState(b);
    }, []);

    const animateTo = useCallback((target: Box, animate = true) => {
        const to = fit(target);
        const from = viewRef.current;
        if (!animate || prefersReducedMotion() || typeof requestAnimationFrame === 'undefined') {
            setView(to);
            return;
        }
        if (anim.current != null) cancelAnimationFrame(anim.current);
        const start = performance.now();
        const step = (now: number) => {
            const t = easeOut(Math.min(1, (now - start) / 350));
            const b = {
                x: from.x + (to.x - from.x) * t,
                y: from.y + (to.y - from.y) * t,
                w: from.w + (to.w - from.w) * t,
                h: from.h + (to.h - from.h) * t,
            };
            viewRef.current = b;
            setViewState(b);
            anim.current = t < 1 ? requestAnimationFrame(step) : null;
        };
        anim.current = requestAnimationFrame(step);
    }, [fit, setView]);

    useEffect(() => () => { if (anim.current != null) cancelAnimationFrame(anim.current); }, []);

    // Reset when the frame itself changes (e.g. a different province filter).
    const frameKey = `${frame.x},${frame.y},${frame.w},${frame.h}`;
    const firstFrame = useRef(true);
    useEffect(() => {
        if (firstFrame.current) { firstFrame.current = false; return; }
        animateTo(frameRef.current);
    }, [frameKey, animateTo]);

    /** Zooms by `factor` (< 1 zooms in) keeping the given point in place. */
    const zoomAt = useCallback((factor: number, px?: number, py?: number, animate = false) => {
        const v = viewRef.current;
        const f = frameRef.current;
        const w = clamp(v.w * factor, f.w / maxZoom, f.w);
        const k = w / v.w;
        const cx = px ?? v.x + v.w / 2;
        const cy = py ?? v.y + v.h / 2;
        const next = { x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k, w, h: v.h * k };
        if (animate) animateTo(next);
        else setView(fit(next));
    }, [animateTo, fit, maxZoom, setView]);

    const panBy = useCallback((dx: number, dy: number, origin: Box) => {
        setView(fit({ ...origin, x: origin.x - dx, y: origin.y - dy }));
    }, [fit, setView]);

    /** Client (screen) coordinates → viewBox coordinates. */
    const toView = useCallback((clientX: number, clientY: number) => {
        const svg = svgRef.current;
        const v = viewRef.current;
        if (!svg) return { x: v.x + v.w / 2, y: v.y + v.h / 2, scale: 1 };
        const r = svg.getBoundingClientRect();
        // The svg uses "meet": compute the scale actually applied.
        const scale = Math.max(v.w / (r.width || 1), v.h / (r.height || 1));
        const ox = r.left + (r.width - v.w / scale) / 2;
        const oy = r.top + (r.height - v.h / scale) / 2;
        return { x: v.x + (clientX - ox) * scale, y: v.y + (clientY - oy) * scale, scale };
    }, [svgRef]);

    return { view, viewRef, zoom: frame.w / view.w, animateTo, zoomAt, panBy, toView };
}
