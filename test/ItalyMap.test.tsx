import { createRef } from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    createColorScale, findProvince, findRegion, getProvincesOfRegion, ItalyMap,
    PROVINCES, PROVINCES_BY_REGION, REGIONS, type ItalyMapHandle,
} from '../src';
import { ItalyProvincesMap } from '../src/provinces';

afterEach(cleanup);

const area = (c: HTMLElement, code: string) => c.querySelector(`[data-code="${code}"]`) as SVGPathElement;

describe('data', () => {
    it('has 20 regions and 110 provinces, each assigned to a region', () => {
        expect(REGIONS).toHaveLength(20);
        expect(PROVINCES).toHaveLength(110);
        expect(Object.values(PROVINCES_BY_REGION).flat()).toHaveLength(110);
        expect(PROVINCES_BY_REGION['Lombardia']).toHaveLength(12);
    });

    it('resolves regions from any identifier', () => {
        for (const id of ['IT-25', 'lombardia', 'Lombardy', '03', 3, 'LOMBARDIA']) {
            expect(findRegion(id)?.code).toBe('IT-25');
        }
        expect(findRegion("Valle d’Aosta")?.code).toBe('IT-23');
        expect(findRegion('valle-daosta')?.code).toBe('IT-23');
        expect(findRegion('Friuli Venezia Giulia')?.code).toBe('IT-36');
        expect(findRegion('Trentino-Alto Adige/Südtirol')?.code).toBe('IT-32');
        expect(findRegion('Atlantide')).toBeUndefined();
    });

    it('resolves provinces', () => {
        expect(findProvince('mi')?.name).toBe('Milano');
        expect(findProvince('015')?.code).toBe('MI');
        expect(findProvince('Reggio Emilia')?.code).toBe('RE');
        expect(findProvince('Forli-Cesena')?.code).toBe('FC');
        expect(getProvincesOfRegion('Sardinia').map((p) => p.code).sort())
            .toEqual(['CA', 'CI', 'NU', 'OG', 'OR', 'OT', 'SS', 'VS']);
    });

    it('builds colour scales', () => {
        const scale = createColorScale({ colors: ['#000000', '#ffffff'], domain: [0, 10] });
        expect(scale(0)).toBe('#000000');
        expect(scale(10)).toBe('#ffffff');
        expect(scale(5)).toBe('#808080');
        expect(scale(99)).toBe('#ffffff');
        const stepped = createColorScale({ colors: ['#000', '#fff'], domain: [0, 1], steps: 2 });
        expect(stepped(0.1)).toBe('#000000');
        expect(stepped(0.9)).toBe('#ffffff');
    });
});

describe('<ItalyMap>', () => {
    it('renders regions plus San Marino, Vatican and Corsica', () => {
        const { container } = render(<ItalyMap />);
        expect(container.querySelectorAll('.rim-area')).toHaveLength(23);
        const { container: c2 } = render(<ItalyMap showCorsica={false} showVatican={false} showSanMarino={false} />);
        expect(c2.querySelectorAll('.rim-area')).toHaveLength(20);
    });

    it('applies data colours from any id format and colour scales', () => {
        const { container } = render(
            <ItalyMap
                data={[{ id: 'lombardia', color: '#ff0000' }, { id: 'Sicily', value: 10 }, { id: '12', value: 0 }]}
                colorScale={{ colors: ['#000000', '#ffffff'] }}
            />,
        );
        expect(area(container, 'IT-25').style.getPropertyValue('--a-fill')).toBe('#ff0000');
        expect(area(container, 'IT-82').style.getPropertyValue('--a-fill')).toBe('#ffffff');
        expect(area(container, 'IT-62').style.getPropertyValue('--a-fill')).toBe('#000000');
    });

    it('accepts data as an object', () => {
        const { container } = render(<ItalyMap data={{ Lazio: { color: '#123456' } }} />);
        expect(area(container, 'IT-62').style.getPropertyValue('--a-fill')).toBe('#123456');
    });

    it('calls onRegionClick with the area', () => {
        const onClick = vi.fn();
        const { container } = render(<ItalyMap onRegionClick={onClick} />);
        fireEvent.click(area(container, 'IT-62'));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0]![0]).toMatchObject({ code: 'IT-62', name: 'Lazio', kind: 'region', istat: '12' });
    });

    it('supports uncontrolled single selection', () => {
        const onChange = vi.fn();
        const { container } = render(<ItalyMap onSelectionChange={onChange} />);
        const lazio = area(container, 'IT-62');
        fireEvent.click(lazio);
        expect(onChange).toHaveBeenLastCalledWith(['IT-62'], expect.objectContaining({ code: 'IT-62', selected: true }));
        expect(lazio.classList.contains('rim-selected')).toBe(true);
        expect(lazio.getAttribute('aria-pressed')).toBe('true');
        expect(area(container, 'IT-25').classList.contains('rim-dim')).toBe(true);
        fireEvent.click(lazio);
        expect(onChange).toHaveBeenLastCalledWith([], expect.objectContaining({ selected: false }));
        expect(lazio.classList.contains('rim-selected')).toBe(false);
    });

    it('supports multiple selection', () => {
        const onChange = vi.fn();
        const { container } = render(<ItalyMap selectionMode="multiple" onSelectionChange={onChange} />);
        fireEvent.click(area(container, 'IT-62'));
        fireEvent.click(area(container, 'IT-25'));
        expect(onChange).toHaveBeenLastCalledWith(['IT-62', 'IT-25'], expect.anything());
        expect(container.querySelectorAll('.rim-selected')).toHaveLength(2);
        expect(container.querySelectorAll('.rim-dim')).toHaveLength(0);
    });

    it('respects controlled selection', () => {
        const { container, rerender } = render(<ItalyMap selected={['lazio', 'Sicilia']} />);
        expect(container.querySelectorAll('.rim-selected')).toHaveLength(2);
        rerender(<ItalyMap selected={null} />);
        expect(container.querySelectorAll('.rim-selected')).toHaveLength(0);
        rerender(<ItalyMap selected="IT-25" />);
        expect(area(container, 'IT-25').classList.contains('rim-selected')).toBe(true);
    });

    it('does not activate disabled regions', () => {
        const onClick = vi.fn();
        const { container } = render(<ItalyMap data={[{ id: 'Molise', disabled: true }]} onRegionClick={onClick} />);
        const molise = area(container, 'IT-67');
        fireEvent.click(molise);
        expect(onClick).not.toHaveBeenCalled();
        expect(molise.getAttribute('aria-disabled')).toBe('true');
        expect(molise.hasAttribute('tabindex')).toBe(false);
    });

    it('is keyboard accessible', () => {
        const onClick = vi.fn();
        const { container } = render(<ItalyMap onRegionClick={onClick} />);
        const puglia = area(container, 'IT-75');
        expect(puglia.getAttribute('tabindex')).toBe('0');
        expect(puglia.getAttribute('role')).toBe('button');
        expect(puglia.getAttribute('aria-label')).toBe('Puglia');
        fireEvent.keyDown(puglia, { key: 'Enter' });
        fireEvent.keyDown(puglia, { key: ' ' });
        expect(onClick).toHaveBeenCalledTimes(2);
    });

    it('shows a tooltip on hover', () => {
        const onHover = vi.fn();
        const { container } = render(<ItalyMap data={[{ id: 'Toscana', value: 1234 }]} onRegionHover={onHover} />);
        fireEvent.pointerOver(area(container, 'IT-52'), { clientX: 10, clientY: 10 });
        expect(document.body.querySelector('.rim-tooltip')?.textContent).toContain('Toscana');
        expect(onHover).toHaveBeenLastCalledWith(expect.objectContaining({ code: 'IT-52' }), expect.anything());
        fireEvent.pointerOut(area(container, 'IT-52'));
        expect(document.body.querySelector('.rim-tooltip')).toBeNull();
        expect(onHover).toHaveBeenLastCalledWith(null, expect.anything());
    });

    it('renders custom tooltips and can disable them', () => {
        const { container } = render(<ItalyMap renderTooltip={(a) => <b className="tip">{a.code}</b>} />);
        fireEvent.pointerOver(area(container, 'IT-21'));
        expect(document.body.querySelector('.tip')?.textContent).toBe('IT-21');
        cleanup();
        const { container: c2 } = render(<ItalyMap tooltip={false} />);
        fireEvent.pointerOver(area(c2, 'IT-21'));
        expect(document.body.querySelector('.rim-tooltip')).toBeNull();
    });

    it('renders labels and children', () => {
        const { container } = render(
            <ItalyMap showLabels data={[{ id: 'Lazio', child: <span className="pin">x</span> }, { id: 'Umbria', label: 'UMB' }]} />,
        );
        const labels = [...container.querySelectorAll('.rim-label')].map((l) => l.textContent);
        expect(labels).toHaveLength(19); // Lazio shows its child instead
        expect(labels).toContain('UMB');
        expect(container.querySelector('.pin')).not.toBeNull();
    });

    it('filters areas and fits the view', () => {
        const { container } = render(<ItalyMap include={['Sicilia', 'Calabria']} />);
        expect(container.querySelectorAll('.rim-area')).toHaveLength(2);
        const vb = container.querySelector('svg')!.getAttribute('viewBox')!.split(' ').map(Number);
        expect(vb[2]).toBeLessThan(300);
        const { container: c2 } = render(<ItalyMap exclude={['IT-88']} />);
        expect(area(c2, 'IT-88')).toBeNull();
    });

    it('applies theme and sizing', () => {
        const { container } = render(<ItalyMap theme={{ fill: '#111111' }} height={400} />);
        const root = container.firstElementChild as HTMLElement;
        expect(root.style.getPropertyValue('--rim-fill')).toBe('#111111');
        expect(root.style.height).toBe('400px');
    });

    it('exposes an imperative API', () => {
        const ref = createRef<ItalyMapHandle>();
        const { container } = render(<ItalyMap ref={ref} />);
        const viewBox = () => container.querySelector('svg')!.getAttribute('viewBox');
        const initial = viewBox();
        act(() => ref.current!.zoomTo('Sicilia', { animate: false }));
        expect(viewBox()).not.toBe(initial);
        act(() => ref.current!.resetZoom());
        const svg = ref.current!.toSVGString();
        expect(svg.startsWith('<svg')).toBe(true);
        expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
        expect(svg).toContain('--rim-fill');
    });
});

describe('<ItalyProvincesMap>', () => {
    it('renders all provinces with region borders', () => {
        const { container } = render(<ItalyProvincesMap />);
        expect(container.querySelectorAll('.rim-area')).toHaveLength(110);
        expect(container.querySelector('.rim-borders')).not.toBeNull();
    });

    it('filters by region', () => {
        const onClick = vi.fn();
        const { container } = render(<ItalyProvincesMap region="Lombardy" onProvinceClick={onClick} showLabels />);
        expect(container.querySelectorAll('.rim-area')).toHaveLength(12);
        expect(container.querySelector('.rim-borders')).toBeNull();
        fireEvent.click(area(container, 'MI'));
        expect(onClick.mock.calls[0]![0]).toMatchObject({ code: 'MI', name: 'Milano', regionCode: 'IT-25', kind: 'province' });
        expect([...container.querySelectorAll('.rim-label')].map((l) => l.textContent)).toContain('MI');
    });
});
