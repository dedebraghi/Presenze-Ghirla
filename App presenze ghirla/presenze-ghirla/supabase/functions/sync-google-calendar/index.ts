import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getGoogleAccessToken(serviceAccount: any) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claimSet = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/calendar.events',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encodeBase64Url = (str: string) =>
    btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const encodedHeader = encodeBase64Url(JSON.stringify(header));
  const encodedClaim = encodeBase64Url(JSON.stringify(claimSet));
  const unsignedToken = `${encodedHeader}.${encodedClaim}`;

  const pemHeader = '-----BEGIN PRIVATE KEY-----';
  const pemFooter = '-----END PRIVATE KEY-----';
  const pemContents = serviceAccount.private_key
    .replace(pemHeader, '')
    .replace(pemFooter, '')
    .replace(/\s/g, '');

  const binaryDerString = atob(pemContents);
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }

  const key = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(unsignedToken)
  );

  const encodedSignature = encodeBase64Url(
    String.fromCharCode(...new Uint8Array(signature))
  );
  const jwt = `${unsignedToken}.${encodedSignature}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) {
    throw new Error('Google Auth Error: ' + JSON.stringify(tokenData));
  }
  return tokenData.access_token;
}

const ALL_PEOPLE = [
  { id: 'stefano', name: 'Stefano' },
  { id: 'elena', name: 'Elena' },
  { id: 'luigi', name: 'Luigi' },
  { id: 'elisabetta', name: 'Elisabetta' },
  { id: 'luca', name: 'Luca' },
  { id: 'eleonora', name: 'Eleonora' },
  { id: 'cecilia', name: 'Cecilia' },
  { id: 'davide', name: 'Davide' },
  { id: 'giacomo', name: 'Giacomo' },
  { id: 'maria_o', name: 'Maria O.' },
  { id: 'peppo', name: 'Peppo' },
  { id: 'marghe', name: 'Marghe' },
  { id: 'fiammi', name: 'Fiammi' },
  { id: 'michi', name: 'Michi' },
  { id: 'pietro', name: 'Pietro' },
  { id: 'maria_r', name: 'Maria R.' },
  { id: 'monicotti', name: 'Monicotti' },
  { id: 'isa', name: 'Isa' },
  { id: 'caterina', name: 'Caterina' },
  { id: 'mario', name: 'Mario' },
];

// Ricorrenze annuali (Compleanni, Onomastici, Anniversari)
const SPECIAL_OCCASIONS = [
  // GENNAIO
  { date: '01-08', type: 'birthday', title: '🎂 Compleanno Stefano' },
  { date: '01-19', type: 'birthday', title: '🎂 Compleanno Luigi' },
  { date: '01-19', type: 'nameday', title: '😇 Onomastico Mario' },
  { date: '01-20', type: 'birthday', title: '🎂 Compleanno Monicotti' },
  { date: '01-31', type: 'birthday', title: '🎂 Compleanno Caterina' },

  // FEBBRAIO
  { date: '02-16', type: 'birthday', title: '🎂 Compleanno Maria R.' },
  { date: '02-22', type: 'anniversary', title: '💍 Anniversario Maria R. & Pietro' },

  // MARZO
  { date: '03-01', type: 'birthday', title: '🎂 Compleanno Davide' },
  { date: '03-19', type: 'nameday', title: '😇 Onomastico Peppo' },
  { date: '03-28', type: 'birthday', title: '🎂 Compleanno Isa' },

  // APRILE
  { date: '04-03', type: 'birthday', title: '🎂 Compleanno Peppo' },
  { date: '04-29', type: 'nameday', title: '😇 Onomastico Caterina' },

  // MAGGIO
  { date: '05-12', type: 'birthday', title: '🎂 Compleanno Mario' },
  { date: '05-18', type: 'birthday', title: '🎂 Compleanno Giacomo' },

  // GIUGNO
  { date: '06-04', type: 'nameday', title: '😇 Onomastico Isa' },
  { date: '06-11', type: 'birthday', title: '🎂 Compleanno Elisabetta' },
  { date: '06-21', type: 'nameday', title: '😇 Onomastico Luigi' },
  { date: '06-22', type: 'anniversary', title: '💍 Anniversario Giacomo & Maria O.' },
  { date: '06-29', type: 'nameday', title: '😇 Onomastico Pietro' },

  // LUGLIO
  { date: '07-09', type: 'birthday', title: '🎂 Compleanno Luca' },
  { date: '07-20', type: 'nameday', title: '😇 Onomastico Marghe' },
  { date: '07-25', type: 'nameday', title: '😇 Onomastico Giacomo' },

  // AGOSTO
  { date: '08-06', type: 'birthday', title: '🎂 Compleanno Pietro' },
  { date: '08-12', type: 'birthday', title: '🎂 Compleanno Maria O.' },
  { date: '08-18', type: 'nameday', title: '😇 Onomastico Elena' },
  { date: '08-27', type: 'nameday', title: '😇 Onomastico Monicotti' },

  // SETTEMBRE
  { date: '09-06', type: 'birthday', title: '🎂 Compleanno Marghe' },
  { date: '09-06', type: 'anniversary', title: '💍 Anniversario Cecilia & Davide' },
  { date: '09-12', type: 'birthday', title: '🎂 Compleanno Elena' },
  { date: '09-12', type: 'nameday', title: '😇 Onomastico Maria' },
  { date: '09-29', type: 'nameday', title: '😇 Onomastico Michi' },

  // OTTOBRE
  { date: '10-18', type: 'nameday', title: '😇 Onomastico Luca' },
  { date: '10-19', type: 'anniversary', title: '💍 Anniversario Elena & Stefano' },

  // NOVEMBRE
  { date: '11-01', type: 'nameday', title: '😇 Onomastico Fiammi' },
  { date: '11-17', type: 'nameday', title: '😇 Onomastico Elisabetta' },
  { date: '11-22', type: 'birthday', title: '🎂 Compleanno Cecilia' },
  { date: '11-22', type: 'nameday', title: '😇 Onomastico Cecilia' },

  // DICEMBRE
  { date: '12-26', type: 'nameday', title: '😇 Onomastico Stefano' },
  { date: '12-29', type: 'nameday', title: '😇 Onomastico Davide' },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { dateStrs } = await req.json();
    const serviceAccountKeyRaw = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
    const calendarId = Deno.env.get('GOOGLE_CALENDAR_ID');

    if (!serviceAccountKeyRaw || !calendarId) {
      return new Response(
        JSON.stringify({ error: 'Missing GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_CALENDAR_ID environment variables' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const serviceAccount = JSON.parse(serviceAccountKeyRaw);
    const accessToken = await getGoogleAccessToken(serviceAccount);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: allPresencesData } = await supabase.from('presences').select('*');

    const allPresences: Record<string, any> = {};
    if (allPresencesData) {
      allPresencesData.forEach((row: any) => {
        const key = `${row.date}_${row.person_id}`;
        allPresences[key] = {
          date: row.date,
          personId: row.person_id,
          lunch: row.lunch,
          dinner: row.dinner,
          overnight: row.overnight,
        };
      });
    }

    const targetDates: string[] = Array.isArray(dateStrs) ? dateStrs : [dateStrs];
    const encodedCalendarId = encodeURIComponent(calendarId);

    for (const dateStr of targetDates) {
      if (!dateStr) continue;

      const lunchPeople: string[] = [];
      const dinnerPeople: string[] = [];
      const overnightPeople: string[] = [];

      ALL_PEOPLE.forEach((person) => {
        const key = `${dateStr}_${person.id}`;
        const entry = allPresences[key];

        const isDefaultAlwaysPresent = person.id === 'stefano' || person.id === 'elena';
        const lunch = entry ? entry.lunch : isDefaultAlwaysPresent;
        const dinner = entry ? entry.dinner : isDefaultAlwaysPresent;
        const overnight = entry ? entry.overnight : isDefaultAlwaysPresent;

        if (lunch) lunchPeople.push(person.name);
        if (dinner) dinnerPeople.push(person.name);
        if (overnight) overnightPeople.push(person.name);
      });

      // Aggiungi eventuali ospiti ed esterni registrati per questa data
      if (allPresencesData) {
        allPresencesData
          .filter((row: any) => row.date === dateStr && row.person_id && row.person_id.startsWith('guest_'))
          .forEach((row: any) => {
            const rawParts = row.person_id.replace(/^guest_/, '').split('_');
            if (rawParts.length > 1 && /^\d+$/.test(rawParts[rawParts.length - 1])) {
              rawParts.pop();
            }
            const knownFamilyIds = ['stefano-elena', 'luigi-eli', 'luca-eleonora', 'cecilia-davide', 'giacomo-maria', 'pietro-maria', 'caterina-mario', 'ospiti'];
            const nameParts = rawParts.filter((p: string) => !knownFamilyIds.includes(p));
            const guestNameClean = (nameParts.length > 0 ? nameParts : ['Ospite'])
              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ') + ' (Ospite)';

            if (row.lunch && !lunchPeople.includes(guestNameClean)) lunchPeople.push(guestNameClean);
            if (row.dinner && !dinnerPeople.includes(guestNameClean)) dinnerPeople.push(guestNameClean);
            if (row.overnight && !overnightPeople.includes(guestNameClean)) overnightPeople.push(guestNameClean);
          });
      }

      const totalPresencesCount = lunchPeople.length + dinnerPeople.length + overnightPeople.length;
      const startDateTime = `${dateStr}T09:00:00`;
      const endDateTime = `${dateStr}T22:00:00`;
      const timeZone = 'Europe/Rome';

      // Event ID deterministico unico basato sulla data (es. ghirla20260728)
      // Caratteri validi per ID Google Calendar: 0-9 e a-v (base32hex)
      const cleanDate = dateStr.replace(/-/g, '');
      const eventId = `ghirla${cleanDate}`;

      // 1. Cerca ed elimina qualsiasi vecchio evento duplicato presente per quel giorno
      const listUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodedCalendarId}/events?timeMin=${dateStr}T00:00:00Z&timeMax=${dateStr}T23:59:59Z`;
      const searchRes = await fetch(listUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.items && searchData.items.length > 0) {
          for (const item of searchData.items) {
            // Elimina vecchi eventi che non corrispondono all'ID deterministico unico o se presenze = 0
            if (totalPresencesCount === 0 || item.id !== eventId) {
              if (item.id.startsWith('ghirla') || (item.summary && (item.summary.includes('Ghirla') || item.summary.includes('Onomastico') || item.summary.includes('Compleanno') || item.summary.includes('Anniversario')))) {
                await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodedCalendarId}/events/${item.id}`, {
                  method: 'DELETE',
                  headers: { Authorization: `Bearer ${accessToken}` },
                }).catch(() => {});
              }
            }
          }
        }
      }

      if (totalPresencesCount > 0) {
        const parts = dateStr.split('-');
        const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;

        // Verifica se ci sono ricorrenze speciali (Compleanni, Onomastici, Anniversari) per questa data
        const mmdd = dateStr.slice(5, 10);
        const occasions = SPECIAL_OCCASIONS.filter(o => o.date === mmdd);

        let eventPrefix = 'Presenze Ghirla';
        if (occasions.length > 0) {
          eventPrefix = occasions.map(o => o.title).join(' & ');
        }

        const eventSummary = `${eventPrefix}: 🍝 ${lunchPeople.length} | 🍷 ${dinnerPeople.length} | 🛏️ ${overnightPeople.length}`;
        const descriptionLines = [
          `🏠 RIEPILOGO PRESENZE GHIRLA - ${formattedDate}`,
          ...(occasions.length > 0 ? ['', `🎉 RICORRENZE OGGI: ${occasions.map(o => o.title).join(' | ')}`] : []),
          '',
          `🍝 PRANZO (${lunchPeople.length}): ${lunchPeople.length > 0 ? lunchPeople.join(', ') : 'Nessuno'}`,
          `🍷 CENA (${dinnerPeople.length}): ${dinnerPeople.length > 0 ? dinnerPeople.join(', ') : 'Nessuno'}`,
          `🛏️ NOTTE (${overnightPeople.length}): ${overnightPeople.length > 0 ? overnightPeople.join(', ') : 'Nessuno'}`,
        ];

        const eventBody = {
          id: eventId,
          summary: eventSummary,
          description: descriptionLines.join('\n'),
          location: 'Casa Ghirla, Valganna',
          start: { dateTime: startDateTime, timeZone },
          end: { dateTime: endDateTime, timeZone },
        };

        // Verifica se l'evento deterministico esiste già
        const checkUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodedCalendarId}/events/${eventId}`;
        const checkRes = await fetch(checkUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (checkRes.ok) {
          // Aggiorna completamente l'evento esistente
          await fetch(checkUrl, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventBody),
          });
        } else {
          // Crea l'evento con l'ID univoco
          await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodedCalendarId}/events`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventBody),
          });
        }
      } else {
        // Se 0 presenze, cancella anche direttamente tramite l'ID deterministico
        await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodedCalendarId}/events/${eventId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        }).catch(() => {});
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
