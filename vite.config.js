import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Code splitting configuration
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks - split large dependencies
          'vendor-react': ['react', 'react-dom'],
          'vendor-dates': ['date-fns'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-icons': ['lucide-react'],
          'vendor-flow': ['@xyflow/react'],
          'vendor-excel': ['exceljs'],
        }
      }
    },
    // Increase chunk warning limit (optional)
    chunkSizeWarningLimit: 600
  }
})
