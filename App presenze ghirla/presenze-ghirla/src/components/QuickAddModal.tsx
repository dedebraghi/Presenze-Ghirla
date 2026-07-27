import React, { useState } from 'react';
import type { PresenceEntry } from '../data/familyData';
import { FAMILY_GROUPS } from '../data/familyData';
import { Sun, Moon, Bed, Check, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  presences: Record<string, PresenceEntry>;
  onSavePresences: (updated: Record<string, PresenceEntry>) => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  presences,
  onSavePresences,
}) => {
  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);

  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([]);
  
  const [lunch, setLunch] = useState(true);
  const [dinner, setDinner] = useState(true);
  const [overnight, setOvernight] = useState(true);

  const togglePerson = (id: string) => {
    setSelectedPersonIds(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
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

  const handleSave = () => {
    if (selectedPersonIds.length === 0) {
      alert("Seleziona almeno una persona o famiglia!");
      return;
    }

    const updated = { ...presences };
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      
      selectedPersonIds.forEach(pId => {
        const key = `${dateStr}_${pId}`;
        updated[key] = {
          date: dateStr,
          personId: pId,
          lunch,
          dinner,
          overnight
        };
      });
    }

    onSavePresences(updated);
    
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch (e) {}

    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container animate-fade-in" style={{ maxWidth: '680px' }}>
        <button onClick={onClose} className="modal-close-btn">
          ✕
        </button>

        <div style={{ marginBottom: '20px', paddingRight: '45px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1e3a8a', lineHeight: '1.2' }}>
            ➕ Aggiungi Soggiorno a Ghirla
          </h2>
          <p style={{ color: '#64748b', fontSize: '15px', marginTop: '4px' }}>
            Segna rapidamente i giorni e chi sarà presente in casa
          </p>
        </div>

        <div style={{
          backgroundColor: '#f8fafc',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '20px',
          border: '1px solid #e2e8f0'
        }}>
          <label style={{ fontWeight: 700, fontSize: '16px', color: '#1e293b', display: 'block', marginBottom: '10px' }}>
            📅 Seleziona i Giorni
          </label>
          <div className="responsive-grid-2">
            <div>
              <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 600 }}>Da Giorno:</span>
              <input
                type="date"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  if (e.target.value > endDate) setEndDate(e.target.value);
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '2px solid #cbd5e1',
                  fontSize: '17px',
                  fontWeight: 600,
                  marginTop: '4px'
                }}
              />
            </div>
            <div>
              <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 600 }}>A Giorno:</span>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={e => setEndDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '2px solid #cbd5e1',
                  fontSize: '17px',
                  fontWeight: 600,
                  marginTop: '4px'
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontWeight: 700, fontSize: '16px', color: '#1e293b', display: 'block', marginBottom: '10px' }}>
            🍽️ Presenza ai Pasti e Notte
          </label>
          <div className="meal-toggle-grid">
            <button
              onClick={() => setLunch(!lunch)}
              style={{
                padding: '14px 8px',
                borderRadius: '16px',
                border: lunch ? '3px solid #ea580c' : '2px solid #e2e8f0',
                backgroundColor: lunch ? '#fff7ed' : '#ffffff',
                color: lunch ? '#c2410c' : '#64748b',
                fontWeight: 700,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <Sun size={24} color={lunch ? '#ea580c' : '#94a3b8'} />
              <span>Pranzo</span>
              <span style={{ fontSize: '12px', opacity: 0.8 }}>{lunch ? 'SI' : 'NO'}</span>
            </button>

            <button
              onClick={() => setDinner(!dinner)}
              style={{
                padding: '14px 8px',
                borderRadius: '16px',
                border: dinner ? '3px solid #d97706' : '2px solid #e2e8f0',
                backgroundColor: dinner ? '#fffbeb' : '#ffffff',
                color: dinner ? '#b45309' : '#64748b',
                fontWeight: 700,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <Moon size={24} color={dinner ? '#d97706' : '#94a3b8'} />
              <span>Cena</span>
              <span style={{ fontSize: '12px', opacity: 0.8 }}>{dinner ? 'SI' : 'NO'}</span>
            </button>

            <button
              onClick={() => setOvernight(!overnight)}
              style={{
                padding: '14px 8px',
                borderRadius: '16px',
                border: overnight ? '3px solid #4338ca' : '2px solid #e2e8f0',
                backgroundColor: overnight ? '#eef2ff' : '#ffffff',
                color: overnight ? '#3730a3' : '#64748b',
                fontWeight: 700,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <Bed size={24} color={overnight ? '#4338ca' : '#94a3b8'} />
              <span>Notte</span>
              <span style={{ fontSize: '12px', opacity: 0.8 }}>{overnight ? 'SI' : 'NO'}</span>
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <label style={{ fontWeight: 700, fontSize: '16px', color: '#1e293b' }}>
              👨‍👩‍👧‍👦 Chi viene a Ghirla? ({selectedPersonIds.length} selezionati)
            </label>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {FAMILY_GROUPS.map(group => {
              const memberIds = group.members.map(m => m.id);
              const isGroupAllSelected = memberIds.every(id => selectedPersonIds.includes(id));

              return (
                <div key={group.id} style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '14px',
                  border: '1.5px solid #e2e8f0',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                }}>
                  <div className="group-header">
                    <span style={{ fontWeight: 800, color: group.badgeColor, fontSize: '17px' }}>
                      {group.name}
                    </span>
                    <button
                      onClick={() => toggleFamilyGroup(memberIds)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        backgroundColor: isGroupAllSelected ? group.badgeColor : '#f1f5f9',
                        color: isGroupAllSelected ? '#ffffff' : '#475569',
                        fontSize: '13px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {isGroupAllSelected ? <Check size={14} /> : <Plus size={14} />}
                      {isGroupAllSelected ? 'Tutta la famiglia' : 'Seleziona Tutti'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {group.members.map(person => {
                      const isSelected = selectedPersonIds.includes(person.id);
                      return (
                        <button
                          key={person.id}
                          onClick={() => togglePerson(person.id)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '12px',
                            backgroundColor: isSelected ? group.badgeColor : '#f8fafc',
                            color: isSelected ? '#ffffff' : '#334155',
                            fontWeight: 600,
                            fontSize: '15px',
                            border: isSelected ? `2px solid ${group.badgeColor}` : '1.5px solid #cbd5e1',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'transform 0.1s ease'
                          }}
                        >
                          {isSelected && <Check size={16} />}
                          {person.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-actions">
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: '16px',
              backgroundColor: '#f1f5f9',
              color: '#475569',
              fontWeight: 700,
              fontSize: '17px'
            }}
          >
            Annulla
          </button>
          
          <button
            onClick={handleSave}
            style={{
              flex: 2,
              padding: '16px',
              borderRadius: '16px',
              backgroundColor: '#1e3a8a',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '18px',
              boxShadow: '0 4px 14px rgba(30, 58, 138, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Check size={22} />
            Conferma Presenze
          </button>
        </div>

      </div>
    </div>
  );
};
