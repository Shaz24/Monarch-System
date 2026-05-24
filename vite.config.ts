import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'MONARCH SYSTEM',
        short_name: 'MONARCH',
        description: 'Full-Stack RPG Productivity App',
        theme_color: '#030408',
        background_color: '#030408',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || id.includes('d3')) {
              return 'recharts';
            }
            if (id.includes('framer-motion')) {
              return 'framer-motion';
            }
            if (id.includes('lucide-react')) {
              return 'lucide-react';
            }
            if (id.includes('@supabase') || id.includes('supabase-js')) {
              return 'supabase';
            }
            return 'vendor';
          }
        }
      }
    }
  }
});
