import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    exclude: ['backend/**', 'dist/**', 'node_modules/**']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return null

          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) return 'vendor-react'
          if (id.includes('@mui') || id.includes('@emotion')) return 'vendor-mui'
          if (id.includes('recharts') || id.includes('chart.js') || id.includes('react-chartjs-2')) return 'vendor-charts'
          if (id.includes('leaflet') || id.includes('react-leaflet')) return 'vendor-maps'
          if (id.includes('three')) return 'vendor-3d'

          return 'vendor-core'
        }
      }
    }
  }
})
