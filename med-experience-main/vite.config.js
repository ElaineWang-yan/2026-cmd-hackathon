import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/login': 'http://localhost:8080',
      '/register': 'http://localhost:8080',
      '/create-post': 'http://localhost:8080',
    }
  }
})
