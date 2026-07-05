import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    port: 5173,
    host: '127.0.0.1',
    strictPort: true
  },
  build: {
    outDir: 'build'
  }
});