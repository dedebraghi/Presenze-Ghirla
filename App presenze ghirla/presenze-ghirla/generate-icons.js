import fs from 'fs';

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#1e3a8a" rx="100"/>
  <text x="256" y="320" font-size="220" text-anchor="middle" fill="#ea580c">🏠</text>
</svg>`;

fs.writeFileSync('public/pwa-192x192.svg', svgContent);
fs.writeFileSync('public/pwa-512x512.svg', svgContent);
console.log('PWA icons created successfully');
