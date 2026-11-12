import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'virtual:pwa-register/react': '/src/test/pwa-register-mock.ts',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    // La suite completa renderiza la app entera varias veces y algunos flujos
    // esperan IndexedDB y cargas diferidas; 5 s por test es corto bajo carga.
    testTimeout: 20000,
    hookTimeout: 20000,
  },
})
