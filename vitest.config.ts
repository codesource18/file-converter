import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@fileconverter/shared-types': path.resolve(__dirname, './packages/shared-types/src'),
      '@fileconverter/file-detection': path.resolve(__dirname, './packages/file-detection/src'),
      '@fileconverter/conversion-core': path.resolve(__dirname, './packages/conversion-core/src'),
      'pdf-lib': path.resolve(__dirname, './packages/conversion-core/node_modules/pdf-lib'),
    },
  },
});
