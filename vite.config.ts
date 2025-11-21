
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist', // The folder where the built files will go
    emptyOutDir: true,
  },
  root: 'src', // Tell Vite that our source code is in the 'src' folder
  publicDir: '../public'
})
