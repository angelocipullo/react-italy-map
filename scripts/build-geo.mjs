#!/usr/bin/env node
/**
 * Generates the geometry + metadata modules in src/data/ from ISTAT boundaries
 * (via openpolis/geojson-italy, CC-BY 4.0).
 *
 * Every shape (regions, provinces, San Marino, Vatican) is derived from one
 * province topology, so borders between levels match exactly. The projection is
 * the ellipsoidal Mercator fitted to the frame of the original v1 SVG, so the
 * map looks the same as before. Corsica (not in ISTAT data) is re-encoded from
 * the v1 SVG.
 *
 *   node scripts/build-geo.mjs [--tolerance 0.3] [--grid 4]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as topo from 'topojson-client';
import { presimplify, simplify, planarTriangleArea } from 'topojson-simplify';
import polylabel from 'polylabel';
import { parseRelativePath } from './svgpath.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(ROOT, 'scripts', '.cache');
const OUT = path.join(ROOT, 'src', 'data');
const SOURCE = 'https://raw.githubusercontent.com/openpolis/geojson-italy/master/topojson/limits_IT_provinces.topo.json';

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? Number(process.argv[i + 1]) : def;
};
/** Minimum triangle area (in v1 viewBox units²) kept by Visvalingam simplification. */
const TOLERANCE = arg('tolerance', 0.3);
/** Output grid: coordinates are stored as integers in units of 1/GRID of the v1 viewBox. */
const GRID = arg('grid', 4);

// v1 frame and fitted projection: x = AX·lon + BX, y = AY·mercY(lat) + BY
const FRAME = { w: 610.30981, h: 792.58575 };
const AX = 51.2692095, BX = -339.35995;
const AY = 51.2590859 * (180 / Math.PI), BY = 2729.10769;
const E = 0.0818191908426; // WGS84 eccentricity
const mercY = (lat) => {
  const p = (lat * Math.PI) / 180, s = Math.sin(p);
  return -(Math.log(Math.tan(Math.PI / 4 + p / 2)) - (E / 2) * Math.log((1 + E * s) / (1 - E * s)));
};
const project = ([lon, lat]) => [AX * lon + BX, AY * mercY(lat) + BY];

// ── Reference tables ─────────────────────────────────────────────
const REGIONS = [
  ['01', 'IT-21', 'Piemonte', 'Piedmont', 'Torino', 'nord-ovest'],
  ['02', 'IT-23', "Valle d'Aosta", 'Aosta Valley', 'Aosta', 'nord-ovest'],
  ['03', 'IT-25', 'Lombardia', 'Lombardy', 'Milano', 'nord-ovest'],
  ['04', 'IT-32', 'Trentino-Alto Adige', 'Trentino-South Tyrol', 'Trento', 'nord-est'],
  ['05', 'IT-34', 'Veneto', 'Veneto', 'Venezia', 'nord-est'],
  ['06', 'IT-36', 'Friuli-Venezia Giulia', 'Friuli-Venezia Giulia', 'Trieste', 'nord-est'],
  ['07', 'IT-42', 'Liguria', 'Liguria', 'Genova', 'nord-ovest'],
  ['08', 'IT-45', 'Emilia-Romagna', 'Emilia-Romagna', 'Bologna', 'nord-est'],
  ['09', 'IT-52', 'Toscana', 'Tuscany', 'Firenze', 'centro'],
  ['10', 'IT-55', 'Umbria', 'Umbria', 'Perugia', 'centro'],
  ['11', 'IT-57', 'Marche', 'Marche', 'Ancona', 'centro'],
  ['12', 'IT-62', 'Lazio', 'Lazio', 'Roma', 'centro'],
  ['13', 'IT-65', 'Abruzzo', 'Abruzzo', "L'Aquila", 'sud'],
  ['14', 'IT-67', 'Molise', 'Molise', 'Campobasso', 'sud'],
  ['15', 'IT-72', 'Campania', 'Campania', 'Napoli', 'sud'],
  ['16', 'IT-75', 'Puglia', 'Apulia', 'Bari', 'sud'],
  ['17', 'IT-77', 'Basilicata', 'Basilicata', 'Potenza', 'sud'],
  ['18', 'IT-78', 'Calabria', 'Calabria', 'Catanzaro', 'sud'],
  ['19', 'IT-82', 'Sicilia', 'Sicily', 'Palermo', 'isole'],
  ['20', 'IT-88', 'Sardegna', 'Sardinia', 'Cagliari', 'isole'],
].map(([istat, code, name, nameEn, capital, area]) => ({ code, istat, name, nameEn, capital, area }));

const PROVINCE_NAMES = {
  AO: 'Aosta',
  BZ: 'Bolzano',
};
const PROVINCE_ALIASES = {
  AO: ["Valle d'Aosta/Vallée d'Aoste", 'Valle d’Aosta'],
  BZ: ['Bolzano/Bozen', 'Bozen', 'Alto Adige', 'Südtirol'],
  RE: ['Reggio Emilia'],
  MB: ['Monza e Brianza', 'Monza'],
  PU: ['Pesaro-Urbino'],
  MS: ['Massa Carrara'],
  FC: ['Forlì Cesena', 'Forli-Cesena'],
  OT: ['Gallura', 'Olbia-Tempio'],
  VS: ['Medio Campidano'],
  CI: ['Carbonia-Iglesias', 'Sulcis'],
};

// ── Load source ──────────────────────────────────────────────────
fs.mkdirSync(CACHE, { recursive: true });
const cacheFile = path.join(CACHE, 'provinces.topo.json');
if (!fs.existsSync(cacheFile)) {
  console.log('Downloading', SOURCE);
  const res = await fetch(SOURCE);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  fs.writeFileSync(cacheFile, Buffer.from(await res.arrayBuffer()));
}
const source = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));

// Decode quantized arcs and project them into the v1 frame.
const { scale: [sx, sy], translate: [tx, ty] } = source.transform;
const projected = {
  type: 'Topology',
  objects: source.objects,
  arcs: source.arcs.map((arc) => {
    let x = 0, y = 0;
    return arc.map(([dx, dy]) => {
      x += dx; y += dy;
      return project([x * sx + tx, y * sy + ty]);
    });
  }),
};

// San Marino and Vatican City are the holes of the merged Italian territory.
// Protect their arcs so simplification can't collapse them.
const all = topo.mergeArcs(projected, projected.objects.provinces.geometries);
const enclaveArcs = new Set();
const enclaves = {};
const ENCLAVES = { SM: [12.45, 43.94], VA: [12.453, 41.903] };
for (const polygon of all.arcs) {
  for (const ring of polygon.slice(1)) {
    const coords = topo.feature(projected, { type: 'Polygon', arcs: [ring] }).geometry.coordinates[0];
    const [cx, cy] = centroid(coords);
    for (const [code, lonlat] of Object.entries(ENCLAVES)) {
      const [px, py] = project(lonlat);
      if (Math.hypot(cx - px, cy - py) < 3) {
        enclaves[code] = ring;
        for (const a of ring) enclaveArcs.add(a < 0 ? ~a : a);
      }
    }
  }
}
for (const code of Object.keys(ENCLAVES)) if (!enclaves[code]) throw new Error(`Enclave ${code} not found`);

const pre = presimplify(projected, planarTriangleArea);
for (const i of enclaveArcs) for (const p of pre.arcs[i]) p[2] = Infinity;
const simple = simplify(pre, TOLERANCE);

// ── Geometry helpers ─────────────────────────────────────────────
function ringArea(r) {
  let a = 0;
  for (let i = 0, n = r.length; i < n; i++) {
    const [x1, y1] = r[i], [x2, y2] = r[(i + 1) % n];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}
function centroid(r) {
  let x = 0, y = 0;
  for (const p of r) { x += p[0]; y += p[1]; }
  return [x / r.length, y / r.length];
}
const polygonsOf = (g) => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates);
const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;

function bbox(polygons) {
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  for (const poly of polygons) for (const [x, y] of poly[0]) {
    if (x < b[0]) b[0] = x; if (y < b[1]) b[1] = y;
    if (x > b[2]) b[2] = x; if (y > b[3]) b[3] = y;
  }
  return b.map((v) => round(v));
}

function labelPoint(polygons) {
  const largest = polygons.reduce((a, b) => (Math.abs(ringArea(b[0])) > Math.abs(ringArea(a[0])) ? b : a));
  const p = polylabel(largest, 0.25);
  return [round(p[0]), round(p[1])];
}

/** Encodes polygons as a compact relative SVG path on an integer grid (viewBox units × GRID). */
function encode(polygons, open = false) {
  let out = '';
  let cx = 0, cy = 0;
  const num = (v) => { out += (v >= 0 && out && !'mz'.includes(out[out.length - 1]) ? ' ' : '') + v; };
  for (const poly of polygons) {
    for (const ring of poly) {
      const pts = [];
      for (const [x, y] of ring) {
        const q = [Math.round(x * GRID), Math.round(y * GRID)];
        const last = pts[pts.length - 1];
        if (!last || last[0] !== q[0] || last[1] !== q[1]) pts.push(q);
      }
      if (!open && pts.length > 1 && pts[0][0] === pts.at(-1)[0] && pts[0][1] === pts.at(-1)[1]) pts.pop();
      if (pts.length < (open ? 2 : 3)) continue;
      out += 'm';
      num(pts[0][0] - cx); num(pts[0][1] - cy);
      for (let i = 1; i < pts.length; i++) {
        num(pts[i][0] - pts[i - 1][0]); num(pts[i][1] - pts[i - 1][1]);
      }
      if (open) [cx, cy] = pts.at(-1);
      else { out += 'z'; [cx, cy] = pts[0]; }
    }
  }
  return out;
}

function shape(geometry) {
  const polygons = polygonsOf(geometry);
  return { d: encode(polygons), label: labelPoint(polygons), bbox: bbox(polygons) };
}

// ── Build features ───────────────────────────────────────────────
const geoms = simple.objects.provinces.geometries;

const provinceMeta = [];
const provinceShapes = {};
for (const g of [...geoms].sort((a, b) => a.properties.prov_name.localeCompare(b.properties.prov_name, 'it'))) {
  const p = g.properties;
  const region = REGIONS.find((r) => r.istat === p.reg_istat_code);
  const code = p.prov_acr;
  provinceMeta.push({
    code,
    istat: p.prov_istat_code,
    name: PROVINCE_NAMES[code] ?? p.prov_name,
    ...(PROVINCE_NAMES[code] ? { officialName: p.prov_name } : {}),
    region: region.name,
    regionCode: region.code,
    type: p.prov_tipo_uts,
    ...(PROVINCE_ALIASES[code] ? { aliases: PROVINCE_ALIASES[code] } : {}),
  });
  provinceShapes[code] = shape(topo.feature(simple, g).geometry);
}

const regionShapes = {};
for (const r of REGIONS) {
  const members = geoms.filter((g) => g.properties.reg_istat_code === r.istat);
  regionShapes[r.code] = shape(topo.merge(simple, members));
}

const foreignShapes = {};
for (const [code, ring] of Object.entries(enclaves)) {
  const coords = topo.feature(simple, { type: 'Polygon', arcs: [ring] }).geometry.coordinates;
  foreignShapes[code] = shape({ type: 'Polygon', coordinates: coords });
}
{
  const legacy = fs.readFileSync(path.join(ROOT, 'scripts', 'corsica.v1.txt'), 'utf8').trim();
  const rings = parseRelativePath(legacy).map((r) => [r]);
  foreignShapes['FR-H'] = shape({ type: 'MultiPolygon', coordinates: rings });
}

// Region borders drawn over the province map.
const regionOf = (g) => g.properties.reg_istat_code;
const regionBorders = topo.mesh(simple, simple.objects.provinces, (a, b) => a !== b && regionOf(a) !== regionOf(b));
const bordersD = encode(regionBorders.coordinates.map((line) => [line]), true);

// ── Emit ─────────────────────────────────────────────────────────
const header = `// Generated by scripts/build-geo.mjs — do not edit.
// Boundaries: ISTAT (CC-BY 4.0) via openpolis/geojson-italy.
`;
const json = (v) => JSON.stringify(v);
const shapesTs = (name, shapes) =>
  `export const ${name}: Record<string, AreaShape> = {\n${Object.entries(shapes)
    .map(([k, s]) => `  ${json(k)}: { d: ${json(s.d)}, label: ${json(s.label)}, bbox: ${json(s.bbox)} },`)
    .join('\n')}\n};\n`;

const files = {
  'regions.meta.ts': `${header}import type { RegionInfo } from '../types';

export const REGIONS: readonly RegionInfo[] = [
${REGIONS.map((r) => `  ${json(r)},`).join('\n')}
];
`,
  'frame.ts': `${header}
/** Path coordinates are integers on a grid of 1/${GRID} of the viewBox unit. */
export const GRID = ${GRID};
/** Size of the full map in viewBox units. */
export const FRAME = { width: ${FRAME.w}, height: ${FRAME.h} } as const;
`,
  'regions.geo.ts': `${header}import type { AreaShape } from '../types';

${shapesTs('REGION_SHAPES', regionShapes)}`,
  'foreign.geo.ts': `${header}import type { AreaShape } from '../types';

/** San Marino, Vatican City and Corsica. */
${shapesTs('FOREIGN_SHAPES', foreignShapes)}`,
  'provinces.meta.ts': `${header}import type { ProvinceInfo } from '../types';

export const PROVINCES: readonly ProvinceInfo[] = [
${provinceMeta.map((p) => `  ${json(p)},`).join('\n')}
];
`,
  'provinces.geo.ts': `${header}import type { AreaShape } from '../types';

${shapesTs('PROVINCE_SHAPES', provinceShapes)}
/** Borders between regions, to overlay on the province map. */
export const REGION_BORDERS = ${json(bordersD)};
`,
};

fs.mkdirSync(OUT, { recursive: true });
for (const [name, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(OUT, name), content);
  console.log(name.padEnd(20), (Buffer.byteLength(content) / 1024).toFixed(1).padStart(6), 'KB');
}
