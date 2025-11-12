// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      '/verify_payment': {
        target: 'http://127.0.0.1:5000', // Your Python backend
        changeOrigin: true,
        secure: false,
      }
    }
  }
})