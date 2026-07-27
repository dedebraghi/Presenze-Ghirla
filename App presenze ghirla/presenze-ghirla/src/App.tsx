import React, { useState } from 'react';
import type { PresenceEntry, FamilyGroup, Person } from './data/familyData';
import { FAMILY_GROUPS, ALL_PEOPLE } from './data/familyData';
import { QuickAddModal } from './components/QuickAddModal';
import { DayDetailModal } from './components/DayDetailModal';
import {
  Plus,
  Users,
  Utensils,
  ChevronLeft,
  ChevronRight,
  Home
} from 'lucide-react';

import { 
  fetchPresencesFromCloud, 
  batchSavePresenceEntriesToCloud, 
  getLocalPresences 
} from './utils/presenceStorage';
import { supabase } from './utils/supabaseClient';
import { 
  getStoredGoogleToken, 
  requestGoogleCalendarAccess, 
  logoutGoogleCalendar, 
  syncPresenceToGoogleCalendar 
} from './utils/googleCalendarApi';

export const App: React.FC = () => {
  const [presences, setPresences] = useState<Record<string, PresenceEntry>>(() => {
    return getLocalPresences();
  });

  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(() => {
    return !!getStoredGoogleToken();
  });

  // Funzione helper per ottenere o generare la presenza considerando che Stefano ed Elena sono di default presenti (pranzo, cena, notte)
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

  // Sottoscrizione ai cambiamenti in tempo reale (Realtime)
  React.useEffect(() => {
    const loadData = async () => {
      const data = await fetchPresencesFromCloud();
      setPresences(data);
    };

    loadData();

    // Sottoscrizione ai cambiamenti in tempo reale (Realtime)
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'presences' },
        (payload: any) => {
          if (payload.new && payload.new.id) {
            setPresences(prev => {
              const updated = {
                ...prev,
                [payload.new.id]: {
                  date: payload.new.date,
                  personId: payload.new.person_id,
                  lunch: payload.new.lunch,
                  dinner: payload.new.dinner,
                  overnight: payload.new.overnight,
                }
              };
              localStorage.setItem('ghirla_presences_v1', JSON.stringify(updated));
              return updated;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSavePresences = async (updated: Record<string, PresenceEntry>) => {
    setPresences(updated);
    await batchSavePresenceEntriesToCloud(updated);

    // Se Google Calendar è connesso, effettua la sincronizzazione automatica degli eventi
    if (getStoredGoogleToken()) {
      Object.values(updated).forEach((entry) => {
        const hasPresence = entry.lunch || entry.dinner || entry.overnight;
        const person = ALL_PEOPLE.find(p => p.id === entry.personId);
        const personName = person ? person.name : entry.personId;
        const details = `Presenza Ghirla per ${personName} (${entry.lunch ? 'Pranzo ' : ''}${entry.dinner ? 'Cena ' : ''}${entry.overnight ? 'Pernottamento' : ''})`;

        syncPresenceToGoogleCalendar(entry.date, personName, hasPresence, details);
      });
    }
  };

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [selectedDayDetail, setSelectedDayDetail] = useState<string | null>(null);

  const [activeFamilyFilter, setActiveFamilyFilter] = useState<string | null>(null);
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  const today = new Date();
  const next7Days = Array.from({ length: 7 }, (_, i: number) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  let startDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6;

  const totalDaysInMonth = lastDayOfMonth.getDate();
  
  const monthDaysArray: (string | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    monthDaysArray.push(null);
  }
  for (let day = 1; day <= totalDaysInMonth; day++) {
    const d = new Date(year, month, day);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    monthDaysArray.push(`${yyyy}-${mm}-${dd}`);
  }

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', paddingBottom: '60px' }}>
      
      <header style={{
        backgroundColor: '#1e3a8a',
        color: '#ffffff',
        padding: '24px 20px',
        boxShadow: '0 4px 20px rgba(30, 58, 138, 0.25)',
        borderBottom: '4px solid #ea580c'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              backgroundColor: '#ea580c',
              color: '#ffffff',
              padding: '14px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(234, 88, 12, 0.4)'
            }}>
              <Home size={32} />
            </div>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.1 }}>
                Casa Ghirla Presenze
              </h1>
              <p style={{ color: '#93c5fd', fontSize: '16px', fontWeight: 500, marginTop: '4px' }}>
                Per Stefano, Elena e tutta la famiglia ❤️
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => {
                if (isGoogleConnected) {
                  logoutGoogleCalendar();
                  setIsGoogleConnected(false);
                } else {
                  requestGoogleCalendarAccess(
                    () => setIsGoogleConnected(true),
                    (err) => alert('Impossibile connettere Google Calendar: ' + JSON.stringify(err))
                  );
                }
              }}
              style={{
                backgroundColor: isGoogleConnected ? '#16a34a' : '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '14px 18px',
                borderRadius: '16px',
                fontWeight: 700,
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <span>{isGoogleConnected ? '✅ Google Calendar Connesso' : '📅 Connetti Google Calendar'}</span>
            </button>

            <button
              onClick={() => setIsQuickAddOpen(true)}
              style={{
                backgroundColor: '#ea580c',
                color: '#ffffff',
                border: 'none',
                padding: '14px 22px',
                borderRadius: '16px',
                fontWeight: 800,
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(234, 88, 12, 0.4)',
                cursor: 'pointer'
              }}
            >
              <Plus size={24} />
              Segna Presenza
            </button>
          </div>

        </div>
      </header>

      <main style={{ maxWidth: '1100px', margin: '24px auto', padding: '0 16px' }}>

        <section style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Utensils color="#ea580c" size={26} />
              Chi c'è in casa questa settimana?
            </h2>
            <span style={{ fontSize: '15px', color: '#64748b', fontWeight: 600 }}>
              Pasti & Pernottamenti
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px'
          }}>
            {next7Days.map((dateStr: string, idx: number) => {
              const d = new Date(dateStr);
              const isToday = idx === 0;
              const dayName = d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });

              const dayEntries = ALL_PEOPLE.map((p: Person) => {
                const entry = getEntryWithDefault(dateStr, p.id);
                return { person: p, entry };
              }).filter((item: { person: Person; entry: PresenceEntry }) => item.entry && (item.entry.lunch || item.entry.dinner || item.entry.overnight));

              const countLunch = dayEntries.filter((i: { entry: PresenceEntry }) => i.entry.lunch).length;
              const countDinner = dayEntries.filter((i: { entry: PresenceEntry }) => i.entry.dinner).length;
              const countOvernight = dayEntries.filter((i: { entry: PresenceEntry }) => i.entry.overnight).length;

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDayDetail(dateStr)}
                  style={{
                    backgroundColor: isToday ? '#eff6ff' : '#ffffff',
                    border: isToday ? '3px solid #2563eb' : '1.5px solid #e2e8f0',
                    borderRadius: '20px',
                    padding: '18px',
                    cursor: 'pointer',
                    boxShadow: isToday ? '0 8px 20px rgba(37, 99, 235, 0.12)' : '0 2px 8px rgba(0,0,0,0.03)',
                    position: 'relative'
                  }}
                >
                  {isToday && (
                    <span style={{
                      position: 'absolute',
                      top: '-12px',
                      right: '16px',
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '12px',
                      textTransform: 'uppercase'
                    }}>
                      Oggi
                    </span>
                  )}

                  <div style={{ fontWeight: 800, fontSize: '19px', color: '#1e293b', textTransform: 'capitalize', marginBottom: '12px' }}>
                    {dayName}
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    backgroundColor: isToday ? '#ffffff' : '#f8fafc',
                    padding: '10px 12px',
                    borderRadius: '14px',
                    marginBottom: '12px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#ea580c', fontWeight: 700, display: 'block' }}>☀️ Pranzo</span>
                      <strong style={{ fontSize: '20px', color: '#ea580c' }}>{countLunch}</strong>
                    </div>

                    <div style={{ textAlign: 'center', borderLeft: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', padding: '0 8px' }}>
                      <span style={{ fontSize: '12px', color: '#d97706', fontWeight: 700, display: 'block' }}>🌙 Cena</span>
                      <strong style={{ fontSize: '20px', color: '#d97706' }}>{countDinner}</strong>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#4338ca', fontWeight: 700, display: 'block' }}>🛏️ Notte</span>
                      <strong style={{ fontSize: '20px', color: '#4338ca' }}>{countOvernight}</strong>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      Presenti ({dayEntries.length}):
                    </span>
                    
                    {dayEntries.length === 0 ? (
                      <span style={{ fontSize: '14px', color: '#94a3b8', fontStyle: 'italic' }}>Nessuna presenza ancora</span>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {dayEntries.map(({ person }: { person: Person }) => (
                          <span key={person.id} style={{
                            fontSize: '13px',
                            fontWeight: '700',
                            backgroundColor: person.avatarBg || '#1e3a8a',
                            color: '#ffffff',
                            padding: '3px 8px',
                            borderRadius: '8px'
                          }}>
                            {person.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Users size={22} color="#1e3a8a" />
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>
              Filtra Calendario per Famiglia:
            </h3>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button
              onClick={() => setActiveFamilyFilter(null)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                backgroundColor: activeFamilyFilter === null ? '#1e3a8a' : '#ffffff',
                color: activeFamilyFilter === null ? '#ffffff' : '#475569',
                fontWeight: 700,
                fontSize: '14px',
                border: '1.5px solid #cbd5e1',
                cursor: 'pointer'
              }}
            >
              Tutti i 20 componenti
            </button>

            {FAMILY_GROUPS.map((group: FamilyGroup) => {
              const isActive = activeFamilyFilter === group.id;
              return (
                <button
                  key={group.id}
                  onClick={() => setActiveFamilyFilter(isActive ? null : group.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    backgroundColor: isActive ? group.badgeColor : '#ffffff',
                    color: isActive ? '#ffffff' : group.badgeColor,
                    fontWeight: 700,
                    fontSize: '14px',
                    border: `2px solid ${group.badgeColor}`,
                    cursor: 'pointer'
                  }}
                >
                  {group.name}
                </button>
              );
            })}
          </div>
        </section>

        <section style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
          border: '1.5px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1e3a8a', textTransform: 'capitalize' }}>
              📆 {currentMonthDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
            </h2>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handlePrevMonth}
                style={{
                  padding: '10px 16px',
                  borderRadius: '14px',
                  backgroundColor: '#f1f5f9',
                  color: '#1e293b',
                  fontWeight: 700,
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}
              >
                <ChevronLeft size={20} /> Mese Prec.
              </button>

              <button
                onClick={handleNextMonth}
                style={{
                  padding: '10px 16px',
                  borderRadius: '14px',
                  backgroundColor: '#f1f5f9',
                  color: '#1e293b',
                  fontWeight: 700,
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}
              >
                Mese Succ. <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '8px', textAlign: 'center' }}>
            {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((d: string, i: number) => (
              <div key={d} style={{ fontWeight: 800, fontSize: '15px', color: i >= 5 ? '#ea580c' : '#64748b', padding: '8px 0' }}>
                {d}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
            {monthDaysArray.map((dateStr: string | null, idx: number) => {
              if (!dateStr) {
                return (
                  <div
                    key={`empty_${idx}`}
                    style={{
                      aspectRatio: '1',
                      minHeight: '60px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '12px',
                      opacity: 0.4
                    }}
                  />
                );
              }

              const d = new Date(dateStr);
              const dayNum = d.getDate();
              const isTodayCell = dateStr === today.toISOString().split('T')[0];

              const dayEntries = ALL_PEOPLE
                .filter((p: Person) => !activeFamilyFilter || p.familyId === activeFamilyFilter)
                .map((p: Person) => {
                  const entry = getEntryWithDefault(dateStr, p.id);
                  return { person: p, entry };
                })
                .filter((item: { person: Person; entry: PresenceEntry }) => item.entry && (item.entry.lunch || item.entry.dinner || item.entry.overnight));

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDayDetail(dateStr)}
                  style={{
                    aspectRatio: '1',
                    minHeight: '60px',
                    backgroundColor: isTodayCell ? '#eff6ff' : '#ffffff',
                    border: isTodayCell ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    borderRadius: '14px',
                    padding: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    boxSizing: 'border-box'
                  }}
                >
                  <span style={{
                    fontWeight: 800,
                    fontSize: '14px',
                    color: isTodayCell ? '#2563eb' : '#1e293b',
                    backgroundColor: isTodayCell ? '#dbeafe' : 'transparent',
                    padding: '1px 6px',
                    borderRadius: '6px'
                  }}>
                    {dayNum}
                  </span>

                  {dayEntries.length > 0 ? (
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      backgroundColor: '#1e3a8a',
                      color: '#ffffff',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '2px',
                      lineHeight: 1
                    }}>
                      {dayEntries.length} 👤
                    </span>
                  ) : (
                    <div style={{ height: '16px' }} />
                  )}
                </div>
              );
            })}
          </div>

        </section>

      </main>

      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        presences={presences}
        onSavePresences={handleSavePresences}
      />

      {selectedDayDetail && (
        <DayDetailModal
          dateStr={selectedDayDetail}
          isOpen={Boolean(selectedDayDetail)}
          onClose={() => setSelectedDayDetail(null)}
          presences={presences}
          onSavePresences={handleSavePresences}
        />
      )}

    </div>
  );
};

export default App;
