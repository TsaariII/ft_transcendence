import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    open: true,
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': 'http://backend:3000',  // NOTE! change back to https!!!!! 
    },
  },

  build: {
    outDir: 'dist',
    assetsDir: 'assets',   // put JS/CSS/images in /assets/
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
});
	