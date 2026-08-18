export interface Person {
  id: string;
  name: string;
  familyId: string;
  isHost?: boolean;
  isGuest?: boolean;
  avatarBg?: string;
  birthDate?: string; // YYYY-MM-DD
}

export interface FamilyGroup {
  id: string;
  name: string;
  badgeColor: string;
  members: Person[];
}

export interface PresenceEntry {
  date: string; // YYYY-MM-DD
  personId: string;
  lunch: boolean;
  dinner: boolean;
  overnight: boolean;
  notes?: string;
}

export const FAMILY_GROUPS: FamilyGroup[] = [
  {
    id: 'stefano-elena',
    name: 'Stefano & Elena',
    badgeColor: '#1e3a8a',
    members: [
      { id: 'stefano', name: 'Stefano', familyId: 'stefano-elena', isHost: true, avatarBg: '#1e40af', birthDate: '1960-01-08' },
      { id: 'elena', name: 'Elena', familyId: 'stefano-elena', isHost: true, avatarBg: '#1e40af', birthDate: '1962-09-12' }
    ]
  },
  {
    id: 'luigi-eli',
    name: 'Luigi & Elisabetta',
    badgeColor: '#047857',
    members: [
      { id: 'luigi', name: 'Luigi', familyId: 'luigi-eli', avatarBg: '#059669', birthDate: '2001-01-19' },
      { id: 'elisabetta', name: 'Elisabetta', familyId: 'luigi-eli', avatarBg: '#059669', birthDate: '2001-06-11' }
    ]
  },
  {
    id: 'luca-eleonora',
    name: 'Luca & Eleonora',
    badgeColor: '#b45309',
    members: [
      { id: 'luca', name: 'Luca', familyId: 'luca-eleonora', avatarBg: '#d97706', birthDate: '1995-07-09' },
      { id: 'eleonora', name: 'Eleonora', familyId: 'luca-eleonora', avatarBg: '#d97706' }
    ]
  },
  {
    id: 'cecilia-davide',
    name: 'Cecilia & Davide',
    badgeColor: '#6b21a8',
    members: [
      { id: 'cecilia', name: 'Cecilia', familyId: 'cecilia-davide', avatarBg: '#7e22ce', birthDate: '1993-11-22' },
      { id: 'davide', name: 'Davide', familyId: 'cecilia-davide', avatarBg: '#7e22ce', birthDate: '1995-03-01' }
    ]
  },
  {
    id: 'giacomo-maria',
    name: 'Giacomo & Maria O.',
    badgeColor: '#c2410c',
    members: [
      { id: 'giacomo', name: 'Giacomo', familyId: 'giacomo-maria', avatarBg: '#ea580c', birthDate: '1989-05-18' },
      { id: 'maria_o', name: 'Maria O.', familyId: 'giacomo-maria', avatarBg: '#ea580c', birthDate: '1991-08-12' },
      { id: 'peppo', name: 'Peppo', familyId: 'giacomo-maria', avatarBg: '#f97316', birthDate: '2023-04-03' },
      { id: 'marghe', name: 'Marghe', familyId: 'giacomo-maria', avatarBg: '#f97316', birthDate: '2020-09-06' },
      { id: 'fiammi', name: 'Fiammi', familyId: 'giacomo-maria', avatarBg: '#f97316' },
      { id: 'michi', name: 'Michi', familyId: 'giacomo-maria', avatarBg: '#f97316' }
    ]
  },
  {
    id: 'pietro-maria',
    name: 'Pietro & Maria R.',
    badgeColor: '#0f766e',
    members: [
      { id: 'pietro', name: 'Pietro', familyId: 'pietro-maria', avatarBg: '#14b8a6', birthDate: '1987-08-06' },
      { id: 'maria_r', name: 'Maria R.', familyId: 'pietro-maria', avatarBg: '#14b8a6', birthDate: '1990-02-16' },
      { id: 'monicotti', name: 'Monicotti', familyId: 'pietro-maria', avatarBg: '#2dd4bf', birthDate: '2025-01-20' },
      { id: 'isa', name: 'Isa', familyId: 'pietro-maria', avatarBg: '#2dd4bf', birthDate: '2022-03-28' }
    ]
  },
  {
    id: 'caterina-mario',
    name: 'Caterina & Mario',
    badgeColor: '#be185d',
    members: [
      { id: 'caterina', name: 'Caterina', familyId: 'caterina-mario', avatarBg: '#e11d48', birthDate: '1991-01-31' },
      { id: 'mario', name: 'Mario', familyId: 'caterina-mario', avatarBg: '#e11d48', birthDate: '1995-05-12' }
    ]
  }
];

export const ALL_PEOPLE: Person[] = FAMILY_GROUPS.flatMap(group => group.members);

export function getPersonById(personId: string): Person {
  const found = ALL_PEOPLE.find(p => p.id === personId);
  if (found) return found;

  if (personId.startsWith('guest_')) {
    const raw = personId.replace(/^guest_/, '');
    const parts = raw.split('_');

    if (parts.length > 1 && /^\d+$/.test(parts[parts.length - 1])) {
      parts.pop();
    }

    const knownFamilyIds = FAMILY_GROUPS.map(g => g.id);
    let familyId = 'ospiti';
    const familyIndex = parts.findIndex(p => knownFamilyIds.includes(p));
    if (familyIndex !== -1) {
      familyId = parts[familyIndex];
      parts.splice(familyIndex, 1);
    }

    const cleanName = parts
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return {
      id: personId,
      name: `${cleanName || 'Ospite'} (Ospite)`,
      familyId,
      avatarBg: '#ec4899',
      isGuest: true
    };
  }

  return {
    id: personId,
    name: personId,
    familyId: 'ospiti',
    avatarBg: '#ec4899',
    isGuest: true
  };
}

/**
 * Confronta due persone per età (tie-breaker per parimerito nelle statistiche).
 * Chi è più giovane (nato più di recente, data più avanti nel tempo) viene prima (ritorna valore negativo).
 */
export function comparePeopleByAge(personA: Person, personB: Person): number {
  const dateA = personA.birthDate;
  const dateB = personB.birthDate;

  if (dateA && dateB) {
    if (dateA > dateB) return -1; // personA è più giovane -> prima
    if (dateA < dateB) return 1;  // personB è più giovane -> prima
  } else if (dateA && !dateB) {
    return -1; // Chi ha data nota precede chi non ce l'ha
  } else if (!dateA && dateB) {
    return 1;
  }

  // Fallback ordine alfabetico per nome
  return personA.name.localeCompare(personB.name);
}

