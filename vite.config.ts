import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig({
  plugins: [react()],
  base: '/ai-content-detector/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
