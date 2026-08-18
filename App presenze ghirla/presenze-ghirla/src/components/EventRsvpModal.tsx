import React, { useState, useEffect } from 'react';
import { FAMILY_GROUPS } from '../data/familyData';
import type { CustomEvent, EventRsvp } from '../data/customEventsData';
import { X, Check, Users, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';

interface EventRsvpModalProps {
  isOpen: boolean;
  event: CustomEvent | null;
  onClose: () => void;
  onSaveRsvps: (eventId: string, rsvps: EventRsvp[]) => Promise<void>;
}

export const EventRsvpModal: React.FC<EventRsvpModalProps> = ({
  isOpen,
  event,
  onClose,
  onSaveRsvps
}) => {
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([]);
  const [status, setStatus] = useState<'yes' | 'partial' | 'no'>('yes');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && event) {
      setSelectedPersonIds([]);
      setStatus('yes');
      setSelectedSlots((event.slots || []).map(s => s.id));
      setNotes('');
    }
  }, [isOpen, event]);

  if (!isOpen || !event) return null;

  const togglePerson = (personId: string) => {
    setSelectedPersonIds(prev =>
      prev.includes(personId) ? prev.filter(id => id !== personId) : [...prev, personId]
    );
  };

  const toggleFamilyGroup = (memberIds: string[]) => {
    const allSelected = memberIds.every(id => selectedPersonIds.includes(id));
    if (allSelected) {
      setSelectedPersonIds(prev => prev.filter(id => !memberIds.includes(id)));
    } else {
      setSelectedPersonIds(prev => Array.from(new Set([...prev, ...memberIds])));
    }
  };

  const handleDeselectAll = () => {
    setSelectedPersonIds([]);
  };

  const handleToggleSlot = (slotId: string) => {
    if (selectedSlots.includes(slotId)) {
      setSelectedSlots(selectedSlots.filter(id => id !== slotId));
    } else {
      setSelectedSlots([...selectedSlots, slotId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedPersonIds.length === 0) {
      alert('Seleziona almeno una persona o una famiglia per confermare la presenza.');
      return;
    }

    if (status === 'partial' && selectedSlots.length === 0) {
      alert('Seleziona almeno un momento in cui sarete presenti.');
      return;
    }

    setIsSaving(true);

    const now = new Date().toISOString();
    const finalSlots = status === 'yes'
      ? (event.slots || []).map(s => s.id)
      : (status === 'no' ? [] : selectedSlots);

    const rsvps: EventRsvp[] = selectedPersonIds.map(personId => ({
      personId,
      status,
      selectedSlots: finalSlots,
      notes: notes.trim() || undefined,
      updatedAt: now
    }));

    try {
      await onSaveRsvps(event.id, rsvps);
      if (status !== 'no') {
        try {
          confetti({
            particleCount: 70,
            spread: 65,
            origin: { y: 0.6 }
          });
        } catch {}
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert('Errore durante il salvataggio delle presenze.');
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
          maxWidth: '620px',
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
            background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.6px', opacity: 0.9, fontWeight: 700 }}>
              Conferma Partecipazione
            </div>
            <h2 style={{ fontSize: '19px', fontWeight: 800, margin: '2px 0 0 0' }}>
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
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* SEZIONE 1: Selezione Persone e Famiglie */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <label style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={18} color="#4f46e5" />
                <span>Chi risponde? ({selectedPersonIds.length} selezionat{selectedPersonIds.length === 1 ? 'o' : 'i'})</span>
              </label>
              {selectedPersonIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ef4444',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: '2px 6px'
                  }}
                >
                  Deseleziona tutti
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {FAMILY_GROUPS.map(group => {
                const memberIds = group.members.map(m => m.id);
                const isGroupAllSelected = memberIds.length > 0 && memberIds.every(id => selectedPersonIds.includes(id));

                return (
                  <div
                    key={group.id}
                    style={{
                      backgroundColor: '#f8fafc',
                      borderRadius: '16px',
                      padding: '12px 14px',
                      border: '1.5px solid #e2e8f0'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontWeight: 800, color: group.badgeColor, fontSize: '15px' }}>
                        {group.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleFamilyGroup(memberIds)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '16px',
                          backgroundColor: isGroupAllSelected ? group.badgeColor : '#e2e8f0',
                          color: isGroupAllSelected ? '#ffffff' : '#475569',
                          fontSize: '12px',
                          fontWeight: 700,
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {isGroupAllSelected ? <Check size={13} /> : <Plus size={13} />}
                        {isGroupAllSelected ? 'Tutta la famiglia' : 'Seleziona Tutti'}
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {group.members.map(person => {
                        const isSelected = selectedPersonIds.includes(person.id);
                        const personRsvp = event.rsvps ? event.rsvps[person.id] : null;

                        return (
                          <button
                            key={person.id}
                            type="button"
                            onClick={() => togglePerson(person.id)}
                            style={{
                              padding: '7px 12px',
                              borderRadius: '12px',
                              backgroundColor: isSelected ? group.badgeColor : '#ffffff',
                              color: isSelected ? '#ffffff' : '#334155',
                              fontWeight: isSelected ? 800 : 600,
                              fontSize: '14px',
                              border: isSelected ? `2px solid ${group.badgeColor}` : '1.5px solid #cbd5e1',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              cursor: 'pointer',
                              boxShadow: isSelected ? '0 3px 8px rgba(0,0,0,0.12)' : 'none',
                              transition: 'transform 0.1s ease, background 0.15s ease'
                            }}
                          >
                            {isSelected && <Check size={14} />}
                            <span>{person.name}</span>
                            
                            {/* Status Badge Indicatore se ha già risposto */}
                            {personRsvp && (
                              <span
                                style={{
                                  fontSize: '11px',
                                  padding: '1px 5px',
                                  borderRadius: '6px',
                                  backgroundColor: isSelected
                                    ? 'rgba(255, 255, 255, 0.25)'
                                    : (personRsvp.status === 'yes' ? '#d1fae5' : personRsvp.status === 'partial' ? '#e0e7ff' : '#fee2e2'),
                                  color: isSelected
                                    ? '#ffffff'
                                    : (personRsvp.status === 'yes' ? '#065f46' : personRsvp.status === 'partial' ? '#3730a3' : '#991b1b'),
                                  fontWeight: 700
                                }}
                              >
                                {personRsvp.status === 'yes' ? '✅ Tutto' : personRsvp.status === 'partial' ? '✨ Parziale' : '❌ No'}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SEZIONE 2: Stato di Partecipazione (Applicato a tutti i selezionati) */}
          <div>
            <label style={{ display: 'block', fontSize: '15px', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>
              🎯 Come parteciperanno i selezionati?
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                onClick={() => {
                  setStatus('yes');
                  setSelectedSlots((event.slots || []).map(s => s.id));
                }}
                style={{
                  padding: '12px 16px',
                  borderRadius: '14px',
                  border: status === 'yes' ? '2px solid #10b981' : '1.5px solid #e2e8f0',
                  backgroundColor: status === 'yes' ? '#ecfdf5' : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>🎉</span>
                  <div>
                    <div style={{ fontWeight: 800, color: status === 'yes' ? '#065f46' : '#1e293b', fontSize: '15px' }}>
                      Sì, partecipano a tutto l'evento!
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Presenti a tutti i momenti e pasti previsti
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
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>✨</span>
                  <div>
                    <div style={{ fontWeight: 800, color: status === 'partial' ? '#3730a3' : '#1e293b', fontSize: '15px' }}>
                      Partecipano solo ad alcuni momenti
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Scegli esattamente a cosa parteciperanno
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
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>❌</span>
                  <div>
                    <div style={{ fontWeight: 800, color: status === 'no' ? '#991b1b' : '#1e293b', fontSize: '15px' }}>
                      Purtroppo non possono venire
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

          {/* Momenti se presenza Parziale */}
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
                Spunta i momenti in cui saranno presenti:
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

          {/* Note */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              💬 Note per l'organizzatore (Facoltativo)
            </label>
            <input
              type="text"
              placeholder="es. Arriviamo insieme alle 13:00, portiamo un dolce..."
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
          <div style={{ marginTop: '6px', display: 'flex', gap: '10px' }}>
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
              {isSaving ? 'Salvataggio...' : `Conferma ${selectedPersonIds.length > 0 ? `(${selectedPersonIds.length} person${selectedPersonIds.length === 1 ? 'a' : 'e'})` : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
