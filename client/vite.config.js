import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// During development, forward /api requests to the Express backend on :5000
// so the frontend can call the API without CORS or hard-coded URLs.
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
