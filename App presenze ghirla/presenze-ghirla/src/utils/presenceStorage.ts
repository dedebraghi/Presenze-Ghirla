import type { PresenceEntry } from '../data/familyData';
import { supabase } from './supabaseClient';

const STORAGE_KEY = 'ghirla_presences_v1';

export function savePresencesLocal(presences: Record<string, PresenceEntry>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presences));
}

export function getLocalPresences(): Record<string, PresenceEntry> {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Errore nel caricamento presenze locali:", e);
    }
  }
  return {};
}

// Carica le presenze dal database Supabase
export async function fetchPresencesFromCloud(): Promise<Record<string, PresenceEntry>> {
  const { data, error } = await supabase.from('presences').select('*');
  if (error) {
    console.error('Errore nel caricamento da Supabase:', error);
    return getLocalPresences();
  }

  const result: Record<string, PresenceEntry> = {};
  if (data) {
    data.forEach((row: any) => {
      result[row.id] = {
        date: row.date,
        personId: row.person_id,
        lunch: row.lunch,
        dinner: row.dinner,
        overnight: row.overnight,
      };
    });
  }
  savePresencesLocal(result);
  return result;
}

// Salva o aggiorna una singola presenza sia in locale che nel cloud Supabase
export async function savePresenceEntryToCloud(entryKey: string, entry: PresenceEntry) {
  // Aggiorna prima in locale per reattività immediata
  const local = getLocalPresences();
  local[entryKey] = entry;
  savePresencesLocal(local);

  // Poi salva su Supabase
  const { error } = await supabase.from('presences').upsert({
    id: entryKey,
    date: entry.date,
    person_id: entry.personId,
    lunch: entry.lunch,
    dinner: entry.dinner,
    overnight: entry.overnight,
    updated_at: new Date().toISOString()
  });

  if (error) {
    console.error('Errore durante il salvataggio su Supabase:', error);
  }
}

// Salva più presenze contemporaneamente sia in locale che su Supabase
export async function batchSavePresenceEntriesToCloud(entriesMap: Record<string, PresenceEntry>) {
  const local = getLocalPresences();
  const rowsToUpsert: any[] = [];

  Object.entries(entriesMap).forEach(([key, entry]) => {
    local[key] = entry;
    rowsToUpsert.push({
      id: key,
      date: entry.date,
      person_id: entry.personId,
      lunch: entry.lunch,
      dinner: entry.dinner,
      overnight: entry.overnight,
      updated_at: new Date().toISOString()
    });
  });

  savePresencesLocal(local);

  if (rowsToUpsert.length > 0) {
    const { error } = await supabase.from('presences').upsert(rowsToUpsert);
    if (error) {
      console.error('Errore durante il salvataggio batch su Supabase:', error);
    }
  }
}
