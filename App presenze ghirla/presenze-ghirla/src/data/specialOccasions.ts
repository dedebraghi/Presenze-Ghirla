export interface SpecialOccasion {
  date: string; // MM-DD
  type: 'nameday' | 'birthday' | 'anniversary';
  name: string;
  title: string;
  description?: string;
  badgeBg?: string;
  badgeColor?: string;
}

export const SPECIAL_OCCASIONS: SpecialOccasion[] = [
  // ONOMASTICI
  {
    date: '01-19',
    type: 'nameday',
    name: 'Mario',
    title: 'Onomastico Mario',
    description: 'San Mario martire'
  },
  {
    date: '03-19',
    type: 'nameday',
    name: 'Peppo',
    title: 'Onomastico Peppo (Giuseppe)',
    description: 'San Giuseppe'
  },
  {
    date: '04-29',
    type: 'nameday',
    name: 'Caterina',
    title: 'Onomastico Caterina',
    description: 'Santa Caterina da Siena'
  },
  {
    date: '06-04',
    type: 'nameday',
    name: 'Isa',
    title: 'Onomastico Isa (Isabella)',
    description: 'Santa Isabella'
  },
  {
    date: '06-21',
    type: 'nameday',
    name: 'Luigi',
    title: 'Onomastico Luigi',
    description: 'San Luigi Gonzaga'
  },
  {
    date: '06-29',
    type: 'nameday',
    name: 'Pietro',
    title: 'Onomastico Pietro',
    description: 'Santi Pietro e Paolo Apostoli'
  },
  {
    date: '07-20',
    type: 'nameday',
    name: 'Marghe',
    title: 'Onomastico Marghe (Margherita)',
    description: "Santa Margherita d'Antiochia"
  },
  {
    date: '07-25',
    type: 'nameday',
    name: 'Giacomo',
    title: 'Onomastico Giacomo',
    description: 'San Giacomo il Maggiore Apostolo'
  },
  {
    date: '08-18',
    type: 'nameday',
    name: 'Elena',
    title: 'Onomastico Elena',
    description: "Sant'Elena Imperatrice"
  },
  {
    date: '08-27',
    type: 'nameday',
    name: 'Monicotti',
    title: 'Onomastico Monicotti (Monica)',
    description: 'Santa Monica'
  },
  {
    date: '09-12',
    type: 'nameday',
    name: 'Maria',
    title: 'Onomastico Maria (Maria O. & Maria R.)',
    description: 'Santissimo Nome di Maria'
  },
  {
    date: '09-29',
    type: 'nameday',
    name: 'Michi',
    title: 'Onomastico Michi (Michele)',
    description: 'San Michele Arcangelo'
  },
  {
    date: '10-18',
    type: 'nameday',
    name: 'Luca',
    title: 'Onomastico Luca',
    description: 'San Luca Evangelista'
  },
  {
    date: '11-01',
    type: 'nameday',
    name: 'Fiammi',
    title: 'Onomastico Fiammi (Fiammetta)',
    description: 'Ognissanti'
  },
  {
    date: '11-17',
    type: 'nameday',
    name: 'Elisabetta',
    title: 'Onomastico Elisabetta',
    description: "Sant'Elisabetta d'Ungheria"
  },
  {
    date: '11-22',
    type: 'nameday',
    name: 'Cecilia',
    title: 'Onomastico Cecilia',
    description: 'Santa Cecilia'
  },
  {
    date: '12-26',
    type: 'nameday',
    name: 'Stefano',
    title: 'Onomastico Stefano',
    description: 'Santo Stefano Protomartire'
  },
  {
    date: '12-29',
    type: 'nameday',
    name: 'Davide',
    title: 'Onomastico Davide',
    description: 'San Davide Re e Profeta'
  }
];

export function getOccasionsForDate(dateStr: string): SpecialOccasion[] {
  if (!dateStr || dateStr.length < 10) return [];
  const mmdd = dateStr.slice(5, 10);
  return SPECIAL_OCCASIONS.filter(occ => occ.date === mmdd);
}
