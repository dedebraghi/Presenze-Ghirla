import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import url from 'url'

// Helper function to generate ICS file content dynamically from data
function generateIcs(presences: any, personIdFilter?: string) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Casa Ghirla//Presenze Famiglia//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  if (personIdFilter) {
    lines.push(`X-WR-CALNAME:Presenze Ghirla - ${personIdFilter}`);
  } else {
    lines.push('X-WR-CALNAME:Presenze Casa Ghirla');
  }

  // Map person ID to Display Name
  const PEOPLE_NAMES: Record<string, string> = {
    'stefano': 'Stefano', 'elena': 'Elena',
    'luigi': 'Luigi', 'elisabetta': 'Elisabetta',
    'luca': 'Luca', 'eleonora': 'Eleonora',
    'cecilia': 'Cecilia', 'davide': 'Davide',
    'giacomo': 'Giacomo', 'maria_o': 'Maria O.', 'peppo': 'Peppo', 'marghe': 'Marghe', 'fiammi': 'Fiammi', 'michi': 'Michi',
    'pietro': 'Pietro', 'maria_r': 'Maria R.', 'monicotti': 'Monicotti', 'isa': 'Isa',
    'caterina': 'Caterina', 'mario': 'Mario'
  };

  const entries = Object.values(presences).filter((e: any) => {
    if (!e.lunch && !e.dinner && !e.overnight) return false;
    if (personIdFilter && e.personId !== personIdFilter) return false;
    return true;
  });

  entries.forEach((entry: any) => {
    const personName = PEOPLE_NAMES[entry.personId] || entry.personId;
    const dateFormatted = entry.date.replace(/-/g, '');
    
    let summaryParts = [];
    if (entry.lunch) summaryParts.push('Pranzo ☀️');
    if (entry.dinner) summaryParts.push('Cena 🌙');
    if (entry.overnight) summaryParts.push('Notte 🛏️');

    lines.push(
      'BEGIN:VEVENT',
      `UID:ghirla-${entry.date}-${entry.personId}@casaghirla.local`,
      `DTSTART;VALUE=DATE:${dateFormatted}`,
      `SUMMARY:Ghirla: ${personName} (${summaryParts.join(', ')})`,
      `DESCRIPTION:Presenza a Casa Ghirla di ${personName}. Pasti: ${summaryParts.join(', ')}`,
      'LOCATION:Casa Ghirla, Valganna',
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

const localDbPlugin = () => ({
  name: 'local-db-plugin',
  configureServer(server: any) {
    server.middlewares.use((req: any, res: any, next: any) => {
      const parsedUrl = url.parse(req.url || '', true);
      const pathname = parsedUrl.pathname;
      const query = parsedUrl.query;

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
      } else if (pathname === '/api/calendar.ics' && req.method === 'GET') {
        const filePath = path.join(__dirname, 'presences.json');
        let presences = {};
        if (fs.existsSync(filePath)) {
          try {
            presences = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          } catch (e) {}
        }
        const personId = query.personId as string;
        const icsContent = generateIcs(presences, personId);
        
        res.setHeader('Content-Type', 'text/calendar;charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="calendar.ics"');
        res.end(icsContent);
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
