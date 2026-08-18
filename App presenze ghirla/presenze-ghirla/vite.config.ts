import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import url from 'url'

const localDbPlugin = () => ({
  name: 'local-db-plugin',
  configureServer(server: any) {
    server.middlewares.use((req: any, res: any, next: any) => {
      const parsedUrl = url.parse(req.url || '', true);
      const pathname = parsedUrl.pathname;

      if (pathname === '/api/presences') {
        const filePath = path.join(__dirname, 'presences.json');
        if (req.method === 'GET') {
          if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.end(data);
          } else {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({}));
          }
        } else if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', () => {
            fs.writeFileSync(filePath, body, 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
          });
        }
      } else {
        next();
      }
    });
  }
});

import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    localDbPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'Presenze Casa Ghirla',
        short_name: 'Ghirla',
        description: 'Gestione presenze e pasti per Casa Ghirla',
        theme_color: '#1e3a8a',
        background_color: '#1e3a8a',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/favicon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    host: true,
  }
})
