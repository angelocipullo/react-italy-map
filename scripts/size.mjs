// Prints raw and gzip size of the bundles a consumer would load.
import fs from 'node:fs';
import { gzipSync } from 'node:zlib';
import { build } from 'vite';

const cases = {
    'ItalyMap': "import { ItalyMap } from './dist/index.js'; console.log(ItalyMap);",
    'ItalyProvincesMap': "import { ItalyProvincesMap } from './dist/provinces.js'; console.log(ItalyProvincesMap);",
    'ItalyDrilldownMap': "import { ItalyDrilldownMap } from './dist/provinces.js'; console.log(ItalyDrilldownMap);",
    'both + Legend': "import { ItalyMap, Legend } from './dist/index.js'; import { ItalyProvincesMap } from './dist/provinces.js'; console.log(ItalyMap, Legend, ItalyProvincesMap);",
    'findRegion only': "import { findRegion } from './dist/index.js'; console.log(findRegion);",
};
fs.mkdirSync('scripts/.cache', { recursive: true });
for (const [name, code] of Object.entries(cases)) {
    const entry = `scripts/.cache/size-entry.js`;
    fs.writeFileSync(entry, code.replaceAll('./dist', '../../dist'));
    const out = await build({
        logLevel: 'silent', configFile: false,
        build: { write: false, minify: true, lib: { entry, formats: ['es'], fileName: 'x' }, rollupOptions: { external: [/^react/] } },
    });
    const js = out[0].output.filter((o) => o.type === 'chunk').map((o) => o.code).join('');
    console.log(name.padEnd(20), `${(js.length / 1024).toFixed(1)} KB min`.padStart(14), `${(gzipSync(js).length / 1024).toFixed(1)} KB gzip`.padStart(14));
}
