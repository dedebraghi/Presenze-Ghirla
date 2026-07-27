const GOOGLE_CLIENT_ID = '1074408356793-pkc3feqdperbcicgnfj9eabgapi0u4nv.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

export interface GoogleCalendarToken {
  access_token: string;
  expires_at: number;
}

const TOKEN_KEY = 'ghirla_gcal_token_v1';

export function getStoredGoogleToken(): GoogleCalendarToken | null {
  const saved = localStorage.getItem(TOKEN_KEY);
  if (!saved) return null;
  try {
    const parsed: GoogleCalendarToken = JSON.parse(saved);
    if (Date.now() > parsed.expires_at) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveGoogleToken(token: string, expiresInSeconds: number) {
  const tokenData: GoogleCalendarToken = {
    access_token: token,
    expires_at: Date.now() + expiresInSeconds * 1000,
  };
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokenData));
}

export function logoutGoogleCalendar() {
  localStorage.removeItem(TOKEN_KEY);
}

// Inizializza l'autenticazione OAuth Google via Token Client
export function requestGoogleCalendarAccess(onSuccess: (token: string) => void, onError: (err: any) => void) {
  if (typeof window === 'undefined') return;

  const windowAny = window as any;
  if (!windowAny.google || !windowAny.google.accounts) {
    alert("L'SDK di Google si sta ancora caricando o è stato bloccato dal browser. Riprova tra un secondo.");
    return;
  }

  const tokenClient = windowAny.google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: SCOPES,
    callback: (response: any) => {
      if (response.error) {
        console.error('Google OAuth Error:', response);
        onError(response);
        return;
      }
      saveGoogleToken(response.access_token, response.expires_in);
      onSuccess(response.access_token);
    },
  });

  tokenClient.requestAccessToken();
}

interface PresenceEntryLike {
  date: string;
  personId: string;
  lunch: boolean;
  dinner: boolean;
  overnight: boolean;
}

interface PersonLike {
  id: string;
  name: string;
}

// Sincronizza un unico evento riassuntivo giornaliero su Google Calendar per la data specificata
export async function syncDailySummaryToGoogleCalendar(
  dateStr: string,
  allPresences: Record<string, PresenceEntryLike>,
  allPeople: PersonLike[]
) {
  const tokenObj = getStoredGoogleToken();
  if (!tokenObj) return; // Utente non ha connesso Google Calendar

  // Raccogli chi è presente a pranzo, cena, notte per questa data
  const lunchPeople: string[] = [];
  const dinnerPeople: string[] = [];
  const overnightPeople: string[] = [];

  allPeople.forEach(person => {
    const key = `${dateStr}_${person.id}`;
    const entry = allPresences[key];
    
    // Gestione presenze di default (Stefano ed Elena sono sempre presenti salvo diversa indicazione espressa)
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

  try {
    // 1. Cerca se esiste già l'evento riassuntivo per questa data sul Google Calendar dell'utente
    const listUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?q=${encodeURIComponent(eventSearchQuery)}&timeMin=${dateStr}T00:00:00Z&timeMax=${dateStr}T23:59:59Z`;

    const searchRes = await fetch(listUrl, {
      headers: {
        Authorization: `Bearer ${tokenObj.access_token}`,
      },
    });

    if (!searchRes.ok) {
      if (searchRes.status === 401) {
        logoutGoogleCalendar();
      }
      return;
    }

    const searchData = await searchRes.json();
    // Trova l'evento che inizia con 'Presenze Ghirla'
    const existingEvent = searchData.items && searchData.items.length > 0
      ? searchData.items.find((item: any) => item.summary && item.summary.includes('Presenze Ghirla'))
      : null;

    if (totalPresencesCount > 0) {
      // Formatta data leggibile per la descrizione (es. 28/07/2026)
      const parts = dateStr.split('-');
      const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;

      const eventSummary = `Presenze Ghirla: 🍝 ${lunchPeople.length} | 🍷 ${dinnerPeople.length} | 🛏️ ${overnightPeople.length}`;
      
      const descriptionLines = [
        `🏠 RIEPILOGO PRESENZE GHIRLA - ${formattedDate}`,
        '',
        `🍝 PRANZO (${lunchPeople.length}): ${lunchPeople.length > 0 ? lunchPeople.join(', ') : 'Nessuno'}`,
        `🍷 CENA (${dinnerPeople.length}): ${dinnerPeople.length > 0 ? dinnerPeople.join(', ') : 'Nessuno'}`,
        `🛏️ NOTTE (${overnightPeople.length}): ${overnightPeople.length > 0 ? overnightPeople.join(', ') : 'Nessuno'}`
      ];

      const eventBody = {
        summary: eventSummary,
        description: descriptionLines.join('\n'),
        location: 'Casa Ghirla, Valganna',
        start: { dateTime: startDateTime, timeZone },
        end: { dateTime: endDateTime, timeZone },
      };

      if (existingEvent) {
        // Aggiorna l'evento riassuntivo esistente
        await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${existingEvent.id}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${tokenObj.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventBody),
        });
      } else {
        // Crea nuovo evento riassuntivo
        await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokenObj.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventBody),
        });
      }
    } else if (existingEvent) {
      // Se le presenze per questo giorno sono state azzerate, elimina l'evento riassuntivo
      await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${existingEvent.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${tokenObj.access_token}`,
        },
      });
    }
  } catch (err) {
    console.error('Errore durante la sincronizzazione riassuntiva con Google Calendar API:', err);
  }
}

// Mantenuto per retrocompatibilità se necessario
export async function syncPresenceToGoogleCalendar(
  _dateStr?: string,
  _personName?: string,
  _hasPresence?: boolean,
  _details?: string
) {
  // Deprecato in favore di syncDailySummaryToGoogleCalendar
}

