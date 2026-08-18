import type { CustomEvent, EventRsvp } from '../data/customEventsData';
import { supabase } from './supabaseClient';

const STORAGE_KEY = 'ghirla_custom_events_v1';

export function getLocalCustomEvents(): Record<string, CustomEvent> {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Errore nel caricamento eventi locali:', e);
    }
  }
  return {};
}

export function saveLocalCustomEvents(events: Record<string, CustomEvent>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export async function fetchCustomEventsFromCloud(): Promise<Record<string, CustomEvent>> {
  try {
    const { data, error } = await supabase.from('custom_events').select('*');
    if (error) {
      // If table does not exist or network issue, fallback to localStorage
      console.warn('Tabella custom_events non trovata su Supabase o errore:', error.message);
      return getLocalCustomEvents();
    }

    const result: Record<string, CustomEvent> = {};
    if (data) {
      data.forEach((row: any) => {
        result[row.id] = {
          id: row.id,
          title: row.title,
          description: row.description,
          creatorId: row.creator_id,
          location: row.location,
          externalGuests: row.external_guests,
          startDate: row.start_date,
          endDate: row.end_date,
          slots: typeof row.slots === 'string' ? JSON.parse(row.slots) : (row.slots || []),
          targetPeople: typeof row.target_people === 'string' ? JSON.parse(row.target_people) : (row.target_people || []),
          rsvps: typeof row.rsvps === 'string' ? JSON.parse(row.rsvps) : (row.rsvps || {}),
          createdAt: row.created_at,
          isActive: row.is_active ?? true,
        };
      });
    }
    saveLocalCustomEvents(result);
    return result;
  } catch (err) {
    console.error('Errore fetch custom_events:', err);
    return getLocalCustomEvents();
  }
}

export async function saveCustomEventToCloud(event: CustomEvent): Promise<Record<string, CustomEvent>> {
  const current = getLocalCustomEvents();
  current[event.id] = event;
  saveLocalCustomEvents(current);

  try {
    const { error } = await supabase.from('custom_events').upsert({
      id: event.id,
      title: event.title,
      description: event.description,
      creator_id: event.creatorId,
      location: event.location,
      external_guests: event.externalGuests,
      start_date: event.startDate,
      end_date: event.endDate,
      slots: event.slots,
      target_people: event.targetPeople,
      rsvps: event.rsvps,
      created_at: event.createdAt,
      is_active: event.isActive,
      updated_at: new Date().toISOString()
    });

    if (error) {
      console.warn('Salvataggio evento su Supabase non riuscito (usato localStorage):', error.message);
    }
  } catch (err) {
    console.error('Eccezione salvataggio custom_event:', err);
  }

  // Trigger Google Calendar sync for this custom event
  try {
    supabase.functions.invoke('sync-google-calendar', {
      body: { customEvent: event, action: 'upsert' }
    }).catch(e => console.warn('Errore sync calendar custom event:', e));
  } catch {}

  return current;
}

export async function deleteCustomEventFromCloud(eventId: string): Promise<Record<string, CustomEvent>> {
  const current = getLocalCustomEvents();
  const deletedEvent = current[eventId];
  delete current[eventId];
  saveLocalCustomEvents(current);

  try {
    const { error } = await supabase.from('custom_events').delete().eq('id', eventId);
    if (error) {
      console.warn('Eliminazione evento da Supabase non riuscita:', error.message);
    }
  } catch (err) {
    console.error('Eccezione eliminazione custom_event:', err);
  }

  // Trigger Google Calendar sync to delete parallel event
  try {
    supabase.functions.invoke('sync-google-calendar', {
      body: { customEventId: eventId, action: 'delete', customEvent: deletedEvent }
    }).catch(e => console.warn('Errore sync calendar delete custom event:', e));
  } catch {}

  return current;
}

export async function updateEventRsvpInCloud(eventId: string, rsvp: EventRsvp): Promise<Record<string, CustomEvent>> {
  const current = getLocalCustomEvents();
  if (current[eventId]) {
    if (!current[eventId].rsvps) {
      current[eventId].rsvps = {};
    }
    current[eventId].rsvps[rsvp.personId] = rsvp;
    return await saveCustomEventToCloud(current[eventId]);
  }
  return current;
}
