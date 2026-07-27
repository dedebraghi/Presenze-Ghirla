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

// Crea o rimuove eventi sul Google Calendar dell'utente connesso
export async function syncPresenceToGoogleCalendar(
  dateStr: string,
  personName: string,
  hasPresence: boolean,
  details: string
) {
  const tokenObj = getStoredGoogleToken();
  if (!tokenObj) return; // Utente non ha connesso Google Calendar

  const eventSummary = `Presenza a Ghirla - ${personName}`;
  const startDateTime = `${dateStr}T09:00:00`;
  const endDateTime = `${dateStr}T22:00:00`;
  const timeZone = 'Europe/Rome';

  try {
    // 1. Cerca se esiste già un evento per quel giorno e quella persona
    const listUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?q=${encodeURIComponent(eventSummary)}&timeMin=${dateStr}T00:00:00Z&timeMax=${dateStr}T23:59:59Z`;
    
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
    const existingEvent = searchData.items && searchData.items.length > 0 ? searchData.items[0] : null;

    if (hasPresence) {
      // Se c'è presenza: crea o aggiorna l'evento
      const eventBody = {
        summary: eventSummary,
        description: details,
        location: 'Casa Ghirla, Valganna',
        start: { dateTime: startDateTime, timeZone },
        end: { dateTime: endDateTime, timeZone },
      };

      if (existingEvent) {
        // Aggiorna evento esistente
        await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${existingEvent.id}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${tokenObj.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventBody),
        });
      } else {
        // Crea nuovo evento
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
      // Se la presenza è stata azzerata / disdetta e l'evento esisteva, cancella l'evento!
      await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${existingEvent.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${tokenObj.access_token}`,
        },
      });
    }
  } catch (err) {
    console.error('Errore durante la sincronizzazione con Google Calendar API:', err);
  }
}
