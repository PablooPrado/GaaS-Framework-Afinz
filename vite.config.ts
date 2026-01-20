import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/GaaS-Framework-Afinz/',
  server: {
    port: 3000,
    open: true,
    host: '0.0.0.0'
  }
})

