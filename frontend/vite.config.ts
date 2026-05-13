import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cwd } from 'node:process'

export default defineConfig({
  root: cwd(),
  plugins: [react(), tailwindcss()],
  server: {
    host: 'localhost',
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        ws: true,
      },
    },
  },
})
