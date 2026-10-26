// Brute-force / adversarial tests. Each test asserts the *correct* behaviour,
// so a failing test is a bug found. `it.fails` marks known open issues: remove the
// marker when fixing one.
import { createRef, StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    createColorScale, findProvince, findRegion, interpolateColor, ItalyMap, Legend, normalizeId,
    PROVINCES, REGIONS, type ItalyMapHandle,
} from '../src';
import { ItalyDrilldownMap, ItalyProvincesMap } from '../src/provinces';

afterEach(cleanup);
const area = (c: HTMLElement, code: string) => c.querySelector(`[data-code="${code}"]`) as SVGPathElement;
const viewBox = (c: HTMLElement) => c.querySelector('svg')!.getAttribute('viewBox')!;

describe('colour scale edge cases', () => {
    it('NaN value does not crash the map', () => {
        expect(() => render(<ItalyMap data={[{ id: 'IT-25', value: NaN }, { id: 'IT-21', value: 3 }]}
            colorScale={{ colors: ['#000', '#fff'] }} />)).not.toThrow();
    });
    it('Infinity value does not crash the map', () => {
        expect(() => render(<ItalyMap data={[{ id: 'IT-25', value: Infinity }, { id: 'IT-21', value: 3 }]}
            colorScale={{ colors: ['#000', '#fff'] }} />)).not.toThrow();
    });
    it('createColorScale(NaN) returns a colour', () => {
        const s = createColorScale({ colors: ['#000', '#fff'], domain: [0, 1] });
        expect(() => s(NaN)).not.toThrow();
    });
    it('non-integer steps returns a colour for every value', () => {
        const s = createColorScale({ colors: ['#000', '#fff'], domain: [0, 1], steps: 2.5 });
        for (const v of [0, 0.5, 0.8, 0.99, 1]) expect(s(v)).toMatch(/^#[0-9a-f]{6}$/);
    });
    it.fails('rejects malformed hex instead of silently returning a wrong colour', () => {
        expect(() => interpolateColor('#12zz56', '#fff', 0)).toThrow();
        expect(() => interpolateColor('#12345', '#fff', 0)).toThrow();
    });
    it.fails('named CSS colours in colorScale do not crash rendering', () => {
        expect(() => render(<ItalyMap data={[{ id: 'IT-25', value: 1 }, { id: 'IT-21', value: 3 }]}
            colorScale={{ colors: ['red', 'blue'] }} />)).not.toThrow();
    });
    it.fails('Legend with a single colour produces a valid gradient', () => {
        const { container } = render(<Legend colors={['#ff0000']} domain={[0, 1]} />);
        const bg = (container.querySelector('[role=img] > div') as HTMLElement).style.background;
        expect(bg).not.toBe(''); // jsdom drops invalid CSS
    });
});

describe('lookup', () => {
    it.fails('resolves common name variants', () => {
        const regions: Record<string, string> = {
            "Valle d Aosta": 'IT-23', 'Val d\'Aosta': 'IT-23', 'Emilia Romagna': 'IT-45', 'Trentino Alto Adige': 'IT-32',
            'Südtirol': 'IT-32', 'Friuli': 'IT-36', 'Abruzzi': 'IT-65', 'IT25': 'IT-25',
        };
        const miss = Object.entries(regions).filter(([k, v]) => findRegion(k)?.code !== v).map(([k]) => k);
        const provinces: Record<string, string> = {
            Rome: 'RM', Milan: 'MI', Turin: 'TO', Naples: 'NA', Florence: 'FI', Venice: 'VE', Genoa: 'GE', Padua: 'PD',
            Mantua: 'MN', Syracuse: 'SR', 'Monza Brianza': 'MB', 'Reggio di Calabria': 'RC', 'Pesaro Urbino': 'PU',
            "L Aquila": 'AQ', Laquila: 'AQ', 'Barletta Andria Trani': 'BT', 'Verbano Cusio Ossola': 'VB', 'Aoste': 'AO',
        };
        const missP = Object.entries(provinces).filter(([k, v]) => findProvince(k)?.code !== v).map(([k]) => k);
        expect({ regionMisses: miss, provinceMisses: missP }).toEqual({ regionMisses: [], provinceMisses: [] });
    });
    it('every region and province resolves from each of its own fields', () => {
        for (const r of REGIONS) for (const k of [r.code, r.istat, r.name, r.nameEn]) expect(findRegion(k)?.code).toBe(r.code);
        for (const p of PROVINCES) for (const k of [p.code, p.istat, p.name, ...(p.aliases ?? [])]) expect(findProvince(k)?.code, k).toBe(p.code);
    });
    it('no province key collides with another province', () => {
        const seen = new Map<string, string>();
        const clashes: string[] = [];
        for (const p of PROVINCES) for (const k of [p.code, p.istat, String(Number(p.istat)), p.name, p.officialName, ...(p.aliases ?? [])]) {
            if (!k) continue;
            const n = normalizeId(k);
            if (seen.has(n) && seen.get(n) !== p.code) clashes.push(`${k}: ${seen.get(n)} vs ${p.code}`);
            seen.set(n, p.code);
        }
        expect(clashes).toEqual([]);
    });
    it('empty / junk ids do not match', () => {
        for (const k of ['', ' ', '-', '0', '000', 'undefined', 'null', 'NaN']) {
            expect(findRegion(k), k).toBeUndefined();
            expect(findProvince(k), k).toBeUndefined();
        }
    });
    it.fails('drilldown: province ISTAT number "15" (Milano) selects the province, not region 15 (Campania)', () => {
        const { container } = render(<ItalyDrilldownMap defaultRegion="Lombardia" selectedProvinces={['15']} />);
        expect(area(container, 'MI').classList.contains('rim-selected')).toBe(true);
    });
});

describe('ItalyMap behaviour', () => {
    it.fails('foreign areas (Corsica) are not selectable as regions', () => {
        const onChange = vi.fn();
        const { container } = render(<ItalyMap onSelectionChange={onChange} />);
        fireEvent.click(area(container, 'FR-H'));
        expect(onChange).not.toHaveBeenCalled();
    });
    it.fails('holding Enter (key repeat) does not toggle selection repeatedly', () => {
        const onChange = vi.fn();
        const { container } = render(<ItalyMap selectionMode="single" onSelectionChange={onChange} />);
        const p = area(container, 'IT-25');
        fireEvent.keyDown(p, { key: 'Enter' });
        fireEvent.keyDown(p, { key: 'Enter', repeat: true });
        fireEvent.keyDown(p, { key: 'Enter', repeat: true });
        expect(onChange).toHaveBeenCalledTimes(1);
    });
    it('double-click to zoom does not toggle selection twice', () => {
        const onChange = vi.fn();
        const { container } = render(<ItalyMap zoomable selectionMode="single" onSelectionChange={onChange} />);
        const p = area(container, 'IT-25');
        fireEvent.click(p, { detail: 1 });
        fireEvent.click(p, { detail: 2 });
        fireEvent.doubleClick(p);
        expect(onChange.mock.calls.at(-1)?.[0]).toEqual(['IT-25']);
    });
    it('maxZoom < 1 does not produce an invalid viewBox', () => {
        const ref = createRef<ItalyMapHandle>();
        const { container } = render(<ItalyMap ref={ref} zoomable maxZoom={0} />);
        act(() => ref.current!.zoomIn());
        act(() => ref.current!.zoomOut());
        expect(viewBox(container)).not.toMatch(/NaN|Infinity/);
        const [, , w] = viewBox(container).split(' ').map(Number);
        expect(w).toBeLessThanOrEqual(610.31);
    });
    it('zoomTo an unknown id is a no-op', () => {
        const ref = createRef<ItalyMapHandle>();
        const { container } = render(<ItalyMap ref={ref} />);
        const before = viewBox(container);
        act(() => ref.current!.zoomTo(['nope', '']));
        expect(viewBox(container)).toBe(before);
    });
    it.fails('switching from uncontrolled to controlled warns in dev', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const err = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { rerender } = render(<ItalyMap onSelectionChange={() => {}} />);
        rerender(<ItalyMap selected="IT-25" onSelectionChange={() => {}} />);
        const called = warn.mock.calls.length + err.mock.calls.length;
        warn.mockRestore(); err.mockRestore();
        expect(called).toBeGreaterThan(0);
    });
    it.fails('a data id that matches nothing warns once, not on every re-render', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const data = [{ id: 'Atlantide', value: 1 }];
        const { rerender } = render(<ItalyMap data={data} />);
        for (let i = 0; i < 5; i++) rerender(<ItalyMap data={[...data]} />);
        const n = warn.mock.calls.length;
        warn.mockRestore();
        expect(n).toBe(1);
    });
    it('include + exclude of the same area', () => {
        const { container } = render(<ItalyMap include={['Lombardia', 'Piemonte']} exclude={['Lombardia']} />);
        expect(container.querySelectorAll('.rim-area')).toHaveLength(1);
    });
    it('include=[] renders nothing and keeps a sane viewBox', () => {
        const { container } = render(<ItalyMap include={[]} />);
        expect(container.querySelectorAll('.rim-area')).toHaveLength(0);
        expect(viewBox(container)).not.toMatch(/NaN|Infinity/);
    });
});

describe('pointer / gestures', () => {
    it('a mouse drag released outside the svg does not leave a stuck drag', () => {
        const ref = createRef<ItalyMapHandle>();
        const { container } = render(<ItalyMap ref={ref} zoomable />);
        const svg = container.querySelector('svg')!;
        // drag at zoom 1 (no pointer capture), release outside
        fireEvent.pointerDown(svg, { pointerId: 1, pointerType: 'mouse', button: 0, clientX: 10, clientY: 10 });
        fireEvent.pointerMove(svg, { pointerId: 1, pointerType: 'mouse', buttons: 1, clientX: 40, clientY: 40 });
        fireEvent.pointerUp(document.body, { pointerId: 1, pointerType: 'mouse' });
        act(() => ref.current!.zoomTo('Lombardia', { animate: false }));
        const before = viewBox(container);
        // plain hover move, no button pressed
        fireEvent.pointerMove(svg, { pointerId: 1, pointerType: 'mouse', clientX: 200, clientY: 200, buttons: 0 });
        expect(viewBox(container)).toBe(before);
    });
});

describe('ItalyDrilldownMap behaviour', () => {
    it('opening a region with the keyboard keeps focus inside the map (so Escape works)', () => {
        const { container } = render(<ItalyDrilldownMap />);
        const p = area(container, 'IT-25');
        p.focus();
        fireEvent.keyDown(p, { key: 'Enter' });
        expect(container.contains(document.activeElement)).toBe(true);
        fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
        expect(container.querySelector('.rim-back')).toBeNull();
        expect(document.activeElement).toBe(area(container, 'IT-25'));
    });
    it('a mouse click on a region does not move focus to the back button', () => {
        const { container } = render(<ItalyDrilldownMap />);
        fireEvent.click(area(container, 'IT-25'), { detail: 1 });
        expect(document.activeElement).not.toBe(container.querySelector('.rim-back'));
    });
    it.fails('hovered region that disappears on open fires a hover-out', () => {
        const onRegionHover = vi.fn();
        const { container } = render(<ItalyDrilldownMap onRegionHover={onRegionHover} />);
        fireEvent.pointerOver(area(container, 'IT-25'), { pointerType: 'mouse' });
        fireEvent.click(area(container, 'IT-25'));
        expect(onRegionHover.mock.calls.at(-1)?.[0]).toBeNull();
    });
    it.fails('a region id passed in `data` that is a province is reported', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        render(<ItalyDrilldownMap data={[{ id: 'MI', value: 1 }]} />);
        const n = warn.mock.calls.length;
        warn.mockRestore();
        expect(n).toBeGreaterThan(0);
    });
    it('StrictMode mount with defaultRegion does not leave the view mid-animation / wrong', () => {
        const { container } = render(<StrictMode><ItalyDrilldownMap defaultRegion="Sicilia" /></StrictMode>);
        const w = Number(viewBox(container).split(' ')[2]);
        expect(w).toBeLessThan(300); // zoomed to Sicily immediately
    });
});

describe('SSR', () => {
    it('renders all maps to string without touching window', () => {
        expect(renderToString(<ItalyMap data={[{ id: 'IT-25', value: 1 }]} colorScale={{ colors: ['#000', '#fff'] }} />)).toContain('data-code="IT-25"');
        expect(renderToString(<ItalyProvincesMap region="Lombardia" showLabels />)).toContain('data-code="MI"');
        expect(renderToString(<ItalyDrilldownMap defaultRegion="Lazio" />)).toContain('data-code="RM"');
    });
});

describe('toSVGString', () => {
    it('a NaN value leaves the area uncoloured and keeps the domain of the others', () => {
        const { container } = render(<ItalyMap data={[{ id: 'IT-25', value: NaN }, { id: 'IT-21', value: 0 }, { id: 'IT-62', value: 10 }]}
            colorScale={{ colors: ['#000000', '#ffffff'] }} />);
        expect(area(container, 'IT-25').style.getPropertyValue('--a-fill')).toBe('');
        expect(area(container, 'IT-62').style.getPropertyValue('--a-fill')).toBe('#ffffff');
    });
    it('drilldown export does not contain the reveal animation (would be invisible when rasterised)', () => {
        const ref = createRef<ItalyMapHandle>();
        render(<ItalyDrilldownMap ref={ref} defaultRegion="Lazio" />);
        const svg = ref.current!.toSVGString();
        expect(svg).not.toMatch(/class="[^"]*rim-reveal/);
    });
});

describe('a11y', () => {
    it.fails('does not create a tab stop for every one of the 110 provinces', () => {
        const { container } = render(<ItalyProvincesMap onProvinceClick={() => {}} />);
        expect(container.querySelectorAll('[tabindex="0"]').length).toBeLessThanOrEqual(1);
    });
});
