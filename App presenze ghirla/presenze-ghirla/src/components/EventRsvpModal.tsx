import React, { useState, useEffect } from 'react';
import { ALL_PEOPLE, type Person } from '../data/familyData';
import type { CustomEvent, EventRsvp } from '../data/customEventsData';
import { X, Check, Search } from 'lucide-react';
import confetti from 'canvas-confetti';

interface EventRsvpModalProps {
  isOpen: boolean;
  event: CustomEvent | null;
  onClose: () => void;
  onSaveRsvp: (eventId: string, rsvp: EventRsvp) => Promise<void>;
}

export const EventRsvpModal: React.FC<EventRsvpModalProps> = ({
  isOpen,
  event,
  onClose,
  onSaveRsvp
}) => {
  if (!isOpen || !event) return null;

  const [selectedPersonId, setSelectedPersonId] = useState<string>('stefano');
  const [searchTerm, setSearchTerm] = useState<string>('Stefano');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Load existing RSVP for selected person if present
  const currentRsvp = event.rsvps ? event.rsvps[selectedPersonId] : null;

  const [status, setStatus] = useState<'yes' | 'partial' | 'no'>(currentRsvp?.status || 'yes');
  const [selectedSlots, setSelectedSlots] = useState<string[]>(
    currentRsvp?.selectedSlots || (event.slots || []).map(s => s.id)
  );
  const [notes, setNotes] = useState<string>(currentRsvp?.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (event) {
      const rsvp = event.rsvps ? event.rsvps[selectedPersonId] : null;
      if (rsvp) {
        setStatus(rsvp.status);
        setSelectedSlots(rsvp.selectedSlots || (event.slots || []).map(s => s.id));
        setNotes(rsvp.notes || '');
      } else {
        setStatus('yes');
        setSelectedSlots((event.slots || []).map(s => s.id));
        setNotes('');
      }
    }
  }, [event, selectedPersonId]);

  const handleSelectPerson = (person: Person) => {
    setSelectedPersonId(person.id);
    setSearchTerm(person.name);
    setIsDropdownOpen(false);

    const rsvp = event.rsvps ? event.rsvps[person.id] : null;
    if (rsvp) {
      setStatus(rsvp.status);
      setSelectedSlots(rsvp.selectedSlots || (event.slots || []).map(s => s.id));
      setNotes(rsvp.notes || '');
    } else {
      setStatus('yes');
      setSelectedSlots((event.slots || []).map(s => s.id));
      setNotes('');
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setIsDropdownOpen(true);

    // Auto-match if exact name is typed
    const exactMatch = ALL_PEOPLE.find(
      p => p.name.toLowerCase().trim() === value.toLowerCase().trim()
    );
    if (exactMatch) {
      setSelectedPersonId(exactMatch.id);
      const rsvp = event.rsvps ? event.rsvps[exactMatch.id] : null;
      if (rsvp) {
        setStatus(rsvp.status);
        setSelectedSlots(rsvp.selectedSlots || (event.slots || []).map(s => s.id));
        setNotes(rsvp.notes || '');
      } else {
        setStatus('yes');
        setSelectedSlots((event.slots || []).map(s => s.id));
        setNotes('');
      }
    }
  };

  // Filter people based on search term
  const filteredPeople = ALL_PEOPLE.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const handleToggleSlot = (slotId: string) => {
    if (selectedSlots.includes(slotId)) {
      setSelectedSlots(selectedSlots.filter(id => id !== slotId));
    } else {
      setSelectedSlots([...selectedSlots, slotId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const rsvp: EventRsvp = {
      personId: selectedPersonId,
      status,
      selectedSlots: status === 'yes' ? (event.slots || []).map(s => s.id) : (status === 'no' ? [] : selectedSlots),
      notes: notes.trim() || undefined,
      updatedAt: new Date().toISOString()
    };

    try {
      await onSaveRsvp(event.id, rsvp);
      if (status !== 'no') {
        try {
          confetti({
            particleCount: 60,
            spread: 60,
            origin: { y: 0.5 }
          });
        } catch {}
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert('Errore durante il salvataggio della presenza.');
    } finally {
      setIsSaving(false);
    }
  };

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
          maxWidth: '520px',
          maxHeight: '90vh',
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
            background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9 }}>
              Conferma Partecipazione
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '2px 0 0 0' }}>
              {event.title}
            </h2>
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

        {/* Content */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Campo Libero con Autocompletamento per la Persona */}
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              👤 Chi sta rispondendo? (Cerca o scrivi il nome)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder="Scrivi il tuo nome (es. Stefano, Elena, Luca...)"
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 40px',
                  borderRadius: '12px',
                  border: '1.5px solid #6366f1',
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#1e293b',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                  boxSizing: 'border-box'
                }}
              />
              <Search
                size={18}
                color="#6366f1"
                style={{ position: 'absolute', left: '14px', top: '14px' }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setIsDropdownOpen(true);
                  }}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '12px',
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '2px'
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Dropdown / Suggerimenti Autocompletati */}
            {isDropdownOpen && filteredPeople.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  zIndex: 50,
                  maxHeight: '200px',
                  overflowY: 'auto',
                  marginTop: '4px'
                }}
              >
                {filteredPeople.map((person) => {
                  const isSelected = selectedPersonId === person.id;
                  const personRsvp = event.rsvps ? event.rsvps[person.id] : null;
                  return (
                    <div
                      key={person.id}
                      onClick={() => handleSelectPerson(person)}
                      style={{
                        padding: '10px 14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: isSelected ? '#eef2ff' : 'transparent',
                        borderBottom: '1px solid #f1f5f9'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: isSelected ? 800 : 600, color: isSelected ? '#4338ca' : '#1e293b', fontSize: '14px' }}>
                          {person.name}
                        </span>
                      </div>
                      {personRsvp && (
                        <span style={{ fontSize: '12px', fontWeight: 700, color: personRsvp.status === 'yes' ? '#059669' : personRsvp.status === 'partial' ? '#4f46e5' : '#dc2626' }}>
                          {personRsvp.status === 'yes' ? '✅ Partecipa' : personRsvp.status === 'partial' ? '✨ Parziale' : '❌ Non presente'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Status Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
              🎯 Sarai presente?
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                onClick={() => {
                  setStatus('yes');
                  setSelectedSlots(event.slots.map(s => s.id));
                }}
                style={{
                  padding: '12px 16px',
                  borderRadius: '14px',
                  border: status === 'yes' ? '2px solid #10b981' : '1.5px solid #e2e8f0',
                  backgroundColor: status === 'yes' ? '#ecfdf5' : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>🎉</span>
                  <div>
                    <div style={{ fontWeight: 800, color: status === 'yes' ? '#065f46' : '#1e293b', fontSize: '15px' }}>
                      Sì, partecipo a tutto l'evento!
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Presente a tutti i momenti e pasti previsti
                    </div>
                  </div>
                </div>
                {status === 'yes' && <Check size={18} color="#059669" />}
              </div>

              <div
                onClick={() => setStatus('partial')}
                style={{
                  padding: '12px 16px',
                  borderRadius: '14px',
                  border: status === 'partial' ? '2px solid #6366f1' : '1.5px solid #e2e8f0',
                  backgroundColor: status === 'partial' ? '#eef2ff' : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>✨</span>
                  <div>
                    <div style={{ fontWeight: 800, color: status === 'partial' ? '#3730a3' : '#1e293b', fontSize: '15px' }}>
                      Partecipo solo ad alcuni momenti
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Scegli esattamente a cosa parteciperai
                    </div>
                  </div>
                </div>
                {status === 'partial' && <Check size={18} color="#4f46e5" />}
              </div>

              <div
                onClick={() => setStatus('no')}
                style={{
                  padding: '12px 16px',
                  borderRadius: '14px',
                  border: status === 'no' ? '2px solid #ef4444' : '1.5px solid #e2e8f0',
                  backgroundColor: status === 'no' ? '#fef2f2' : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>❌</span>
                  <div>
                    <div style={{ fontWeight: 800, color: status === 'no' ? '#991b1b' : '#1e293b', fontSize: '15px' }}>
                      Purtroppo non riesco a venire
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Segna assenza per questo evento
                    </div>
                  </div>
                </div>
                {status === 'no' && <Check size={18} color="#dc2626" />}
              </div>
            </div>
          </div>

          {/* Slots selection if status is 'partial' */}
          {status === 'partial' && (
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                borderRadius: '16px',
                padding: '14px'
              }}
            >
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#4338ca', marginBottom: '8px', textTransform: 'uppercase' }}>
                Spunta i momenti in cui sarai presente:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(event.slots || []).map((slot) => {
                  const isChecked = selectedSlots.includes(slot.id);
                  return (
                    <div
                      key={slot.id}
                      onClick={() => handleToggleSlot(slot.id)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '10px',
                        backgroundColor: isChecked ? '#eef2ff' : '#ffffff',
                        border: isChecked ? '1.5px solid #6366f1' : '1px solid #cbd5e1',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{slot.icon || '✨'}</span>
                        <span style={{ fontSize: '14px', fontWeight: isChecked ? 700 : 500, color: isChecked ? '#312e81' : '#334155' }}>
                          {slot.label}
                        </span>
                      </div>
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '6px',
                          backgroundColor: isChecked ? '#6366f1' : 'transparent',
                          border: isChecked ? 'none' : '2px solid #cbd5e1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff'
                        }}
                      >
                        {isChecked && <Check size={14} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              💬 Note personali per l'organizzatore (Facoltativo)
            </label>
            <input
              type="text"
              placeholder="es. Arrivo verso le 17:00, porto una torta, ho 2 posti in auto..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1.5px solid #cbd5e1',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Submit */}
          <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '14px',
                border: '1.5px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isSaving}
              style={{
                flex: 2,
                padding: '12px',
                borderRadius: '14px',
                border: 'none',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '15px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Check size={18} />
              {isSaving ? 'Salvataggio...' : 'Conferma Presenza'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
