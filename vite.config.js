import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.js',
        vite: {
          build: {
            outDir: '.vite/build',
            rollupOptions: {
              external: ['electron']
            }
          }
        }
      },
      {
        entry: 'electron/preload.js',
        onstart(options) {
          options.reload()
        },
        vite: {
          build: {
            outDir: '.vite/build',
            rollupOptions: {
              external: ['electron']
            }
          }
        }
      }
    ])
  ],
  base: './',
  build: {
    outDir: '.vite/build/renderer',
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})

