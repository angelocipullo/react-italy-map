import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'node:path';

const PACKAGE_ALIAS = [
    { find: /^react-italy-map\/provinces$/, replacement: resolve('src/provinces.ts') },
    { find: /^react-italy-map$/, replacement: resolve('src/index.ts') },
];

// `vite` / `vite build --mode demo` → showcase site (demo/)
// `vite build`                      → the npm library (dist/)
export default defineConfig(({ command, mode }) => {
    if (command === 'serve' || mode === 'demo') {
        return {
            plugins: [react()],
            base: './',
            // Demo and examples import the package by name, straight from the sources.
            resolve: { alias: PACKAGE_ALIAS },
            build: { outDir: 'demo-dist' },
        };
    }
    return {
        plugins: [
            react(),
            dts({ include: ['src'], exclude: ['src/**/*.test.*'], tsconfigPath: './tsconfig.json' }),
        ],
        build: {
            target: 'es2019',
            sourcemap: false,
            minify: false, // consumers minify; readable code is easier to debug
            lib: {
                entry: {
                    index: resolve('src/index.ts'),
                    provinces: resolve('src/provinces.ts'),
                },
                formats: ['es', 'cjs'],
                fileName: (format, name) => `${name}.${format === 'es' ? 'js' : 'cjs'}`,
            },
            rollupOptions: {
                external: ['react', 'react-dom', 'react/jsx-runtime'],
                output: {
                    // One file per module, so bundlers can drop what isn't imported.
                    preserveModules: true,
                    preserveModulesRoot: 'src',
                    banner: (chunk) => (/(MapView|ItalyMap|ItalyProvincesMap|ItalyDrilldownMap|Legend)$/.test(chunk.name) ? '"use client";' : ''),
                },
            },
        },
    };
});
