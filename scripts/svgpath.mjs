// Minimal parser for the relative "m … z" paths used in scripts/corsica.txt.
export function parseRelativePath(d) {
  const rings = [];
  const tokens = d.match(/[mzMZlL]|[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/g) ?? [];
  let cx = 0, cy = 0, sx = 0, sy = 0, ring = null, cmd = null, first = true;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (/^[a-zA-Z]$/.test(t)) {
      cmd = t;
      if (t === 'z' || t === 'Z') {
        if (ring) rings.push(ring);
        ring = null; cx = sx; cy = sy;
      }
      continue;
    }
    const x = Number(t), y = Number(tokens[++i]);
    if (cmd === 'm' || cmd === 'M') {
      if (ring) rings.push(ring);
      if (cmd === 'M' || first) { cx = x; cy = y; } else { cx += x; cy += y; }
      sx = cx; sy = cy; ring = [[cx, cy]]; first = false;
      cmd = cmd === 'm' ? 'l' : 'L';
    } else if (cmd === 'l') { cx += x; cy += y; ring.push([cx, cy]); }
    else if (cmd === 'L') { cx = x; cy = y; ring.push([cx, cy]); }
  }
  if (ring) rings.push(ring);
  return rings;
}
