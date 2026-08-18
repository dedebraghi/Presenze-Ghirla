import React, { useState } from 'react';
import type { PresenceEntry, FamilyGroup, Person } from './data/familyData';
import { FAMILY_GROUPS, ALL_PEOPLE, getPersonById } from './data/familyData';
import { QuickAddModal } from './components/QuickAddModal';
import { DayDetailModal } from './components/DayDetailModal';
import { AddGuestModal } from './components/AddGuestModal';
import { FunnyStatsModal } from './components/FunnyStatsModal';
import { SpecialOccasionBanner } from './components/SpecialOccasionBanner';
import { CustomEventBanner } from './components/CustomEventBanner';
import { CreateSpecialEventModal } from './components/CreateSpecialEventModal';
import { EventRsvpModal } from './components/EventRsvpModal';
import type { CustomEvent, EventRsvp } from './data/customEventsData';
import {
  fetchCustomEventsFromCloud,
  saveCustomEventToCloud,
  deleteCustomEventFromCloud,
  updateEventRsvpInCloud,
  getLocalCustomEvents
} from './utils/customEventsStorage';
import {
  Plus,
  Users,
  Utensils,
  ChevronLeft,
  ChevronRight,
  Home,
  Download,
  UserPlus,
  BarChart3,
  Sparkles
} from 'lucide-react';

import { 
  fetchPresencesFromCloud, 
  batchSavePresenceEntriesToCloud, 
  deletePersonPresencesFromCloud,
  getLocalPresences 
} from './utils/presenceStorage';
import { supabase } from './utils/supabaseClient';
import { getLocalDateString } from './utils/dateUtils';
import { getOccasionsForDate } from './data/specialOccasions';

export const App: React.FC = () => {
  const [presences, setPresences] = useState<Record<string, PresenceEntry>>(() => {
    return getLocalPresences();
  });

  const [customEvents, setCustomEvents] = useState<Record<string, CustomEvent>>(() => {
    return getLocalCustomEvents();
  });
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CustomEvent | null>(null);
  const [rsvpEvent, setRsvpEvent] = useState<CustomEvent | null>(null);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(() => {
    return window.matchMedia('(display-mode: standalone)').matches;
  });

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else if (isAppInstalled) {
      alert("L'applicazione è già installata sul tuo dispositivo.");
    } else {
      // Indicazioni manuali se il browser non supporta l'evento automatico o è iOS Safari / Chrome già pronto
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIOS) {
        alert("Per installare l'app su iOS (iPhone/iPad):\n1. Tocca il tasto Condividi (icona col quadrato e freccia in alto)\n2. Seleziona 'Aggiungi alla schermata Home'");
      } else {
        alert("Per installare l'app dal browser:\n- Su Chrome/Edge/Android: tocca il menu a tre pallini in alto a destra e seleziona 'Installa app' o 'Aggiungi a schermata Home'.");
      }
    }
  };

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

  const getDayEntries = (dateStr: string) => {
    const entriesMap = new Map<string, { person: Person; entry: PresenceEntry }>();

    ALL_PEOPLE.forEach((p: Person) => {
      if (!activeFamilyFilter || p.familyId === activeFamilyFilter) {
        const entry = getEntryWithDefault(dateStr, p.id);
        if (entry.lunch || entry.dinner || entry.overnight) {
          entriesMap.set(p.id, { person: p, entry });
        }
      }
    });

    const datePrefix = `${dateStr}_`;
    const guestEntriesList: { person: Person; entry: PresenceEntry }[] = [];

    Object.keys(presences).forEach((key: string) => {
      if (key.startsWith(datePrefix)) {
        const personId = key.substring(datePrefix.length);
        if (personId.startsWith('guest_') && !entriesMap.has(personId)) {
          const entry = presences[key];
          if (entry && (entry.lunch || entry.dinner || entry.overnight)) {
            const person = getPersonById(personId);
            if (!activeFamilyFilter || person.familyId === activeFamilyFilter || activeFamilyFilter === 'ospiti') {
              guestEntriesList.push({ person, entry });
            }
          }
        }
      }
    });

    // Deduplica o unisci gli ospiti con lo stesso nome pulito se si applica la vista globale
    const deduplicatedGuestMap = new Map<string, { person: Person; entry: PresenceEntry }>();
    guestEntriesList.forEach(item => {
      const cleanNameKey = item.person.name.toLowerCase().trim();
      if (!deduplicatedGuestMap.has(cleanNameKey)) {
        deduplicatedGuestMap.set(cleanNameKey, {
          person: item.person,
          entry: { ...item.entry }
        });
      } else {
        const existing = deduplicatedGuestMap.get(cleanNameKey)!;
        existing.entry.lunch = existing.entry.lunch || item.entry.lunch;
        existing.entry.dinner = existing.entry.dinner || item.entry.dinner;
        existing.entry.overnight = existing.entry.overnight || item.entry.overnight;
      }
    });

    deduplicatedGuestMap.forEach((item, _key) => {
      entriesMap.set(item.person.id, item);
    });

    return Array.from(entriesMap.values());
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

  // Sottoscrizione ed ascolto eventi speciali personalizzati (Realtime)
  React.useEffect(() => {
    const loadCustomEvents = async () => {
      const data = await fetchCustomEventsFromCloud();
      setCustomEvents(data);
    };

    loadCustomEvents();

    const customChannel = supabase
      .channel('custom-events-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'custom_events' },
        () => {
          loadCustomEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(customChannel);
    };
  }, []);

  const handleSaveCustomEvent = async (event: CustomEvent) => {
    const updated = await saveCustomEventToCloud(event);
    setCustomEvents(updated);
    setEditingEvent(null);
  };

  const handleDeleteCustomEvent = async (eventId: string) => {
    const updated = await deleteCustomEventFromCloud(eventId);
    setCustomEvents(updated);
  };

  const handleSaveEventRsvp = async (eventId: string, rsvp: EventRsvp) => {
    const updated = await updateEventRsvpInCloud(eventId, rsvp);
    setCustomEvents(updated);
    setRsvpEvent(null);
  };

  const handleSavePresences = async (updated: Record<string, PresenceEntry>) => {
    setPresences(updated);
    await batchSavePresenceEntriesToCloud(updated);

    // Sincronizzazione automatica permanente su Google Calendar tramite Supabase Edge Function
    const affectedDates = Array.from(new Set(Object.values(updated).map(entry => entry.date)));
    if (affectedDates.length > 0) {
      supabase.functions.invoke('sync-google-calendar', {
        body: { dateStrs: affectedDates }
      }).catch(err => console.error('Errore invocazione sync-google-calendar:', err));
    }
  };

  const handleDeleteGuestInCloud = async (personId: string) => {
    const updated = await deletePersonPresencesFromCloud(personId);
    setPresences(updated);

    const affectedDates = Array.from(new Set(Object.values(updated).map(entry => entry.date)));
    if (affectedDates.length > 0) {
      supabase.functions.invoke('sync-google-calendar', {
        body: { dateStrs: affectedDates }
      }).catch(err => console.error('Errore invocazione sync-google-calendar:', err));
    }
  };

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isAddGuestOpen, setIsAddGuestOpen] = useState(false);
  const [isFunnyStatsOpen, setIsFunnyStatsOpen] = useState(false);
  const [selectedDayDetail, setSelectedDayDetail] = useState<string | null>(null);

  const handleSavePresencesWithGuest = async (updated: Record<string, PresenceEntry>, _newGuest?: Person) => {
    await handleSavePresences(updated);
  };

  const [activeFamilyFilter, setActiveFamilyFilter] = useState<string | null>(null);
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  const today = new Date();
  const todayStr = getLocalDateString(today);
  const next7Days = Array.from({ length: 7 }, (_, i: number) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return getLocalDateString(d);
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

  const headerPhotos = [
    '/PXL_20260711_193548782.NIGHT.jpg',
    '/PXL_20260711_193540212.MP.jpg'
  ];
  const [currentHeaderPhotoIndex, setCurrentHeaderPhotoIndex] = useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeaderPhotoIndex((prevIndex) => (prevIndex + 1) % headerPhotos.length);
    }, 6000); // Cambia foto ogni 6 secondi

    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', paddingBottom: '60px' }}>
      
      <header style={{
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.65), rgba(15, 23, 42, 0.75)), url('${headerPhotos[currentHeaderPhotoIndex]}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: '#ffffff',
        padding: '36px 20px',
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.4)',
        borderBottom: '4px solid #ea580c',
        position: 'relative',
        transition: 'background-image 1.2s ease-in-out'
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
            {!isAppInstalled && (
              <button
                onClick={handleInstallClick}
                title="Installa App sul tuo dispositivo"
                style={{
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  padding: '14px 18px',
                  borderRadius: '16px',
                  fontWeight: 700,
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                }}
              >
                <Download size={20} />
                <span>📱 Installa App</span>
              </button>
            )}

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

            <button
              onClick={() => setIsAddGuestOpen(true)}
              style={{
                backgroundColor: '#059669',
                color: '#ffffff',
                border: 'none',
                padding: '14px 20px',
                borderRadius: '16px',
                fontWeight: 800,
                fontSize: '17px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)',
                cursor: 'pointer'
              }}
            >
              <UserPlus size={22} />
              + Ospite / Esterno
            </button>

            <button
              onClick={() => {
                setEditingEvent(null);
                setIsCreateEventOpen(true);
              }}
              title="Crea o proponi un evento speciale alla famiglia"
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '14px 20px',
                borderRadius: '16px',
                fontWeight: 800,
                fontSize: '17px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)',
                cursor: 'pointer',
                transition: 'transform 0.15s ease'
              }}
            >
              <Sparkles size={22} />
              🎪 Crea Evento Speciale
            </button>

            <button
              onClick={() => setIsFunnyStatsOpen(true)}
              title="Vedi le statistiche divertenti di Casa Ghirla"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '14px 20px',
                borderRadius: '16px',
                fontWeight: 800,
                fontSize: '17px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                cursor: 'pointer',
                transition: 'transform 0.15s ease, boxShadow 0.15s ease'
              }}
            >
              <BarChart3 size={22} />
              📊 Funny Stats
            </button>
          </div>

        </div>
      </header>

      <main style={{ maxWidth: '1100px', margin: '24px auto', padding: '0 16px' }}>
        <SpecialOccasionBanner onOpenDateDetail={(dateStr) => setSelectedDayDetail(dateStr)} />

        <CustomEventBanner
          events={customEvents}
          onOpenRsvp={(event) => setRsvpEvent(event)}
          onEditEvent={(event) => {
            setEditingEvent(event);
            setIsCreateEventOpen(true);
          }}
          onDeleteEvent={handleDeleteCustomEvent}
        />

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

              const dayEntries = getDayEntries(dateStr);

              const countLunch = dayEntries.filter((i: { entry: PresenceEntry }) => i.entry.lunch).length;
              const countDinner = dayEntries.filter((i: { entry: PresenceEntry }) => i.entry.dinner).length;
              const countOvernight = dayEntries.filter((i: { entry: PresenceEntry }) => i.entry.overnight).length;

              const occasions = getOccasionsForDate(dateStr);

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

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                    <div style={{ fontWeight: 800, fontSize: '19px', color: '#1e293b', textTransform: 'capitalize' }}>
                      {dayName}
                    </div>

                    {occasions.map(occ => (
                      <span
                        key={occ.title}
                        title={occ.description || occ.title}
                        style={{
                          backgroundColor: occ.type === 'birthday' ? '#fdf2f8' : occ.type === 'anniversary' ? '#fef3c7' : '#ecfdf5',
                          color: occ.type === 'birthday' ? '#db2777' : occ.type === 'anniversary' ? '#b45309' : '#047857',
                          border: `1px solid ${occ.type === 'birthday' ? '#fbcfe8' : occ.type === 'anniversary' ? '#fde68a' : '#a7f3d0'}`,
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '10px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                        }}
                      >
                        {occ.type === 'birthday' ? '🎂' : occ.type === 'anniversary' ? '💍' : '😇'} {occ.title}
                      </span>
                    ))}
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
          padding: '16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
          border: '1.5px solid #e2e8f0',
          overflowX: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1e3a8a', textTransform: 'capitalize' }}>
              📆 {currentMonthDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
            </h2>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handlePrevMonth}
                style={{
                  padding: '8px 12px',
                  borderRadius: '12px',
                  backgroundColor: '#f1f5f9',
                  color: '#1e293b',
                  fontWeight: 700,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}
              >
                <ChevronLeft size={18} /> Prec.
              </button>

              <button
                onClick={handleNextMonth}
                style={{
                  padding: '8px 12px',
                  borderRadius: '12px',
                  backgroundColor: '#f1f5f9',
                  color: '#1e293b',
                  fontWeight: 700,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}
              >
                Succ. <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div style={{ width: '100%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '6px', textAlign: 'center' }}>
              {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((d: string, i: number) => (
                <div key={d} style={{ fontWeight: 800, fontSize: '13px', color: i >= 5 ? '#ea580c' : '#64748b', padding: '4px 0' }}>
                  {d}
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {monthDaysArray.map((dateStr: string | null, idx: number) => {
                if (!dateStr) {
                  return (
                    <div
                      key={`empty_${idx}`}
                      style={{
                        aspectRatio: '1',
                        minHeight: '40px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '10px',
                        opacity: 0.4
                      }}
                    />
                  );
                }

                const d = new Date(dateStr);
                const dayNum = d.getDate();
                const isTodayCell = dateStr === todayStr;

                const dayEntries = getDayEntries(dateStr);

                return (
                  <div
                    key={dateStr}
                    onClick={() => setSelectedDayDetail(dateStr)}
                    style={{
                      aspectRatio: '1',
                      minHeight: '40px',
                      backgroundColor: isTodayCell ? '#eff6ff' : '#ffffff',
                      border: isTodayCell ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      borderRadius: '10px',
                      padding: '2px 1px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-around',
                      alignItems: 'center',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                      boxSizing: 'border-box'
                    }}
                  >
                    <span style={{
                      fontWeight: 800,
                      fontSize: '12px',
                      color: isTodayCell ? '#2563eb' : '#1e293b',
                      backgroundColor: isTodayCell ? '#dbeafe' : 'transparent',
                      padding: '0px 4px',
                      borderRadius: '4px',
                      lineHeight: 1.1
                    }}>
                      {dayNum}
                    </span>

                    {dayEntries.length > 0 ? (
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        backgroundColor: '#1e3a8a',
                        color: '#ffffff',
                        padding: '1px 4px',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '1px',
                        lineHeight: 1
                      }}>
                        {dayEntries.length}👤
                      </span>
                    ) : (
                      <div style={{ height: '12px' }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

      </main>

      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        presences={presences}
        onSavePresences={handleSavePresences}
      />

      <AddGuestModal
        isOpen={isAddGuestOpen}
        onClose={() => setIsAddGuestOpen(false)}
        presences={presences}
        onSavePresences={handleSavePresencesWithGuest}
      />

      {selectedDayDetail && (
        <DayDetailModal
          dateStr={selectedDayDetail}
          isOpen={Boolean(selectedDayDetail)}
          onClose={() => setSelectedDayDetail(null)}
          presences={presences}
          onSavePresences={handleSavePresences}
          onDeleteGuest={handleDeleteGuestInCloud}
        />
      )}

      <FunnyStatsModal
        isOpen={isFunnyStatsOpen}
        onClose={() => setIsFunnyStatsOpen(false)}
        presences={presences}
      />

      <CreateSpecialEventModal
        isOpen={isCreateEventOpen}
        onClose={() => {
          setIsCreateEventOpen(false);
          setEditingEvent(null);
        }}
        onSave={handleSaveCustomEvent}
        initialEvent={editingEvent}
      />

      <EventRsvpModal
        isOpen={!!rsvpEvent}
        event={rsvpEvent}
        onClose={() => setRsvpEvent(null)}
        onSaveRsvp={handleSaveEventRsvp}
      />

    </div>
  );
};

export default App;
