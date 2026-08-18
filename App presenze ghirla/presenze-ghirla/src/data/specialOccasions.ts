export interface SpecialOccasion {
  date: string; // MM-DD
  type: 'nameday' | 'birthday' | 'anniversary';
  name: string;
  title: string;
  description?: string;
}

export const SPECIAL_OCCASIONS: SpecialOccasion[] = [
  // --- GENNAIO ---
  { date: '01-08', type: 'birthday', name: 'Stefano', title: 'Compleanno Stefano' },
  { date: '01-19', type: 'birthday', name: 'Luigi', title: 'Compleanno Luigi' },
  { date: '01-19', type: 'nameday', name: 'Mario', title: 'Onomastico Mario', description: 'San Mario martire' },
  { date: '01-20', type: 'birthday', name: 'Monicotti', title: 'Compleanno Monicotti (Monica)' },
  { date: '01-31', type: 'birthday', name: 'Caterina', title: 'Compleanno Caterina' },

  // --- FEBBRAIO ---
  { date: '02-16', type: 'birthday', name: 'Maria R.', title: 'Compleanno Maria R.' },
  { date: '02-22', type: 'anniversary', name: 'Maria R. & Pietro', title: 'Anniv. Maria R. & Pietro' },

  // --- MARZO ---
  { date: '03-01', type: 'birthday', name: 'Davide', title: 'Compleanno Davide' },
  { date: '03-19', type: 'nameday', name: 'Peppo', title: 'Onomastico Peppo (Giuseppe)', description: 'San Giuseppe' },
  { date: '03-28', type: 'birthday', name: 'Isa', title: 'Compleanno Isa (Isabella)' },

  // --- APRILE ---
  { date: '04-03', type: 'birthday', name: 'Peppo', title: 'Compleanno Peppo' },
  { date: '04-29', type: 'nameday', name: 'Caterina', title: 'Onomastico Caterina', description: 'Santa Caterina da Siena' },

  // --- MAGGIO ---
  { date: '05-12', type: 'birthday', name: 'Mario', title: 'Compleanno Mario' },
  { date: '05-18', type: 'birthday', name: 'Giacomo', title: 'Compleanno Giacomo' },

  // --- GIUGNO ---
  { date: '06-04', type: 'nameday', name: 'Isa', title: 'Onomastico Isa (Isabella)', description: 'Santa Isabella' },
  { date: '06-11', type: 'birthday', name: 'Elisabetta', title: 'Compleanno Elisabetta' },
  { date: '06-21', type: 'nameday', name: 'Luigi', title: 'Onomastico Luigi', description: 'San Luigi Gonzaga' },
  { date: '06-22', type: 'anniversary', name: 'Giacomo & Maria O.', title: 'Anniv. Giacomo & Maria O.' },
  { date: '06-29', type: 'nameday', name: 'Pietro', title: 'Onomastico Pietro', description: 'Santi Pietro e Paolo Apostoli' },

  // --- LUGLIO ---
  { date: '07-09', type: 'birthday', name: 'Luca', title: 'Compleanno Luca' },
  { date: '07-20', type: 'nameday', name: 'Marghe', title: 'Onomastico Marghe (Margherita)', description: "Santa Margherita d'Antiochia" },
  { date: '07-25', type: 'nameday', name: 'Giacomo', title: 'Onomastico Giacomo', description: 'San Giacomo il Maggiore Apostolo' },

  // --- AGOSTO ---
  { date: '08-06', type: 'birthday', name: 'Pietro', title: 'Compleanno Pietro' },
  { date: '08-12', type: 'birthday', name: 'Maria O.', title: 'Compleanno Maria O.' },
  { date: '08-18', type: 'nameday', name: 'Elena', title: 'Onomastico Elena', description: "Sant'Elena Imperatrice" },
  { date: '08-27', type: 'nameday', name: 'Monicotti', title: 'Onomastico Monicotti (Monica)', description: 'Santa Monica' },

  // --- SETTEMBRE ---
  { date: '09-06', type: 'birthday', name: 'Marghe', title: 'Compleanno Marghe (Margherita)' },
  { date: '09-06', type: 'anniversary', name: 'Cecilia & Davide', title: 'Anniv. Cecilia & Davide' },
  { date: '09-12', type: 'birthday', name: 'Elena', title: 'Compleanno Elena' },
  { date: '09-12', type: 'nameday', name: 'Maria', title: 'Onomastico Maria (Maria O. & Maria R.)', description: 'Santissimo Nome di Maria' },
  { date: '09-29', type: 'nameday', name: 'Michi', title: 'Onomastico Michi (Michele)', description: 'San Michele Arcangelo' },

  // --- OTTOBRE ---
  { date: '10-18', type: 'nameday', name: 'Luca', title: 'Onomastico Luca', description: 'San Luca Evangelista' },
  { date: '10-19', type: 'anniversary', name: 'Elena & Stefano', title: 'Anniv. Elena & Stefano' },

  // --- NOVEMBRE ---
  { date: '11-01', type: 'nameday', name: 'Fiammi', title: 'Onomastico Fiammi (Fiammetta)', description: 'Ognissanti' },
  { date: '11-17', type: 'nameday', name: 'Elisabetta', title: 'Onomastico Elisabetta', description: "Sant'Elisabetta d'Ungheria" },
  { date: '11-22', type: 'birthday', name: 'Cecilia', title: 'Compleanno Cecilia' },
  { date: '11-22', type: 'nameday', name: 'Cecilia', title: 'Onomastico Cecilia', description: 'Santa Cecilia' },

  // --- DICEMBRE ---
  { date: '12-26', type: 'nameday', name: 'Stefano', title: 'Onomastico Stefano', description: 'Santo Stefano Protomartire' },
  { date: '12-29', type: 'nameday', name: 'Davide', title: 'Onomastico Davide', description: 'San Davide Re e Profeta' }
];

export function getOccasionsForDate(dateStr: string): SpecialOccasion[] {
  if (!dateStr || dateStr.length < 10) return [];
  const mmdd = dateStr.slice(5, 10);
  return SPECIAL_OCCASIONS.filter(occ => occ.date === mmdd);
}
