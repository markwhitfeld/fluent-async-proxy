/// <reference types="vitest" />

import { resolve } from 'path';
import { defineConfig } from 'vite';
// import dts from "vite-plugin-dts";
export default defineConfig((config) => ({
  publicDir: false,
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      sourcemap: false,
      brotliSize: true,
      entry: resolve(__dirname, 'src/main.ts'),
      name: 'httpJS',
      // the proper extensions will be added
      fileName: 'test-httpjs',
      formats: ['es', 'umd', 'iife'],
      chunkSizeWarningLimit: 500,
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {},
      },
    },
    outDir: 'httpJS',
  },
  plugins: [
    // rollupNodePolyFill(),
  ],
  // resolve: {
  //   alias: {
  //     "./runtimeConfig": "./runtimeConfig.browser", // <-- Fix from above
  //   },
  // },
}));
