/**
 * Restituisce una stringa nel formato YYYY-MM-DD basata sul fuso orario locale dell'utente
 */
export function getLocalDateString(d: Date = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
