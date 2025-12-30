import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    cli: 'src/cli.ts',
    index: 'src/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  minify: false,
  sourcemap: true,
  shims: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
});
