import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react({ jsxRuntime: 'classic' })],
  build: {
    manifest: true,
    commonjsOptions: {
      include: [/react-tea-cup/, /node_modules/],
    },
  },
  optimizeDeps: {
    include: ['react-tea-cup'],
  },
});
