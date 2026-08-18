import React, { useState } from 'react';
import type { CustomEvent } from '../data/customEventsData';
import { getPersonById } from '../data/familyData';
import {
  Sparkles,
  MapPin,
  Users,
  Calendar,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronUp,
  UserCheck
} from 'lucide-react';

interface CustomEventBannerProps {
  events: Record<string, CustomEvent>;
  onOpenRsvp: (event: CustomEvent) => void;
  onEditEvent: (event: CustomEvent) => void;
  onDeleteEvent: (eventId: string) => Promise<void>;
}

export const CustomEventBanner: React.FC<CustomEventBannerProps> = ({
  events,
  onOpenRsvp,
  onEditEvent,
  onDeleteEvent
}) => {
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});

  const activeEvents = Object.values(events).filter(e => e && e.isActive !== false);

  if (activeEvents.length === 0) {
    return null;
  }

  const toggleExpand = (id: string) => {
    setExpandedDetails(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const formatDateRange = (startStr: string, endStr: string) => {
    if (!startStr) return '';
    const startDate = new Date(startStr);
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };
    const startFormatted = startDate.toLocaleDateString('it-IT', options);

    if (!endStr || startStr === endStr) {
      return startFormatted;
    }

    const endDate = new Date(endStr);
    const endFormatted = endDate.toLocaleDateString('it-IT', options);
    return `${startFormatted} ➔ ${endFormatted}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
      {activeEvents.map((event) => {
        const creator = getPersonById(event.creatorId);
        const creatorName = creator ? creator.name : event.creatorId;

        const mapsUrl = event.location
          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`
          : null;

        const isExpanded = !!expandedDetails[event.id];

        // Tally RSVPs
        const rsvps = event.rsvps || {};
        const yesList: { name: string; notes?: string; slots: string[] }[] = [];
        const partialList: { name: string; notes?: string; slots: string[] }[] = [];
        const noList: { name: string; notes?: string }[] = [];

        Object.values(rsvps).forEach((r) => {
          const person = getPersonById(r.personId);
          const name = person ? person.name : r.personId;
          if (r.status === 'yes') {
            yesList.push({ name, notes: r.notes, slots: r.selectedSlots });
          } else if (r.status === 'partial') {
            partialList.push({ name, notes: r.notes, slots: r.selectedSlots });
          } else if (r.status === 'no') {
            noList.push({ name, notes: r.notes });
          }
        });

        const totalAttendees = yesList.length + partialList.length;

        return (
          <div
            key={event.id}
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f5f3ff 50%, #eff6ff 100%)',
              border: '2px solid #818cf8',
              borderRadius: '22px',
              padding: '20px 24px',
              boxShadow: '0 10px 25px rgba(99, 102, 241, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              position: 'relative'
            }}
          >
            {/* Top Bar / Badges & Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    backgroundColor: '#6366f1',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 800,
                    padding: '5px 12px',
                    borderRadius: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <Sparkles size={14} />
                  Evento Speciale
                </span>

                <span
                  style={{
                    backgroundColor: '#e0e7ff',
                    color: '#4338ca',
                    fontSize: '13px',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '10px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <Calendar size={14} />
                  {formatDateRange(event.startDate, event.endDate)}
                </span>

                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
                  Organizzato da <strong style={{ color: '#4338ca' }}>{creatorName}</strong>
                </span>
              </div>

              {/* Edit / Delete quick buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={() => onEditEvent(event)}
                  title="Modifica evento"
                  style={{
                    background: 'rgba(255, 255, 255, 0.8)',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '6px 8px',
                    cursor: 'pointer',
                    color: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  <Edit3 size={13} /> Modifica
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Sei sicuro di voler eliminare l'evento "${event.title}"?`)) {
                      onDeleteEvent(event.id);
                    }
                  }}
                  title="Elimina evento"
                  style={{
                    background: 'rgba(255, 255, 255, 0.8)',
                    border: '1px solid #fca5a5',
                    borderRadius: '8px',
                    padding: '6px 8px',
                    cursor: 'pointer',
                    color: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '12px'
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Title & Description */}
            <div>
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#1e1b4b', margin: '0 0 6px 0' }}>
                {event.title}
              </h3>
              {event.description && (
                <div style={{ fontSize: '14px', color: '#475569', lineHeight: 1.5 }}>
                  {event.description}
                </div>
              )}
            </div>

            {/* Location with Google Maps button */}
            {event.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#1e293b', fontWeight: 600 }}>
                  <MapPin size={18} color="#6366f1" />
                  <span>{event.location}</span>
                </div>
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      backgroundColor: '#e0e7ff',
                      color: '#4338ca',
                      textDecoration: 'none',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    📍 Apri su Google Maps <ExternalLink size={12} />
                  </a>
                )}
              </div>
            )}

            {/* EVIDENZA: Chi c'è di esterno alla famiglia */}
            {event.externalGuests && (
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: '1.5px solid #c7d2fe',
                  borderRadius: '14px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}
              >
                <Users size={20} color="#4f46e5" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#3730a3', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    Persone esterne presenti all'evento:
                  </div>
                  <div style={{ fontSize: '14px', color: '#1e1b4b', fontWeight: 600, marginTop: '2px' }}>
                    {event.externalGuests}
                  </div>
                </div>
              </div>
            )}

            {/* Momenti / Slot previsti */}
            {event.slots && event.slots.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>
                  Momenti previsti:
                </span>
                {event.slots.map((s) => (
                  <span
                    key={s.id}
                    style={{
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '3px 8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#334155',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>{s.icon || '✨'}</span>
                    <span>{s.label}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Partecipanti & Azioni */}
            <div
              style={{
                borderTop: '1px solid #e2e8f0',
                paddingTop: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              {/* Riepilogo risposte */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div
                  style={{
                    backgroundColor: '#ecfdf5',
                    color: '#065f46',
                    border: '1px solid #a7f3d0',
                    padding: '6px 12px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <CheckCircle2 size={16} color="#059669" />
                  {totalAttendees} {totalAttendees === 1 ? 'partecipante confermato' : 'partecipanti confermati'}
                </div>

                {noList.length > 0 && (
                  <div
                    style={{
                      backgroundColor: '#fef2f2',
                      color: '#991b1b',
                      border: '1px solid #fecaca',
                      padding: '6px 10px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <XCircle size={14} color="#dc2626" />
                    {noList.length} assenti
                  </div>
                )}

                {totalAttendees > 0 && (
                  <button
                    onClick={() => toggleExpand(event.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#6366f1',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px'
                    }}
                  >
                    {isExpanded ? 'Nascondi dettagli' : 'Chi c’è?'}
                    {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                )}
              </div>

              {/* Pulsante Partecipa */}
              <button
                onClick={() => onOpenRsvp(event)}
                style={{
                  backgroundColor: '#4f46e5',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '14px',
                  fontWeight: 800,
                  fontSize: '14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
                  transition: 'transform 0.15s ease'
                }}
              >
                <UserCheck size={18} />
                ✍️ Partecipa / Modifica Presenza
              </button>
            </div>

            {/* Expanded attendance details */}
            {isExpanded && (
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #e0e7ff',
                  borderRadius: '14px',
                  padding: '16px',
                  marginTop: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                {yesList.length > 0 && (
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Presenti a tutto l'evento ({yesList.length}):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {yesList.map((item, idx) => (
                        <span
                          key={idx}
                          style={{
                            backgroundColor: '#ecfdf5',
                            border: '1px solid #a7f3d0',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 700,
                            color: '#065f46'
                          }}
                        >
                          {item.name} {item.notes && <span style={{ fontWeight: 400, color: '#047857' }}>({item.notes})</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {partialList.length > 0 && (
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#4338ca', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Presenti ad alcuni momenti ({partialList.length}):
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {partialList.map((item, idx) => {
                        const slotLabels = item.slots
                          .map(sid => event.slots.find(s => s.id === sid)?.label)
                          .filter(Boolean)
                          .join(', ');

                        return (
                          <div
                            key={idx}
                            style={{
                              backgroundColor: '#eef2ff',
                              border: '1px solid #c7d2fe',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              fontSize: '13px',
                              color: '#1e1b4b'
                            }}
                          >
                            <strong>{item.name}</strong>: {slotLabels || 'Nessun momento specifico'}
                            {item.notes && <span style={{ color: '#4338ca', marginLeft: '6px' }}>— {item.notes}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {noList.length > 0 && (
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#991b1b', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Non partecipano ({noList.length}):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {noList.map((item, idx) => (
                        <span
                          key={idx}
                          style={{
                            backgroundColor: '#fef2f2',
                            border: '1px solid #fecaca',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            color: '#991b1b',
                            fontWeight: 600
                          }}
                        >
                          {item.name} {item.notes && <span>({item.notes})</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
