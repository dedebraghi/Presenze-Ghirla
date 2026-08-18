import React, { useState, useEffect, useMemo } from 'react';
import type { PresenceEntry, Person } from '../data/familyData';
import { getPersonById, FAMILY_GROUPS, ALL_PEOPLE } from '../data/familyData';
import { getLocalDateString } from '../utils/dateUtils';
import confetti from 'canvas-confetti';
import {
  X,
  Trophy,
  Moon,
  Calendar,
  Sparkles,
  Sun,
  Wine,
  Footprints,
  Flame,
  Crown,
  ChevronDown,
  ChevronUp,
  UserCheck,
  UserPlus,
  Info
} from 'lucide-react';

interface FunnyStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  presences: Record<string, PresenceEntry>;
}

type TimeFilter = 'all' | 'year' | 'month' | 'week';

interface ForkItem {
  person: Person;
  count: number;
  lunch: number;
  dinner: number;
}

interface PajamaItem {
  person: Person;
  count: number;
}

interface MealDetailItem {
  person: Person;
  lunch?: number;
  dinner?: number;
  total: number;
}

interface TouchAndGoItem {
  person: Person;
  meals: number;
  nights: number;
}

interface MarathonItem {
  person: Person;
  streak: number;
}

interface TopHostFamilyItem {
  familyName: string;
  count: number;
}

interface GuestOfHonorItem {
  person: Person;
  count: number;
}

export const FunnyStatsModal: React.FC<FunnyStatsModalProps> = ({
  isOpen,
  onClose,
  presences
}) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [showFullForkList, setShowFullForkList] = useState(false);
  const [showFullPajamaList, setShowFullPajamaList] = useState(false);

  // Coriandoli all'apertura
  useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    }
  }, [isOpen]);

  const todayStr = getLocalDateString();

  // Calcolo intervalli filtro
  const filterBounds = useMemo(() => {
    const today = new Date(todayStr + 'T12:00:00');
    const currentYear = todayStr.slice(0, 4);
    const currentMonth = todayStr.slice(0, 7);

    const day = today.getDay(); // 0 Dom, 1 Lun, ...
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);
    const startOfWeekStr = monday.toISOString().slice(0, 10);

    return {
      currentYear,
      currentMonth,
      startOfWeekStr
    };
  }, [todayStr]);

  // Helper per ottenere la presenza (considerando Stefano ed Elena default presenti se non specificato diversamente)
  const getEntryWithDefault = (dateStr: string, personId: string): PresenceEntry => {
    const key = `${dateStr}_${personId}`;
    if (presences[key]) {
      return presences[key];
    }
    const isDefaultAlwaysPresent = personId === 'stefano' || personId === 'elena';
    return {
      date: dateStr,
      personId,
      lunch: isDefaultAlwaysPresent,
      dinner: isDefaultAlwaysPresent,
      overnight: isDefaultAlwaysPresent
    };
  };

  // Elaborazione statistiche
  const stats = useMemo(() => {
    // Raccogliamo tutte le date attive registrate nel database
    const allActiveDates = new Set<string>();
    Object.values(presences).forEach(entry => {
      if (entry && entry.date) {
        allActiveDates.add(entry.date);
      }
    });

    // Mappe per aggregazioni individuali
    const mealsByPerson: Record<string, { total: number; lunch: number; dinner: number }> = {};
    const overnightByPerson: Record<string, number> = {};
    const activeDatesByPerson: Record<string, Set<string>> = {};
    
    // Mappa per aggregazioni giornaliere
    const dateStats: Record<string, { lunch: number; dinner: number; overnight: number; uniquePeople: Set<string>; dayOfWeek: number }> = {};

    // Statistiche Ospiti
    const guestPresencesByPerson: Record<string, number> = {};
    const guestCountsByFamily: Record<string, number> = {};

    let grandTotalLunch = 0;
    let grandTotalDinner = 0;
    let grandTotalOvernight = 0;

    // Elaboriamo ogni data attiva
    allActiveDates.forEach(date => {
      if (date > todayStr) return;

      // Applica filtro temporale
      if (timeFilter === 'year' && !date.startsWith(filterBounds.currentYear)) return;
      if (timeFilter === 'month' && !date.startsWith(filterBounds.currentMonth)) return;
      if (timeFilter === 'week' && date < filterBounds.startOfWeekStr) return;

      const dateObj = new Date(date + 'T12:00:00');
      const dayOfWeek = dateObj.getDay();

      if (!dateStats[date]) {
        dateStats[date] = { lunch: 0, dinner: 0, overnight: 0, uniquePeople: new Set(), dayOfWeek };
      }

      // 1. Membri regolari della famiglia (inclusi Stefano ed Elena con default presenza)
      ALL_PEOPLE.forEach(person => {
        const entry = getEntryWithDefault(date, person.id);
        const { lunch, dinner, overnight } = entry;
        if (!lunch && !dinner && !overnight) return;

        const isHost = person.isHost || person.id === 'stefano' || person.id === 'elena';

        // Conteggi per non-host
        if (!isHost) {
          if (!mealsByPerson[person.id]) {
            mealsByPerson[person.id] = { total: 0, lunch: 0, dinner: 0 };
          }
          if (lunch) {
            mealsByPerson[person.id].lunch++;
            mealsByPerson[person.id].total++;
          }
          if (dinner) {
            mealsByPerson[person.id].dinner++;
            mealsByPerson[person.id].total++;
          }
          if (overnight) {
            overnightByPerson[person.id] = (overnightByPerson[person.id] || 0) + 1;
          }

          if (!activeDatesByPerson[person.id]) {
            activeDatesByPerson[person.id] = new Set();
          }
          activeDatesByPerson[person.id].add(date);
        }

        // Totali generali e giornalieri
        if (lunch) {
          grandTotalLunch++;
          dateStats[date].lunch++;
        }
        if (dinner) {
          grandTotalDinner++;
          dateStats[date].dinner++;
        }
        if (overnight) {
          grandTotalOvernight++;
          dateStats[date].overnight++;
        }
        dateStats[date].uniquePeople.add(person.id);
      });

      // 2. Ospiti registrati per questa data
      const datePrefix = `${date}_`;
      Object.keys(presences).forEach(key => {
        if (key.startsWith(datePrefix)) {
          const personId = key.substring(datePrefix.length);
          if (personId.startsWith('guest_')) {
            const entry = presences[key];
            if (entry && (entry.lunch || entry.dinner || entry.overnight)) {
              const person = getPersonById(personId);
              
              guestPresencesByPerson[personId] = (guestPresencesByPerson[personId] || 0) + (entry.lunch ? 1 : 0) + (entry.dinner ? 1 : 0) + (entry.overnight ? 1 : 0);
              if (person.familyId && person.familyId !== 'ospiti' && person.familyId !== 'stefano-elena') {
                guestCountsByFamily[person.familyId] = (guestCountsByFamily[person.familyId] || 0) + 1;
              }

              // Conteggi individuali ospiti
              if (!mealsByPerson[personId]) {
                mealsByPerson[personId] = { total: 0, lunch: 0, dinner: 0 };
              }
              if (entry.lunch) {
                mealsByPerson[personId].lunch++;
                mealsByPerson[personId].total++;
                grandTotalLunch++;
                dateStats[date].lunch++;
              }
              if (entry.dinner) {
                mealsByPerson[personId].dinner++;
                mealsByPerson[personId].total++;
                grandTotalDinner++;
                dateStats[date].dinner++;
              }
              if (entry.overnight) {
                overnightByPerson[personId] = (overnightByPerson[personId] || 0) + 1;
                grandTotalOvernight++;
                dateStats[date].overnight++;
              }

              if (!activeDatesByPerson[personId]) {
                activeDatesByPerson[personId] = new Set();
              }
              activeDatesByPerson[personId].add(date);

              dateStats[date].uniquePeople.add(personId);
            }
          }
        }
      });
    });

    // 1. Classifiche Podio Forchetta d'Oro & Pigiama Party
    const forkLeaderboard: ForkItem[] = Object.entries(mealsByPerson)
      .map(([pId, data]) => ({ person: getPersonById(pId), count: data.total, lunch: data.lunch, dinner: data.dinner }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);

    const pajamaLeaderboard: PajamaItem[] = Object.entries(overnightByPerson)
      .map(([pId, count]) => ({ person: getPersonById(pId), count }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);

    // 2. Menzioni d'Onore
    const serialLuncher: MealDetailItem | null = Object.entries(mealsByPerson)
      .map(([pId, data]) => ({ person: getPersonById(pId), lunch: data.lunch, total: data.total }))
      .filter(item => (item.lunch || 0) > 0)
      .sort((a, b) => (b.lunch || 0) - (a.lunch || 0))[0] || null;

    const nightCreature: MealDetailItem | null = Object.entries(mealsByPerson)
      .map(([pId, data]) => ({ person: getPersonById(pId), dinner: data.dinner, total: data.total }))
      .filter(item => (item.dinner || 0) > 0)
      .sort((a, b) => (b.dinner || 0) - (a.dinner || 0))[0] || null;

    const touchAndGo: TouchAndGoItem | null = Object.entries(mealsByPerson)
      .map(([pId, data]) => ({
        person: getPersonById(pId),
        meals: data.total,
        nights: overnightByPerson[pId] || 0
      }))
      .filter(item => item.meals > 0 && item.nights === 0)
      .sort((a, b) => b.meals - a.meals)[0] || null;

    let marathonWinner: MarathonItem | null = null;
    Object.entries(activeDatesByPerson).forEach(([pId, dateSet]) => {
      const sortedDates = Array.from(dateSet).sort();
      let maxStreak = 0;
      let currentStreak = 0;
      let prevDate: Date | null = null;

      sortedDates.forEach(dStr => {
        const d = new Date(dStr + 'T12:00:00');
        if (!prevDate) {
          currentStreak = 1;
        } else {
          const diffDays = Math.round((d.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            currentStreak++;
          } else {
            currentStreak = 1;
          }
        }
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
        }
        prevDate = d;
      });

      if (maxStreak > 0 && (!marathonWinner || maxStreak > marathonWinner.streak)) {
        marathonWinner = { person: getPersonById(pId), streak: maxStreak };
      }
    });

    let topHostFamily: TopHostFamilyItem | null = null;
    Object.entries(guestCountsByFamily).forEach(([famId, count]) => {
      if (!topHostFamily || count > topHostFamily.count) {
        const fam = FAMILY_GROUPS.find(g => g.id === famId);
        topHostFamily = { familyName: fam ? fam.name : famId, count };
      }
    });

    const guestOfHonor: GuestOfHonorItem | null = Object.entries(guestPresencesByPerson)
      .map(([pId, count]) => ({ person: getPersonById(pId), count }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count)[0] || null;

    // 3. Record Affluenza Retroattivo (confronta tutte le date attive)
    let recordDate: string | null = null;
    let recordCount = 0;
    Object.entries(dateStats).forEach(([d, data]) => {
      const totalPresent = data.uniquePeople.size;
      if (totalPresent > recordCount) {
        recordCount = totalPresent;
        recordDate = d;
      }
    });

    let formattedRecordDate = 'N/D';
    if (recordDate) {
      const dObj = new Date(recordDate + 'T12:00:00');
      formattedRecordDate = dObj.toLocaleDateString('it-IT', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      });
      formattedRecordDate = formattedRecordDate.charAt(0).toUpperCase() + formattedRecordDate.slice(1);
    }

    // Calcolo Medie Giornaliere per Giorno della Settimana:
    // Per ogni singola data: mediaGiorno = (pranzo + cena + notte) / 3
    // Per ogni giorno della settimana (Lun..Dom): media tra tutte le date di quel giorno
    const dayDateAvgs: Record<number, number[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 0: [] };

    Object.values(dateStats).forEach(ds => {
      const singleDayAvg = (ds.lunch + ds.dinner + ds.overnight) / 3;
      dayDateAvgs[ds.dayOfWeek].push(singleDayAvg);
    });

    const dayOfWeekAvg: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 0: 0 };
    [1, 2, 3, 4, 5, 6, 0].forEach(dow => {
      const avgs = dayDateAvgs[dow];
      if (avgs && avgs.length > 0) {
        const sum = avgs.reduce((a, b) => a + b, 0);
        dayOfWeekAvg[dow] = Number((sum / avgs.length).toFixed(1));
      } else {
        dayOfWeekAvg[dow] = 0;
      }
    });

    const totalActiveDays = Object.keys(dateStats).length;
    const grandTotalPresenceEvents = grandTotalLunch + grandTotalDinner + grandTotalOvernight;
    const overallAvgPresencesPerMoment = totalActiveDays > 0 ? (grandTotalPresenceEvents / (totalActiveDays * 3)).toFixed(1) : '0';
    
    // Media Pasti al Giorno (Totale Pranzi + Totale Cene diviso giorni attivi)
    const grandTotalMeals = grandTotalLunch + grandTotalDinner;
    const avgMealsPerDay = totalActiveDays > 0 ? (grandTotalMeals / totalActiveDays).toFixed(1) : '0';

    return {
      forkLeaderboard,
      pajamaLeaderboard,
      serialLuncher,
      nightCreature,
      touchAndGo,
      marathonWinner,
      topHostFamily,
      guestOfHonor,
      recordCount,
      formattedRecordDate,
      totalActiveDays,
      grandTotalLunch,
      grandTotalDinner,
      grandTotalOvernight,
      grandTotalMeals,
      avgMealsPerDay,
      overallAvgPresencesPerMoment,
      dayOfWeekAvg
    };
  }, [presences, todayStr, timeFilter, filterBounds]);

  if (!isOpen) return null;

  // Giorni ordinati Lunedì -> Domenica per l'istogramma
  const weekDaysOrdered = [
    { label: 'Lun', key: 1, full: 'Lunedì' },
    { label: 'Mar', key: 2, full: 'Martedì' },
    { label: 'Mer', key: 3, full: 'Mercoledì' },
    { label: 'Gio', key: 4, full: 'Giovedì' },
    { label: 'Ven', key: 5, full: 'Venerdì' },
    { label: 'Sab', key: 6, full: 'Sabato' },
    { label: 'Dom', key: 0, full: 'Domenica' }
  ];

  const maxAvgValue = Math.max(...Object.values(stats.dayOfWeekAvg), 1);

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
        maxWidth: '700px',
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
          padding: '24px 28px',
          borderRadius: '24px 24px 0 0',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '16px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Sparkles size={32} color="#fde047" />
          </div>
          <div style={{ paddingRight: '36px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
              Funny Stats Casa Ghirla 📊
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#c7d2fe', fontSize: '14px', fontWeight: 500 }}>
              Curiosità, record e premi goliardici della casa!
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

        {/* Barra Filtri Temporali */}
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '16px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          alignItems: 'center',
          justifyContent: 'flex-start'
        }}>
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginRight: '4px' }}>
            Periodo:
          </span>
          <div style={{
            display: 'inline-flex',
            backgroundColor: '#e2e8f0',
            padding: '4px',
            borderRadius: '16px',
            gap: '4px',
            flexWrap: 'wrap'
          }}>
            {[
              { id: 'all', label: 'Tutto' },
              { id: 'year', label: "Quest'Anno" },
              { id: 'month', label: 'Questo Mese' },
              { id: 'week', label: 'Questa Settimana' }
            ].map(f => {
              const active = timeFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setTimeFilter(f.id as TimeFilter)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: active ? '#ffffff' : 'transparent',
                    color: active ? '#4f46e5' : '#475569',
                    fontSize: '13px',
                    fontWeight: active ? 800 : 600,
                    boxShadow: active ? '0 2px 6px rgba(0, 0, 0, 0.08)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Corpo Modale */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* SEZIONE 1: I DUE PREMI PRINCIPALI CON PODIO */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '16px' }}>
            
            {/* CARD PODIO: Forchetta d'Oro */}
            <div style={{
              backgroundColor: '#fffbeb',
              border: '2px solid #fde68a',
              borderRadius: '20px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: '0 4px 12px rgba(251, 191, 36, 0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ backgroundColor: '#f59e0b', color: '#fff', padding: '10px', borderRadius: '14px', display: 'flex' }}>
                  <Trophy size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    👑 Forchetta d'Oro
                  </div>
                  <div style={{ fontSize: '12px', color: '#92400e', fontWeight: 500, marginTop: '2px' }}>
                    Chi ha partecipato a più pasti a tavola (pranzi + cene)
                  </div>
                </div>
              </div>

              {/* Podio Top 3 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {stats.forkLeaderboard.slice(0, 3).map((item, idx) => {
                  const medals = ['🥇', '🥈', '🥉'];
                  return (
                    <div key={item.person.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: idx === 0 ? 'rgba(245, 158, 11, 0.18)' : 'rgba(255, 255, 255, 0.7)',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      border: idx === 0 ? '1px solid #fcd34d' : '1px solid rgba(253, 230, 138, 0.5)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>{medals[idx]}</span>
                        <span style={{ fontWeight: idx === 0 ? 800 : 600, color: '#78350f', fontSize: '14px' }}>
                          {item.person.name}
                        </span>
                      </div>
                      <span style={{ fontWeight: 700, color: '#b45309', fontSize: '13px' }}>
                        {item.count} pasti
                      </span>
                    </div>
                  );
                })}
                {stats.forkLeaderboard.length === 0 && (
                  <div style={{ fontSize: '13px', color: '#92400e', fontStyle: 'italic', textAlign: 'center', padding: '12px' }}>
                    Nessun pasto registrato nel periodo
                  </div>
                )}
              </div>

              {/* Classifica completa espandibile */}
              {stats.forkLeaderboard.length > 3 && (
                <div>
                  <button
                    onClick={() => setShowFullForkList(!showFullForkList)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#b45309',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 0'
                    }}
                  >
                    {showFullForkList ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    {showFullForkList ? 'Mostra meno' : `Vedi tutta la classifica (${stats.forkLeaderboard.length})`}
                  </button>

                  {showFullForkList && (
                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '140px', overflowY: 'auto' }}>
                      {stats.forkLeaderboard.slice(3).map((item, idx) => (
                        <div key={item.person.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 8px', color: '#92400e' }}>
                          <span>{idx + 4}. {item.person.name}</span>
                          <span style={{ fontWeight: 600 }}>{item.count} pasti</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* CARD PODIO: Re del Pigiama Party */}
            <div style={{
              backgroundColor: '#f0f9ff',
              border: '2px solid #bae6fd',
              borderRadius: '20px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: '0 4px 12px rgba(14, 165, 233, 0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ backgroundColor: '#0284c7', color: '#fff', padding: '10px', borderRadius: '14px', display: 'flex' }}>
                  <Moon size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    🌙 Re del Pigiama Party
                  </div>
                  <div style={{ fontSize: '12px', color: '#075985', fontWeight: 500, marginTop: '2px' }}>
                    Chi ha trascorso e dormito più notti a Casa Ghirla
                  </div>
                </div>
              </div>

              {/* Podio Top 3 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {stats.pajamaLeaderboard.slice(0, 3).map((item, idx) => {
                  const medals = ['🥇', '🥈', '🥉'];
                  return (
                    <div key={item.person.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: idx === 0 ? 'rgba(2, 132, 199, 0.18)' : 'rgba(255, 255, 255, 0.7)',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      border: idx === 0 ? '1px solid #7dd3fc' : '1px solid rgba(186, 230, 253, 0.5)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>{medals[idx]}</span>
                        <span style={{ fontWeight: idx === 0 ? 800 : 600, color: '#0c4a6e', fontSize: '14px' }}>
                          {item.person.name}
                        </span>
                      </div>
                      <span style={{ fontWeight: 700, color: '#0284c7', fontSize: '13px' }}>
                        {item.count} notti
                      </span>
                    </div>
                  );
                })}
                {stats.pajamaLeaderboard.length === 0 && (
                  <div style={{ fontSize: '13px', color: '#075985', fontStyle: 'italic', textAlign: 'center', padding: '12px' }}>
                    Nessuna notte registrata nel periodo
                  </div>
                )}
              </div>

              {/* Classifica completa espandibile */}
              {stats.pajamaLeaderboard.length > 3 && (
                <div>
                  <button
                    onClick={() => setShowFullPajamaList(!showFullPajamaList)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0369a1',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 0'
                    }}
                  >
                    {showFullPajamaList ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    {showFullPajamaList ? 'Mostra meno' : `Vedi tutta la classifica (${stats.pajamaLeaderboard.length})`}
                  </button>

                  {showFullPajamaList && (
                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '140px', overflowY: 'auto' }}>
                      {stats.pajamaLeaderboard.slice(3).map((item, idx) => (
                        <div key={item.person.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 8px', color: '#075985' }}>
                          <span>{idx + 4}. {item.person.name}</span>
                          <span style={{ fontWeight: 600 }}>{item.count} notti</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* SEZIONE 2: NUOVI TITOLI GOLIARDICI CON SPIEGAZIONI */}
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Crown size={18} color="#eab308" />
              <span>Titoli & Menzioni d'Onore</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              
              {/* Il Pranzatore Seriale */}
              <div style={{
                backgroundColor: '#fef3c7',
                border: '1px solid #fde68a',
                borderRadius: '16px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b45309', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>
                  <Sun size={16} />
                  <span>Pranzatore Seriale</span>
                </div>
                <div style={{ fontSize: '11px', color: '#92400e', lineHeight: '1.3', minHeight: '28px' }}>
                  Chi ha il record di presenze al pranzo di mezzogiorno
                </div>
                <div style={{ marginTop: '4px', borderTop: '1px solid rgba(245, 158, 11, 0.2)', paddingTop: '6px' }}>
                  <div style={{ fontSize: '17px', fontWeight: 800, color: '#78350f' }}>
                    {stats.serialLuncher ? stats.serialLuncher.person.name : 'N/D'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#b45309', fontWeight: 600 }}>
                    {stats.serialLuncher ? `${stats.serialLuncher.lunch} pranzi gustati` : '-'}
                  </div>
                </div>
              </div>

              {/* Creatura della Notte */}
              <div style={{
                backgroundColor: '#ede9fe',
                border: '1px solid #ddd6fe',
                borderRadius: '16px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6d28d9', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>
                  <Wine size={16} />
                  <span>Creatura della Notte</span>
                </div>
                <div style={{ fontSize: '11px', color: '#5b21b6', lineHeight: '1.3', minHeight: '28px' }}>
                  Chi non manca mai quando si accendono le luci della cena
                </div>
                <div style={{ marginTop: '4px', borderTop: '1px solid rgba(109, 40, 217, 0.2)', paddingTop: '6px' }}>
                  <div style={{ fontSize: '17px', fontWeight: 800, color: '#4c1d95' }}>
                    {stats.nightCreature ? stats.nightCreature.person.name : 'N/D'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6d28d9', fontWeight: 600 }}>
                    {stats.nightCreature ? `${stats.nightCreature.dinner} cene a tavola` : '-'}
                  </div>
                </div>
              </div>

              {/* Toccata e Fuga */}
              <div style={{
                backgroundColor: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>
                  <Footprints size={16} />
                  <span>Toccata e Fuga</span>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.3', minHeight: '28px' }}>
                  Chi viene a mangiare più spesso senza mai fermarsi a dormire
                </div>
                <div style={{ marginTop: '4px', borderTop: '1px solid rgba(100, 116, 139, 0.2)', paddingTop: '6px' }}>
                  <div style={{ fontSize: '17px', fontWeight: 800, color: '#1e293b' }}>
                    {stats.touchAndGo ? stats.touchAndGo.person.name : 'N/D'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>
                    {stats.touchAndGo ? `${stats.touchAndGo.meals} pasti (0 notti)` : 'Tutti hanno dormito!'}
                  </div>
                </div>
              </div>

              {/* La Maratona */}
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '16px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>
                  <Flame size={16} />
                  <span>La Maratona</span>
                </div>
                <div style={{ fontSize: '11px', color: '#b91c1c', lineHeight: '1.3', minHeight: '28px' }}>
                  Record assoluto di giorni consecutivi di presenza a Ghirla
                </div>
                <div style={{ marginTop: '4px', borderTop: '1px solid rgba(220, 38, 38, 0.2)', paddingTop: '6px' }}>
                  <div style={{ fontSize: '17px', fontWeight: 800, color: '#991b1b' }}>
                    {stats.marathonWinner ? (stats.marathonWinner as MarathonItem).person.name : 'N/D'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: 600 }}>
                    {stats.marathonWinner ? `${(stats.marathonWinner as MarathonItem).streak} giorni di fila` : '-'}
                  </div>
                </div>
              </div>

              {/* Calamita per Ospiti */}
              <div style={{
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '16px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>
                  <UserPlus size={16} />
                  <span>Calamita Ospiti</span>
                </div>
                <div style={{ fontSize: '11px', color: '#047857', lineHeight: '1.3', minHeight: '28px' }}>
                  La famiglia che ha invitato e portato più presenze di ospiti esterni
                </div>
                <div style={{ marginTop: '4px', borderTop: '1px solid rgba(5, 150, 105, 0.2)', paddingTop: '6px' }}>
                  <div style={{ fontSize: '17px', fontWeight: 800, color: '#065f46', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {stats.topHostFamily ? (stats.topHostFamily as TopHostFamilyItem).familyName : 'N/D'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>
                    {stats.topHostFamily ? `${(stats.topHostFamily as TopHostFamilyItem).count} presenze ospiti` : 'Nessun ospite'}
                  </div>
                </div>
              </div>

              {/* L'Ospite d'Onore */}
              <div style={{
                backgroundColor: '#fdf4ff',
                border: '1px solid #f5d0fe',
                borderRadius: '16px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#c026d3', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>
                  <UserCheck size={16} />
                  <span>Ospite d'Onore</span>
                </div>
                <div style={{ fontSize: '11px', color: '#a21caf', lineHeight: '1.3', minHeight: '28px' }}>
                  Il singolo ospite esterno più affezionato e presente
                </div>
                <div style={{ marginTop: '4px', borderTop: '1px solid rgba(192, 38, 211, 0.2)', paddingTop: '6px' }}>
                  <div style={{ fontSize: '17px', fontWeight: 800, color: '#86198f', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {stats.guestOfHonor ? stats.guestOfHonor.person.name.replace(' (Ospite)', '') : 'N/D'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#c026d3', fontWeight: 600 }}>
                    {stats.guestOfHonor ? `${stats.guestOfHonor.count} eventi presenti` : 'Nessun ospite'}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* SEZIONE 3: ISTOGRAMMA & MEDIE CON SPIEGAZIONI */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '20px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}>
            {/* Header Istogramma con Targhette in evidenza */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={20} color="#4f46e5" />
                <span>Affluenza nei Giorni della Settimana</span>
              </div>

              {/* Targhette in evidenza */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{
                  backgroundColor: '#fdf2f8',
                  border: '1px solid #fbcfe8',
                  color: '#831843',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>🍽️ Media Pasti/Giorno:</span>
                  <strong style={{ color: '#db2777', fontSize: '14px', fontWeight: 800 }}>{stats.avgMealsPerDay}</strong>
                </div>

                <div style={{
                  backgroundColor: '#ede9fe',
                  border: '1px solid #ddd6fe',
                  color: '#4c1d95',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>👥 Presenze per Momento:</span>
                  <strong style={{ color: '#6d28d9', fontSize: '14px', fontWeight: 800 }}>{stats.overallAvgPresencesPerMoment}</strong>
                </div>
              </div>
            </div>

            {/* Spiegazione Formule e Calcoli */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '12px',
              color: '#64748b'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                <Info size={16} style={{ flexShrink: 0, marginTop: '1px', color: '#6366f1' }} />
                <span style={{ color: '#334155', fontWeight: 700 }}>
                  Come sono calcolati i dati:
                </span>
              </div>
              <ul style={{ margin: '0 0 0 20px', padding: 0, lineHeight: '1.4', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li>
                  <strong>Media Pasti / Giorno ({stats.avgMealsPerDay}):</strong> somma complessiva di tutti i pranzi e cene consumati diviso il numero di giorni attivi del periodo ({stats.totalActiveDays} giorni).
                </li>
                <li>
                  <strong>Barre Istogramma (Media presenze per giorno):</strong> media delle presenze tra pranzo, cena e notte per ciascun giorno della settimana (calcolata come <em>(pranzo + cena + notte) / 3</em> su ogni data, mediata poi su tutte le settimane del periodo).
                </li>
              </ul>
            </div>

            {/* Barre Istogramma */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              height: '130px',
              paddingTop: '20px',
              paddingBottom: '6px',
              gap: '8px'
            }}>
              {weekDaysOrdered.map(item => {
                const avgVal = stats.dayOfWeekAvg[item.key] || 0;
                const percentage = Math.round((avgVal / maxAvgValue) * 100);
                const isMax = avgVal === maxAvgValue && avgVal > 0;

                return (
                  <div key={item.key} style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    justifyContent: 'flex-end',
                    gap: '6px'
                  }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: isMax ? '#4f46e5' : '#475569' }}>
                      {avgVal > 0 ? avgVal : '0'}
                    </span>
                    <div style={{
                      width: '100%',
                      maxWidth: '38px',
                      height: `${Math.max(percentage, 6)}%`,
                      backgroundColor: isMax ? '#4f46e5' : '#cbd5e1',
                      borderRadius: '8px 8px 0 0',
                      transition: 'height 0.4s ease-out, background-color 0.2s',
                      boxShadow: isMax ? '0 4px 12px rgba(79, 70, 229, 0.35)' : 'none'
                    }} />
                    <span style={{
                      fontSize: '12px',
                      fontWeight: isMax ? 800 : 600,
                      color: isMax ? '#4f46e5' : '#64748b'
                    }}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SEZIONE 4: BANNER TOTALI E RECORD */}
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '18px',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>🍝 Pranzi</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>{stats.grandTotalLunch}</div>
            </div>
            <div style={{ width: '1px', height: '28px', backgroundColor: '#cbd5e1' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>🍷 Cene</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>{stats.grandTotalDinner}</div>
            </div>
            <div style={{ width: '1px', height: '28px', backgroundColor: '#cbd5e1' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>🛏️ Notti</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>{stats.grandTotalOvernight}</div>
            </div>
            <div style={{ width: '1px', height: '28px', backgroundColor: '#cbd5e1' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>🔥 Record Affluenza</div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#ea580c' }}>
                {stats.recordCount > 0 ? `${stats.recordCount} pers. (${stats.formattedRecordDate})` : '0'}
              </div>
            </div>
          </div>

          {/* Note a piè di modale */}
          <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', fontStyle: 'italic' }}>
            * Le classifiche individuali e i titoli escludono Stefano ed Elena.
          </div>

        </div>
      </div>
    </div>
  );
};
