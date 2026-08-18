import React, { useState } from 'react';
import { FAMILY_GROUPS } from '../data/familyData';
import { DEFAULT_EVENT_SLOTS, type CustomEvent, type EventSlot } from '../data/customEventsData';
import { getLocalDateString } from '../utils/dateUtils';
import {
  X,
  Sparkles,
  MapPin,
  Users,
  Check,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CreateSpecialEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: CustomEvent) => Promise<void>;
  initialEvent?: CustomEvent | null;
}

export const CreateSpecialEventModal: React.FC<CreateSpecialEventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialEvent
}) => {
  const [step, setStep] = useState(1);
  const totalSteps = 6;

  // Form State
  const [creatorId, setCreatorId] = useState<string>(initialEvent?.creatorId || 'stefano');
  const [title, setTitle] = useState<string>(initialEvent?.title || '');
  const [description, setDescription] = useState<string>(initialEvent?.description || '');
  const [location, setLocation] = useState<string>(initialEvent?.location || '');
  const [externalGuests, setExternalGuests] = useState<string>(initialEvent?.externalGuests || '');

  const todayStr = getLocalDateString(new Date());
  const [isSingleDay, setIsSingleDay] = useState<boolean>(
    initialEvent ? initialEvent.startDate === initialEvent.endDate : true
  );
  const [startDate, setStartDate] = useState<string>(initialEvent?.startDate || todayStr);
  const [endDate, setEndDate] = useState<string>(initialEvent?.endDate || todayStr);

  const [selectedSlots, setSelectedSlots] = useState<EventSlot[]>(() => {
    if (initialEvent && initialEvent.slots && initialEvent.slots.length > 0) {
      return initialEvent.slots;
    }
    return [
      DEFAULT_EVENT_SLOTS[0], // Evento Principale
      DEFAULT_EVENT_SLOTS[1], // Pranzo
      DEFAULT_EVENT_SLOTS[3], // Cena
    ];
  });

  const [customSlotLabel, setCustomSlotLabel] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 1 && !creatorId) {
      alert('Seleziona chi propone l’evento.');
      return;
    }
    if (step === 2 && !title.trim()) {
      alert('Inserisci il nome o titolo dell’evento.');
      return;
    }
    if (step === 5 && !startDate) {
      alert('Inserisci una data di inizio valida.');
      return;
    }
    if (step === 6 && selectedSlots.length === 0) {
      alert('Seleziona almeno un momento/attività per l’evento.');
      return;
    }

    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleToggleSlot = (slot: EventSlot) => {
    const exists = selectedSlots.some(s => s.id === slot.id);
    if (exists) {
      setSelectedSlots(selectedSlots.filter(s => s.id !== slot.id));
    } else {
      setSelectedSlots([...selectedSlots, slot]);
    }
  };

  const handleAddCustomSlot = () => {
    if (!customSlotLabel.trim()) return;
    const newSlot: EventSlot = {
      id: `custom_${Date.now()}`,
      label: customSlotLabel.trim(),
      icon: '✨'
    };
    setSelectedSlots([...selectedSlots, newSlot]);
    setCustomSlotLabel('');
  };

  const handleRemoveSlot = (slotId: string) => {
    setSelectedSlots(selectedSlots.filter(s => s.id !== slotId));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert('Inserisci il nome dell’evento.');
      return;
    }

    setIsSaving(true);
    const finalEndDate = isSingleDay ? startDate : (endDate || startDate);

    const newEvent: CustomEvent = {
      id: initialEvent?.id || `event_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      description: description.trim() || undefined,
      creatorId,
      location: location.trim() || undefined,
      externalGuests: externalGuests.trim() || undefined,
      startDate,
      endDate: finalEndDate,
      slots: selectedSlots,
      targetPeople: ['all'],
      rsvps: initialEvent?.rsvps || {},
      createdAt: initialEvent?.createdAt || new Date().toISOString(),
      isActive: true,
    };

    try {
      await onSave(newEvent);
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}
      onClose();
    } catch (e) {
      console.error(e);
      alert('Errore durante il salvataggio.');
    } finally {
      setIsSaving(false);
    }
  };

  const mapsUrl = location.trim()
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.trim())}`
    : null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Sparkles size={22} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>
                {initialEvent ? 'Modifica Evento Speciale' : 'Crea Evento Speciale'}
              </h2>
              <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>
                Passo {step} di {totalSteps}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', height: '4px', backgroundColor: '#e2e8f0' }}>
          <div
            style={{
              height: '100%',
              width: `${(step / totalSteps) * 100}%`,
              backgroundColor: '#6366f1',
              transition: 'width 0.3s ease'
            }}
          />
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {/* STEP 1: Chi propone l'evento (divisi per famiglia) */}
          {step === 1 && (
            <div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', marginBottom: '6px' }}>
                👤 Chi organizza o propone questo evento?
              </div>
              <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '18px' }}>
                Seleziona il tuo nome o quello dell'organizzatore principale (divisi per famiglia).
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  maxHeight: '380px',
                  overflowY: 'auto',
                  paddingRight: '4px'
                }}
              >
                {FAMILY_GROUPS.map((group) => (
                  <div
                    key={group.id}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '16px',
                      padding: '12px 14px',
                      border: '1.5px solid #e2e8f0',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.02)'
                    }}
                  >
                    <div style={{ fontWeight: 800, color: group.badgeColor, fontSize: '15px', marginBottom: '8px' }}>
                      {group.name}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {group.members.map((person) => {
                        const isSelected = creatorId === person.id;
                        return (
                          <button
                            key={person.id}
                            type="button"
                            onClick={() => setCreatorId(person.id)}
                            style={{
                              padding: '8px 14px',
                              borderRadius: '12px',
                              border: isSelected ? `2px solid ${group.badgeColor}` : '1.5px solid #cbd5e1',
                              backgroundColor: isSelected ? group.badgeColor : '#f8fafc',
                              color: isSelected ? '#ffffff' : '#334155',
                              cursor: 'pointer',
                              fontWeight: isSelected ? 800 : 600,
                              fontSize: '14px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {isSelected && <Check size={16} />}
                            {person.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Nome e Descrizione */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', marginBottom: '6px' }}>
                  📝 Di che evento si tratta?
                </div>
                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
                  Dai un titolo chiaro e una breve spiegazione del programma.
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Nome / Titolo Evento *
                </label>
                <input
                  type="text"
                  placeholder="es. Mostra d'arte a scuola, Festa di Primavera, Gita al lago..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '16px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Descrizione o Dettagli del Programma (Facoltativo)
                </label>
                <textarea
                  rows={4}
                  placeholder="es. Inaugurazione alle 16:30 con piccolo rinfresco, poi ci spostiamo per cena insieme o rientro..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          )}

          {/* STEP 3: Luogo & Google Maps */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', marginBottom: '6px' }}>
                  📍 Dove si svolgerà l'evento?
                </div>
                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
                  Inserisci l'indirizzo o il nome del luogo. Verrà creato un link diretto a Google Maps per tutti!
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Indirizzo o Nome Luogo (Facoltativo)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="es. Liceo Artistico Frattini, Varese oppure Via Roma 10, Milano"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 42px',
                      borderRadius: '12px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '15px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <MapPin
                    size={20}
                    color="#6366f1"
                    style={{ position: 'absolute', left: '14px', top: '13px' }}
                  />
                </div>
              </div>

              {mapsUrl && (
                <div
                  style={{
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '14px',
                    padding: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ fontSize: '13px', color: '#1e40af', fontWeight: 600 }}>
                    📍 Anteprima posizione pronta per la famiglia
                  </div>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      textDecoration: 'none',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    Verifica su Maps <ExternalLink size={13} />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Chi c'è di esterno alla famiglia */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', marginBottom: '6px' }}>
                  👥 Chi ci sarà di esterno alla famiglia?
                </div>
                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
                  Specifica se all'evento partecipano anche altre persone (es. colleghi, compagni di scuola, amici o altre famiglie).
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Nomi o Gruppo di Persone Esterne (Facoltativo)
                </label>
                <textarea
                  rows={3}
                  placeholder="es. Studenti delle classi 4ª e 5ª, colleghi insegnanti, genitori e amici..."
                  value={externalGuests}
                  onChange={(e) => setExternalGuests(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  borderRadius: '12px',
                  padding: '12px',
                  fontSize: '13px',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Users size={18} color="#6366f1" />
                Queste informazioni compariranno nel banner in modo che tutti sappiano con chi si condividerà l'evento!
              </div>
            </div>
          )}

          {/* STEP 5: Date dell'evento */}
          {step === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', marginBottom: '6px' }}>
                  📅 Quando si terrà l'evento?
                </div>
                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
                  Scegli se è un evento di una singola giornata o su più giorni (es. weekend).
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsSingleDay(true)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '12px',
                    border: isSingleDay ? '2px solid #6366f1' : '1px solid #cbd5e1',
                    backgroundColor: isSingleDay ? '#eef2ff' : '#f8fafc',
                    fontWeight: 700,
                    fontSize: '14px',
                    color: isSingleDay ? '#4338ca' : '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Singolo Giorno
                </button>
                <button
                  type="button"
                  onClick={() => setIsSingleDay(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '12px',
                    border: !isSingleDay ? '2px solid #6366f1' : '1px solid #cbd5e1',
                    backgroundColor: !isSingleDay ? '#eef2ff' : '#f8fafc',
                    fontWeight: 700,
                    fontSize: '14px',
                    color: !isSingleDay ? '#4338ca' : '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Più Giorni (Intervallo)
                </button>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  {isSingleDay ? 'Data dell’evento *' : 'Data di Inizio *'}
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (isSingleDay) setEndDate(e.target.value);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {!isSingleDay && (
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Data di Fine *
                  </label>
                  <input
                    type="date"
                    min={startDate}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '15px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 6: Momenti / Slot da tracciare */}
          {step === 6 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', marginBottom: '6px' }}>
                  🎯 Cosa prevede l'evento?
                </div>
                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
                  Seleziona a quali momenti i familiari potranno confermare o meno la loro presenza.
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {DEFAULT_EVENT_SLOTS.map((slot) => {
                  const isChecked = selectedSlots.some(s => s.id === slot.id);
                  return (
                    <div
                      key={slot.id}
                      onClick={() => handleToggleSlot(slot)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '14px',
                        border: isChecked ? '2px solid #6366f1' : '1.5px solid #e2e8f0',
                        backgroundColor: isChecked ? '#f5f3ff' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '20px' }}>{slot.icon}</span>
                        <span style={{ fontSize: '15px', fontWeight: isChecked ? 800 : 600, color: isChecked ? '#4338ca' : '#334155' }}>
                          {slot.label}
                        </span>
                      </div>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '8px',
                          border: isChecked ? 'none' : '2px solid #cbd5e1',
                          backgroundColor: isChecked ? '#6366f1' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff'
                        }}
                      >
                        {isChecked && <Check size={16} />}
                      </div>
                    </div>
                  );
                })}

                {/* Custom slots added by user */}
                {selectedSlots
                  .filter(s => s.id.startsWith('custom_'))
                  .map((slot) => (
                    <div
                      key={slot.id}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '14px',
                        border: '2px solid #6366f1',
                        backgroundColor: '#f5f3ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '20px' }}>{slot.icon || '✨'}</span>
                        <span style={{ fontSize: '15px', fontWeight: 800, color: '#4338ca' }}>
                          {slot.label}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSlot(slot.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
              </div>

              {/* Add custom slot input */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <input
                  type="text"
                  placeholder="+ Aggiungi altro momento (es. Gita in canoa, Buffet...)"
                  value={customSlotLabel}
                  onChange={(e) => setCustomSlotLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomSlot();
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCustomSlot}
                  style={{
                    backgroundColor: '#6366f1',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Plus size={16} /> Aggiungi
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              style={{
                backgroundColor: '#ffffff',
                border: '1.5px solid #cbd5e1',
                padding: '10px 18px',
                borderRadius: '14px',
                fontWeight: 700,
                fontSize: '14px',
                color: '#475569',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <ChevronLeft size={18} /> Indietro
            </button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              style={{
                backgroundColor: '#6366f1',
                color: '#ffffff',
                border: 'none',
                padding: '10px 22px',
                borderRadius: '14px',
                fontWeight: 800,
                fontSize: '15px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
              }}
            >
              Avanti <ChevronRight size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '14px',
                fontWeight: 800,
                fontSize: '16px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
              }}
            >
              <Sparkles size={18} />
              {isSaving ? 'Salvataggio...' : (initialEvent ? 'Salva Modifiche' : '🎉 Pubblica Evento!')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
