import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      // Cegah Vite me-reload browser saat db.json diperbarui oleh json-server (agar step 5 dapat muncul)
      ignored: ['**/db.json'],
    },
  },
})
