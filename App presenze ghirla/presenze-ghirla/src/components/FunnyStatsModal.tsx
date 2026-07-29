import React from 'react';
import type { PresenceEntry } from '../data/familyData';
import { getPersonById } from '../data/familyData';
import { X, Trophy, Moon, Utensils, Flame, Calendar, Sparkles } from 'lucide-react';

interface FunnyStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  presences: Record<string, PresenceEntry>;
}

export const FunnyStatsModal: React.FC<FunnyStatsModalProps> = ({
  isOpen,
  onClose,
  presences
}) => {
  if (!isOpen) return null;

  const entries = Object.values(presences);

  // Mappe per aggregazioni
  const mealCountByPerson: Record<string, number> = {};
  const overnightCountByPerson: Record<string, number> = {};
  const dateMealsTotal: Record<string, { lunch: number; dinner: number; totalPeople: Set<string> }> = {};
  const dayOfWeekMeals: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

  let grandTotalLunch = 0;
  let grandTotalDinner = 0;
  let grandTotalOvernight = 0;

  entries.forEach(entry => {
    const { date, personId, lunch, dinner, overnight } = entry;
    if (!lunch && !dinner && !overnight) return;

    const person = getPersonById(personId);
    const isHost = person.isHost || personId === 'stefano' || personId === 'elena';

    // 1 & 2. Conteggi individuali per non-host
    if (!isHost) {
      const meals = (lunch ? 1 : 0) + (dinner ? 1 : 0);
      if (meals > 0) {
        mealCountByPerson[personId] = (mealCountByPerson[personId] || 0) + meals;
      }
      if (overnight) {
        overnightCountByPerson[personId] = (overnightCountByPerson[personId] || 0) + 1;
      }
    }

    // Totali generali
    if (lunch) grandTotalLunch++;
    if (dinner) grandTotalDinner++;
    if (overnight) grandTotalOvernight++;

    // Statistiche per Data
    if (!dateMealsTotal[date]) {
      dateMealsTotal[date] = { lunch: 0, dinner: 0, totalPeople: new Set() };
    }
    if (lunch) dateMealsTotal[date].lunch++;
    if (dinner) dateMealsTotal[date].dinner++;
    if (lunch || dinner) dateMealsTotal[date].totalPeople.add(personId);

    // Giorno della settimana (0=Dom, 1=Lun, ...)
    const dateObj = new Date(date + 'T12:00:00');
    const dayOfWeek = dateObj.getDay();
    const dayMeals = (lunch ? 1 : 0) + (dinner ? 1 : 0);
    dayOfWeekMeals[dayOfWeek] += dayMeals;
  });

  // 1. Forchetta d'Oro (Max pasti non-host)
  let goldenForkPersonId: string | null = null;
  let goldenForkMax = 0;
  Object.entries(mealCountByPerson).forEach(([pId, count]) => {
    if (count > goldenForkMax) {
      goldenForkMax = count;
      goldenForkPersonId = pId;
    }
  });
  const goldenForkPerson = goldenForkPersonId ? getPersonById(goldenForkPersonId) : null;

  // 2. Re del Pigiama Party (Max notti non-host)
  let pajamaKingPersonId: string | null = null;
  let pajamaKingMax = 0;
  Object.entries(overnightCountByPerson).forEach(([pId, count]) => {
    if (count > pajamaKingMax) {
      pajamaKingMax = count;
      pajamaKingPersonId = pId;
    }
  });
  const pajamaKingPerson = pajamaKingPersonId ? getPersonById(pajamaKingPersonId) : null;

  // 3. Giorno da Tutto Esaurito (Data record presenze)
  let recordDate: string | null = null;
  let recordCount = 0;
  Object.entries(dateMealsTotal).forEach(([d, data]) => {
    const totalPresent = data.totalPeople.size;
    if (totalPresent > recordCount) {
      recordCount = totalPresent;
      recordDate = d;
    }
  });

  let formattedRecordDate = 'N/D';
  if (recordDate) {
    const dObj = new Date(recordDate + 'T12:00:00');
    formattedRecordDate = dObj.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    // Capitalize first letter
    formattedRecordDate = formattedRecordDate.charAt(0).toUpperCase() + formattedRecordDate.slice(1);
  }

  // 4. Media Pasti al Giorno
  const totalActiveDays = Object.keys(dateMealsTotal).length;
  const grandTotalMeals = grandTotalLunch + grandTotalDinner;
  const avgMealsPerDay = totalActiveDays > 0 ? (grandTotalMeals / totalActiveDays).toFixed(1) : '0';

  // 5. Giorno Più Popolare
  const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
  let topDayOfWeek = 0;
  let topDayMeals = -1;
  Object.entries(dayOfWeekMeals).forEach(([day, count]) => {
    if (count > topDayMeals) {
      topDayMeals = count;
      topDayOfWeek = Number(day);
    }
  });
  const popularDayName = topDayMeals > 0 ? dayNames[topDayOfWeek] : 'N/D';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        maxWidth: '620px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header Modale */}
        <div style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          color: '#ffffff',
          padding: '24px',
          borderRadius: '24px 24px 0 0',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '16px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={32} color="#fde047" />
          </div>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
              Funny Stats Casa Ghirla 📊
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#c7d2fe', fontSize: '14px', fontWeight: 500 }}>
              Curiosità e record storici a tavola e in casa!
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo Modale */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Griglia Statistiche Incoronate */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            
            {/* Forchetta d'Oro */}
            <div style={{
              backgroundColor: '#fffbeb',
              border: '2px solid #fde68a',
              borderRadius: '20px',
              padding: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              boxShadow: '0 4px 12px rgba(251, 191, 36, 0.15)'
            }}>
              <div style={{
                backgroundColor: '#f59e0b',
                color: '#ffffff',
                padding: '12px',
                borderRadius: '16px',
                display: 'flex'
              }}>
                <Trophy size={28} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>
                  👑 Forchetta d'Oro
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#78350f', marginTop: '2px' }}>
                  {goldenForkPerson ? goldenForkPerson.name : 'Nessuno ancora'}
                </div>
                <div style={{ fontSize: '13px', color: '#92400e', fontWeight: 600 }}>
                  {goldenForkMax > 0 ? `${goldenForkMax} pasti partecipati` : 'Nessun dato'}
                </div>
              </div>
            </div>

            {/* Re del Pigiama Party */}
            <div style={{
              backgroundColor: '#f0f9ff',
              border: '2px solid #bae6fd',
              borderRadius: '20px',
              padding: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              boxShadow: '0 4px 12px rgba(14, 165, 233, 0.15)'
            }}>
              <div style={{
                backgroundColor: '#0284c7',
                color: '#ffffff',
                padding: '12px',
                borderRadius: '16px',
                display: 'flex'
              }}>
                <Moon size={28} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase' }}>
                  🌙 Re del Pigiama Party
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#0c4a6e', marginTop: '2px' }}>
                  {pajamaKingPerson ? pajamaKingPerson.name : 'Nessuno ancora'}
                </div>
                <div style={{ fontSize: '13px', color: '#075985', fontWeight: 600 }}>
                  {pajamaKingMax > 0 ? `${pajamaKingMax} notti dormite` : 'Nessun dato'}
                </div>
              </div>
            </div>

          </div>

          {/* Griglia Altre Statistiche */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
            
            {/* Media Pasti al Giorno */}
            <div style={{
              backgroundColor: '#fdf2f8',
              border: '1px solid #fbcfe8',
              borderRadius: '18px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#db2777', fontWeight: 700, fontSize: '13px' }}>
                <Utensils size={18} />
                <span>Media Pasti / Giorno</span>
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#831843' }}>
                {avgMealsPerDay}
              </div>
              <div style={{ fontSize: '12px', color: '#9d174d' }}>
                coperti medi a giornata
              </div>
            </div>

            {/* Giorno Più Popolare */}
            <div style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '18px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontWeight: 700, fontSize: '13px' }}>
                <Calendar size={18} />
                <span>Giorno Più Popolare</span>
              </div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#14532d' }}>
                {popularDayName}
              </div>
              <div style={{ fontSize: '12px', color: '#166534' }}>
                più affluenza a tavola
              </div>
            </div>

            {/* Giorno Tutto Esaurito */}
            <div style={{
              backgroundColor: '#fff7ed',
              border: '1px solid #fed7aa',
              borderRadius: '18px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ea580c', fontWeight: 700, fontSize: '13px' }}>
                <Flame size={18} />
                <span>Record Affluenza</span>
              </div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#7c2d12' }}>
                {recordCount > 0 ? `${recordCount} persone` : '0'}
              </div>
              <div style={{ fontSize: '12px', color: '#9a3412', fontWeight: 500 }}>
                {formattedRecordDate}
              </div>
            </div>

          </div>

          {/* Banner Totali Storici Generali */}
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '18px',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Totale Pranzi</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>🍝 {grandTotalLunch}</div>
            </div>
            <div style={{ width: '1px', height: '30px', backgroundColor: '#cbd5e1' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Totale Cene</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>🌙 {grandTotalDinner}</div>
            </div>
            <div style={{ width: '1px', height: '30px', backgroundColor: '#cbd5e1' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Notti Totali</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>🛏️ {grandTotalOvernight}</div>
            </div>
          </div>

          {/* Note a piè di modale */}
          <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', fontStyle: 'italic' }}>
            * Le classifiche individuali (Forchetta d'Oro e Re del Pigiama Party) escludono Stefano ed Elena.
          </div>

        </div>
      </div>
    </div>
  );
};
