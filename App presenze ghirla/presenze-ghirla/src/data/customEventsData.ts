export interface EventSlot {
  id: string;
  label: string;
  icon?: string;
}

export interface EventRsvp {
  personId: string;
  status: 'yes' | 'partial' | 'no';
  selectedSlots: string[]; // IDs of the slots this person attends
  notes?: string;
  updatedAt: string;
}

export interface CustomEvent {
  id: string;
  title: string;
  description?: string;
  creatorId: string;
  location?: string;
  externalGuests?: string; // Chi c'è di esterno alla famiglia
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  slots: EventSlot[];
  targetPeople?: string[]; // 'all' or list of person IDs
  rsvps: Record<string, EventRsvp>;
  createdAt: string;
  isActive: boolean;
}

export const DEFAULT_EVENT_SLOTS: EventSlot[] = [
  { id: 'main_event', label: 'Attività / Evento Principale', icon: '🎨' },
  { id: 'lunch', label: 'Pranzo', icon: '🍝' },
  { id: 'aperitif', label: 'Aperitivo / Rinfresco', icon: '🥂' },
  { id: 'dinner', label: 'Cena', icon: '🍷' },
  { id: 'overnight', label: 'Pernottamento / Notte', icon: '🛏️' },
];
