import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [react(), svgr()],

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
	