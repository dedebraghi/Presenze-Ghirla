import React from 'react';
import type { PresenceEntry } from '../data/familyData';
import { FAMILY_GROUPS, ALL_PEOPLE } from '../data/familyData';
import { Sun, Moon, Bed } from 'lucide-react';

interface DayDetailModalProps {
  dateStr: string;
  isOpen: boolean;
  onClose: () => void;
  presences: Record<string, PresenceEntry>;
  onSavePresences: (updated: Record<string, PresenceEntry>) => void;
}

export const DayDetailModal: React.FC<DayDetailModalProps> = ({
  dateStr,
  isOpen,
  onClose,
  presences,
  onSavePresences
}) => {
  if (!isOpen) return null;

  const dateObj = new Date(dateStr);
  const formattedDateStr = dateObj.toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const dayPresences = ALL_PEOPLE.map(person => {
    const key = `${dateStr}_${person.id}`;
    const entry = presences[key] || {
      date: dateStr,
      personId: person.id,
      lunch: false,
      dinner: false,
      overnight: false
    };
    return { person, entry };
  });

  const totalLunch = dayPresences.filter(p => p.entry.lunch).length;
  const totalDinner = dayPresences.filter(p => p.entry.dinner).length;
  const totalOvernight = dayPresences.filter(p => p.entry.overnight).length;

  const toggleMeal = (personId: string, type: 'lunch' | 'dinner' | 'overnight') => {
    const key = `${dateStr}_${personId}`;
    const current = presences[key] || {
      date: dateStr,
      personId,
      lunch: false,
      dinner: false,
      overnight: false
    };

    const updated = {
      ...presences,
      [key]: {
        ...current,
        [type]: !current[type]
      }
    };

    onSavePresences(updated);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container animate-fade-in" style={{ maxWidth: '720px' }}>
        
        <button onClick={onClose} className="modal-close-btn">
          ✕
        </button>

        <div style={{ marginBottom: '20px', paddingRight: '45px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1e3a8a', textTransform: 'capitalize', lineHeight: '1.2' }}>
            📆 {formattedDateStr}
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            Presenze e pasti dettagliati della giornata a Ghirla
          </p>
        </div>

        <div className="meal-toggle-grid" style={{
          backgroundColor: '#f8fafc',
          borderRadius: '18px',
          padding: '16px',
          marginBottom: '20px',
          border: '1.5px solid #e2e8f0'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#c2410c', fontWeight: 700, fontSize: '15px' }}>
              <Sun size={20} color="#ea580c" />
              <span>Pranzo</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#ea580c', marginTop: '2px' }}>
              {totalLunch}
            </div>
            <span style={{ fontSize: '13px', color: '#64748b' }}>persone</span>
          </div>

          <div style={{ textAlign: 'center', borderLeft: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#b45309', fontWeight: 700, fontSize: '15px' }}>
              <Moon size={20} color="#d97706" />
              <span>Cena</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#d97706', marginTop: '2px' }}>
              {totalDinner}
            </div>
            <span style={{ fontSize: '13px', color: '#64748b' }}>persone</span>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#3730a3', fontWeight: 700, fontSize: '15px' }}>
              <Bed size={20} color="#4338ca" />
              <span>Dormono</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#4338ca', marginTop: '2px' }}>
              {totalOvernight}
            </div>
            <span style={{ fontSize: '13px', color: '#64748b' }}>persone</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
          {FAMILY_GROUPS.map(group => {
            const groupMembers = dayPresences.filter(p => p.person.familyId === group.id);

            return (
              <div key={group.id} style={{
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '14px',
                backgroundColor: '#ffffff'
              }}>
                <div style={{ fontWeight: 800, color: group.badgeColor, fontSize: '16px', marginBottom: '10px' }}>
                  {group.name}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {groupMembers.map(({ person, entry }) => (
                    <div key={person.id} className="modal-person-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          backgroundColor: person.avatarBg || group.badgeColor,
                          color: '#ffffff',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px'
                        }}>
                          {person.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '16px' }}>
                          {person.name}
                        </span>
                      </div>

                      <div className="modal-person-row-buttons">
                        <button
                          onClick={() => toggleMeal(person.id, 'lunch')}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '10px',
                            backgroundColor: entry.lunch ? '#ffedd5' : '#ffffff',
                            border: entry.lunch ? '2px solid #ea580c' : '1px solid #cbd5e1',
                            color: entry.lunch ? '#c2410c' : '#94a3b8',
                            fontWeight: 700,
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Sun size={15} />
                          Pranzo
                        </button>

                        <button
                          onClick={() => toggleMeal(person.id, 'dinner')}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '10px',
                            backgroundColor: entry.dinner ? '#fef3c7' : '#ffffff',
                            border: entry.dinner ? '2px solid #d97706' : '1px solid #cbd5e1',
                            color: entry.dinner ? '#b45309' : '#94a3b8',
                            fontWeight: 700,
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Moon size={15} />
                          Cena
                        </button>

                        <button
                          onClick={() => toggleMeal(person.id, 'overnight')}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '10px',
                            backgroundColor: entry.overnight ? '#e0e7ff' : '#ffffff',
                            border: entry.overnight ? '2px solid #4338ca' : '1px solid #cbd5e1',
                            color: entry.overnight ? '#3730a3' : '#94a3b8',
                            fontWeight: 700,
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Bed size={15} />
                          Notte
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="modal-actions">
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: '16px',
              backgroundColor: '#1e3a8a',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '16px'
            }}
          >
            Chiudi
          </button>
        </div>

      </div>
    </div>
  );
};
