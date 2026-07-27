export interface Person {
  id: string;
  name: string;
  familyId: string;
  isHost?: boolean;
  avatarBg?: string;
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
      { id: 'stefano', name: 'Stefano', familyId: 'stefano-elena', isHost: true, avatarBg: '#1e40af' },
      { id: 'elena', name: 'Elena', familyId: 'stefano-elena', isHost: true, avatarBg: '#1e40af' }
    ]
  },
  {
    id: 'luigi-eli',
    name: 'Luigi & Elisabetta',
    badgeColor: '#047857',
    members: [
      { id: 'luigi', name: 'Luigi', familyId: 'luigi-eli', avatarBg: '#059669' },
      { id: 'elisabetta', name: 'Elisabetta', familyId: 'luigi-eli', avatarBg: '#059669' }
    ]
  },
  {
    id: 'luca-eleonora',
    name: 'Luca & Eleonora',
    badgeColor: '#b45309',
    members: [
      { id: 'luca', name: 'Luca', familyId: 'luca-eleonora', avatarBg: '#d97706' },
      { id: 'eleonora', name: 'Eleonora', familyId: 'luca-eleonora', avatarBg: '#d97706' }
    ]
  },
  {
    id: 'cecilia-davide',
    name: 'Cecilia & Davide',
    badgeColor: '#6b21a8',
    members: [
      { id: 'cecilia', name: 'Cecilia', familyId: 'cecilia-davide', avatarBg: '#7e22ce' },
      { id: 'davide', name: 'Davide', familyId: 'cecilia-davide', avatarBg: '#7e22ce' }
    ]
  },
  {
    id: 'giacomo-maria',
    name: 'Giacomo & Maria O.',
    badgeColor: '#c2410c',
    members: [
      { id: 'giacomo', name: 'Giacomo', familyId: 'giacomo-maria', avatarBg: '#ea580c' },
      { id: 'maria_o', name: 'Maria O.', familyId: 'giacomo-maria', avatarBg: '#ea580c' },
      { id: 'peppo', name: 'Peppo', familyId: 'giacomo-maria', avatarBg: '#f97316' },
      { id: 'marghe', name: 'Marghe', familyId: 'giacomo-maria', avatarBg: '#f97316' },
      { id: 'fiammi', name: 'Fiammi', familyId: 'giacomo-maria', avatarBg: '#f97316' },
      { id: 'michi', name: 'Michi', familyId: 'giacomo-maria', avatarBg: '#f97316' }
    ]
  },
  {
    id: 'pietro-maria',
    name: 'Pietro & Maria R.',
    badgeColor: '#0f766e',
    members: [
      { id: 'pietro', name: 'Pietro', familyId: 'pietro-maria', avatarBg: '#14b8a6' },
      { id: 'maria_r', name: 'Maria R.', familyId: 'pietro-maria', avatarBg: '#14b8a6' },
      { id: 'monicotti', name: 'Monicotti', familyId: 'pietro-maria', avatarBg: '#2dd4bf' },
      { id: 'isa', name: 'Isa', familyId: 'pietro-maria', avatarBg: '#2dd4bf' }
    ]
  },
  {
    id: 'caterina-mario',
    name: 'Caterina & Mario',
    badgeColor: '#be185d',
    members: [
      { id: 'caterina', name: 'Caterina', familyId: 'caterina-mario', avatarBg: '#e11d48' },
      { id: 'mario', name: 'Mario', familyId: 'caterina-mario', avatarBg: '#e11d48' }
    ]
  }
];

export const ALL_PEOPLE: Person[] = FAMILY_GROUPS.flatMap(group => group.members);
