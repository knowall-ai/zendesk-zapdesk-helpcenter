import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/main.jsx',
      name: 'ZapdeskApp',
      fileName: 'zapdesk-app.bundle',
      formats: ['umd']
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
        entryFileNames: 'zapdesk-app.bundle.js'
      }
    },
    outDir: '../theme-copenhagen/assets',
    emptyOutDir: false,
    cssCodeSplit: false
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  }
})
