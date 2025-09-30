import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react({ jsxRuntime: 'classic' })],
  build: {
    manifest: true,
    commonjsOptions: {
      include: [/tea-cup/, /node_modules/],
    },
    rollupOptions: {
      input: {
        samples: fileURLToPath(new URL('./index.html', import.meta.url)),
        samples2: fileURLToPath(new URL('./program-test.html', import.meta.url)),
      },
    },
  },
  optimizeDeps: {
    include: ['react-tea-cup'],
  },
});
