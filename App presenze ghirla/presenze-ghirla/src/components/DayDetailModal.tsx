import type { PresenceEntry, Person } from '../data/familyData';
import { FAMILY_GROUPS, ALL_PEOPLE, getPersonById } from '../data/familyData';
import { Sun, Moon, Bed, Trash2 } from 'lucide-react';

interface DayDetailModalProps {
  dateStr: string;
  isOpen: boolean;
  onClose: () => void;
  presences: Record<string, PresenceEntry>;
  onSavePresences: (updated: Record<string, PresenceEntry>) => void;
  onDeleteGuest?: (personId: string) => void;
}

export const DayDetailModal: React.FC<DayDetailModalProps> = ({
  dateStr,
  isOpen,
  onClose,
  presences,
  onSavePresences,
  onDeleteGuest
}) => {
  if (!isOpen) return null;

  const handleDeleteGuest = (personId: string, personName: string) => {
    const cleanName = personName.replace(/\s*\(Ospite\)$/i, '').trim();
    if (!window.confirm(`Sei sicuro di voler eliminare l'ospite "${cleanName}" e rimuovere le sue presenze?`)) {
      return;
    }

    if (onDeleteGuest) {
      onDeleteGuest(personId);
    } else {
      const updated = { ...presences };
      let removedCount = 0;
      Object.keys(updated).forEach(key => {
        const parts = key.split('_');
        const keyPersonId = parts.slice(1).join('_');
        if (keyPersonId === personId) {
          delete updated[key];
          removedCount++;
        }
      });

      if (removedCount > 0) {
        onSavePresences(updated);
      }
    }
  };

  const dateObj = new Date(dateStr);
  const formattedDateStr = dateObj.toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const staticPresences = ALL_PEOPLE.map(person => {
    const key = `${dateStr}_${person.id}`;
    const isDefaultAlwaysPresent = person.id === 'stefano' || person.id === 'elena';
    const entry = presences[key] || {
      date: dateStr,
      personId: person.id,
      lunch: isDefaultAlwaysPresent,
      dinner: isDefaultAlwaysPresent,
      overnight: isDefaultAlwaysPresent
    };
    return { person, entry };
  });

  const datePrefix = `${dateStr}_`;
  const guestPresences: { person: Person; entry: PresenceEntry }[] = [];
  Object.keys(presences).forEach(key => {
    if (key.startsWith(datePrefix)) {
      const personId = key.substring(datePrefix.length);
      if (personId.startsWith('guest_')) {
        const entry = presences[key];
        if (entry) {
          const person = getPersonById(personId);
          guestPresences.push({ person, entry });
        }
      }
    }
  });

  const dayPresences = [...staticPresences, ...guestPresences];

  // Per il conteggio totale delle teste dei pasti nella modale di dettaglio, deduplica gli ospiti con lo stesso nome
  const deduplicatedDayPresencesForTotals: { person: Person; entry: PresenceEntry }[] = [];
  const guestTotalsMap = new Map<string, { person: Person; entry: PresenceEntry }>();

  dayPresences.forEach(item => {
    if (item.person.isGuest) {
      const cleanName = item.person.name.toLowerCase().trim();
      if (!guestTotalsMap.has(cleanName)) {
        guestTotalsMap.set(cleanName, {
          person: item.person,
          entry: { ...item.entry }
        });
      } else {
        const existing = guestTotalsMap.get(cleanName)!;
        existing.entry.lunch = existing.entry.lunch || item.entry.lunch;
        existing.entry.dinner = existing.entry.dinner || item.entry.dinner;
        existing.entry.overnight = existing.entry.overnight || item.entry.overnight;
      }
    } else {
      deduplicatedDayPresencesForTotals.push(item);
    }
  });

  guestTotalsMap.forEach(val => deduplicatedDayPresencesForTotals.push(val));

  const totalLunch = deduplicatedDayPresencesForTotals.filter(p => p.entry.lunch).length;
  const totalDinner = deduplicatedDayPresencesForTotals.filter(p => p.entry.dinner).length;
  const totalOvernight = deduplicatedDayPresencesForTotals.filter(p => p.entry.overnight).length;

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
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
          {(() => {
            const allGroups = [
              ...FAMILY_GROUPS,
              { id: 'ospiti', name: 'Ospiti ed Esterni', badgeColor: '#ec4899', members: [] }
            ];
            return allGroups.map(group => {
              const groupMembers = dayPresences.filter(p => {
                if (group.id === 'ospiti') {
                  return p.person.familyId === 'ospiti' || !FAMILY_GROUPS.some(fg => fg.id === p.person.familyId);
                }
                return p.person.familyId === group.id;
              });

              if (groupMembers.length === 0 && group.id === 'ospiti') return null;

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
                        {(person.isGuest || person.id.startsWith('guest_')) && (
                          <button
                            type="button"
                            title="Elimina ospite"
                            onClick={() => handleDeleteGuest(person.id, person.name)}
                            style={{
                              background: '#fee2e2',
                              border: 'none',
                              color: '#dc2626',
                              cursor: 'pointer',
                              padding: '4px 8px',
                              borderRadius: '8px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              fontWeight: 700,
                              marginLeft: '6px'
                            }}
                          >
                            <Trash2 size={14} />
                            Elimina
                          </button>
                        )}
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
          });
        })()}
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
