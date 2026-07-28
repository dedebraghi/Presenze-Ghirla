import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
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

serve(async (req) => {
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

    const ALL_PEOPLE = [
      { id: 'stefano', name: 'Stefano' },
      { id: 'elena', name: 'Elena' },
      { id: 'davide', name: 'Davide' },
      { id: 'marco', name: 'Marco' },
      { id: 'chiara', name: 'Chiara' },
      { id: 'francesca', name: 'Francesca' },
      { id: 'alessandro', name: 'Alessandro' },
    ];

    const targetDates: string[] = Array.isArray(dateStrs) ? dateStrs : [dateStrs];

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

      const totalPresencesCount = lunchPeople.length + dinnerPeople.length + overnightPeople.length;
      const eventSearchQuery = 'Presenze Ghirla';
      const startDateTime = `${dateStr}T09:00:00`;
      const endDateTime = `${dateStr}T22:00:00`;
      const timeZone = 'Europe/Rome';

      const encodedCalendarId = encodeURIComponent(calendarId);
      const listUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodedCalendarId}/events?q=${encodeURIComponent(eventSearchQuery)}&timeMin=${dateStr}T00:00:00Z&timeMax=${dateStr}T23:59:59Z`;

      const searchRes = await fetch(listUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!searchRes.ok) {
        console.error('Failed search in Google Calendar API:', await searchRes.text());
        continue;
      }

      const searchData = await searchRes.json();
      const existingEvent = searchData.items && searchData.items.length > 0
        ? searchData.items.find((item: any) => item.summary && item.summary.includes('Presenze Ghirla'))
        : null;

      if (totalPresencesCount > 0) {
        const parts = dateStr.split('-');
        const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;

        const eventSummary = `Presenze Ghirla: 🍝 ${lunchPeople.length} | 🍷 ${dinnerPeople.length} | 🛏️ ${overnightPeople.length}`;
        const descriptionLines = [
          `🏠 RIEPILOGO PRESENZE GHIRLA - ${formattedDate}`,
          '',
          `🍝 PRANZO (${lunchPeople.length}): ${lunchPeople.length > 0 ? lunchPeople.join(', ') : 'Nessuno'}`,
          `🍷 CENA (${dinnerPeople.length}): ${dinnerPeople.length > 0 ? dinnerPeople.join(', ') : 'Nessuno'}`,
          `🛏️ NOTTE (${overnightPeople.length}): ${overnightPeople.length > 0 ? overnightPeople.join(', ') : 'Nessuno'}`,
        ];

        const eventBody = {
          summary: eventSummary,
          description: descriptionLines.join('\n'),
          location: 'Casa Ghirla, Valganna',
          start: { dateTime: startDateTime, timeZone },
          end: { dateTime: endDateTime, timeZone },
        };

        if (existingEvent) {
          await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodedCalendarId}/events/${existingEvent.id}`, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventBody),
          });
        } else {
          await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodedCalendarId}/events`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventBody),
          });
        }
      } else if (existingEvent) {
        await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodedCalendarId}/events/${existingEvent.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
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
