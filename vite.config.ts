// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/ai-content-detector/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
<<<<<<< HEAD
})
=======
})
>>>>>>> 711ad653f2e255eece8f86d19a23bd00ad15a69e
