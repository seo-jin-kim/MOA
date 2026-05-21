import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost',
        changeOrigin: true,
      }
    }
  },
   build: {
    chunkSizeWarningLimit: 3000, // 3000kb(3MB)까지 경고 무시
  },
  
})
