import React, { useState } from 'react';
import type { PresenceEntry, Person } from '../data/familyData';
import { FAMILY_GROUPS, getPersonById } from '../data/familyData';
import { Sun, Moon, Bed, Check, UserPlus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getLocalDateString } from '../utils/dateUtils';

interface AddGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  presences: Record<string, PresenceEntry>;
  onSavePresences: (updated: Record<string, PresenceEntry>, newGuest?: Person) => void;
}

export const AddGuestModal: React.FC<AddGuestModalProps> = ({
  isOpen,
  onClose,
  presences,
  onSavePresences,
}) => {
  if (!isOpen) return null;

  const todayStr = getLocalDateString();
  const [guestName, setGuestName] = useState('');
  const [invitedByFamilyId, setInvitedByFamilyId] = useState('stefano-elena');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);

  const [lunch, setLunch] = useState(true);
  const [dinner, setDinner] = useState(true);
  const [overnight, setOvernight] = useState(true);

  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  const checkSimilarGuests = (name: string, start: string, end: string) => {
    const cleanNew = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!cleanNew) return [];

    const existingGuestMap = new Map<string, { baseName: string; familyName: string }>();

    const startDateObj = new Date(start);
    const endDateObj = new Date(end);

    Object.keys(presences).forEach(key => {
      const parts = key.split('_');
      const dateStr = parts[0];
      const personId = parts.slice(1).join('_');

      if (personId.startsWith('guest_')) {
        const d = new Date(dateStr);
        if (d >= startDateObj && d <= endDateObj) {
          const person = getPersonById(personId);
          // Rimuovi " (Ospite)" per il confronto
          const baseName = person.name.replace(/\s*\(Ospite\)$/i, '').trim();
          const family = FAMILY_GROUPS.find(g => g.id === person.familyId);
          const familyName = family ? family.name : 'altra famiglia';

          if (baseName) {
            existingGuestMap.set(personId, { baseName, familyName });
          }
        }
      }
    });

    const matchesMap = new Map<string, string[]>(); // baseName -> Array di famiglie
    existingGuestMap.forEach(({ baseName, familyName }) => {
      const cleanExisting = baseName.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (
        cleanExisting === cleanNew ||
        cleanExisting.includes(cleanNew) ||
        cleanNew.includes(cleanExisting)
      ) {
        if (!matchesMap.has(baseName)) {
          matchesMap.set(baseName, []);
        }
        if (!matchesMap.get(baseName)!.includes(familyName)) {
          matchesMap.get(baseName)!.push(familyName);
        }
      }
    });

    const resultDetails: string[] = [];
    matchesMap.forEach((families, baseName) => {
      resultDetails.push(`"${baseName}" per ${families.join(', ')}`);
    });

    return resultDetails;
  };

  const handleSaveGuest = (bypassWarning = false) => {
    const trimmedName = guestName.trim();
    if (!trimmedName) {
      alert("Inserisci il nome dell'ospite o dell'esterno!");
      return;
    }

    if (!bypassWarning) {
      const similarMatches = checkSimilarGuests(trimmedName, startDate, endDate);
      if (similarMatches.length > 0) {
        setWarningMessage(
          `Attenzione! Risulta già presente un ospite con nome uguale o simile:\n${similarMatches.map(m => `• ${m}`).join('\n')}\n\nConfermi che si tratta di due persone DIVERSE?`
        );
        setShowWarningModal(true);
        return;
      }
    }

    // Genera ID unico per l'ospite
    const cleanSlug = trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const guestId = `guest_${cleanSlug}_${invitedByFamilyId}_${Date.now().toString().slice(-4)}`;

    const newGuest: Person = {
      id: guestId,
      name: `${trimmedName} (Ospite)`,
      familyId: invitedByFamilyId,
      avatarBg: '#ec4899',
      isGuest: true
    };

    const updated = { ...presences };
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = getLocalDateString(d);
      const key = `${dateStr}_${guestId}`;
      updated[key] = {
        date: dateStr,
        personId: guestId,
        lunch,
        dinner,
        overnight
      };
    }

    onSavePresences(updated, newGuest);

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch (e) {}

    // Reset campi e chiudi
    setGuestName('');
    setShowWarningModal(false);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container animate-fade-in" style={{ maxWidth: '600px' }}>
        <button onClick={onClose} className="modal-close-btn">
          ✕
        </button>

        <div style={{ marginBottom: '20px', paddingRight: '45px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#047857', lineHeight: '1.2', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={26} color="#059669" />
            Aggiungi Ospite o Esterno
          </h2>
          <p style={{ color: '#64748b', fontSize: '15px', marginTop: '4px' }}>
            Registra una persona non della famiglia per pranzi, cene o pernottamenti a Ghirla
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Nome dell'Ospite */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
              👤 Nome dell'Ospite / Invitato *
            </label>
            <input
              type="text"
              placeholder="Es. Mario Rossi, Zia Anna, Amico Marco..."
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '2px solid #cbd5e1',
                fontSize: '16px',
                fontWeight: 600,
                outline: 'none'
              }}
            />
          </div>

          {/* Invitato da quale famiglia */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
              🏡 Ospite di quale famiglia?
            </label>
            <select
              value={invitedByFamilyId}
              onChange={(e) => setInvitedByFamilyId(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '2px solid #cbd5e1',
                fontSize: '15px',
                fontWeight: 600,
                backgroundColor: '#ffffff',
                outline: 'none'
              }}
            >
              {FAMILY_GROUPS.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          {/* Selezione date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                📅 Data Inizio
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (e.target.value > endDate) setEndDate(e.target.value);
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '2px solid #cbd5e1',
                  fontSize: '15px',
                  fontWeight: 600
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                📅 Data Fine
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '2px solid #cbd5e1',
                  fontSize: '15px',
                  fontWeight: 600
                }}
              />
            </div>
          </div>

          {/* Selezione pasti e notte */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '10px' }}>
              🍽️ Presenza per il periodo selezionato:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setLunch(!lunch)}
                style={{
                  padding: '12px 8px',
                  borderRadius: '14px',
                  border: lunch ? '2px solid #ea580c' : '2px solid #e2e8f0',
                  backgroundColor: lunch ? '#fff7ed' : '#f8fafc',
                  color: lunch ? '#c2410c' : '#64748b',
                  fontWeight: 700,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Sun size={18} color={lunch ? '#ea580c' : '#94a3b8'} />
                Pranzo
                {lunch && <Check size={16} color="#ea580c" />}
              </button>

              <button
                type="button"
                onClick={() => setDinner(!dinner)}
                style={{
                  padding: '12px 8px',
                  borderRadius: '14px',
                  border: dinner ? '2px solid #7c3aed' : '2px solid #e2e8f0',
                  backgroundColor: dinner ? '#f5f3ff' : '#f8fafc',
                  color: dinner ? '#6d28d9' : '#64748b',
                  fontWeight: 700,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Moon size={18} color={dinner ? '#7c3aed' : '#94a3b8'} />
                Cena
                {dinner && <Check size={16} color="#7c3aed" />}
              </button>

              <button
                type="button"
                onClick={() => setOvernight(!overnight)}
                style={{
                  padding: '12px 8px',
                  borderRadius: '14px',
                  border: overnight ? '2px solid #0284c7' : '2px solid #e2e8f0',
                  backgroundColor: overnight ? '#f0f9ff' : '#f8fafc',
                  color: overnight ? '#0369a1' : '#64748b',
                  fontWeight: 700,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Bed size={18} color={overnight ? '#0284c7' : '#94a3b8'} />
                Notte
                {overnight && <Check size={16} color="#0284c7" />}
              </button>
            </div>
          </div>

          {/* Bottone di conferma */}
          <button
            type="button"
            onClick={() => handleSaveGuest(false)}
            style={{
              marginTop: '10px',
              backgroundColor: '#059669',
              color: '#ffffff',
              border: 'none',
              padding: '16px',
              borderRadius: '16px',
              fontWeight: 800,
              fontSize: '17px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)'
            }}
          >
            <UserPlus size={22} />
            Conferma e Segna Presenza Ospite
          </button>
        </div>

        {/* Modal di Avviso per Ospite Duplicato / Simile */}
        {showWarningModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '16px'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              padding: '24px',
              maxWidth: '460px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              border: '2px solid #f59e0b',
              animation: 'fadeIn 0.2s ease-in-out'
            }}>
              <div style={{ fontSize: '36px', textAlign: 'center', marginBottom: '8px' }}>
                ⚠️
              </div>
              <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#92400e', textAlign: 'center', marginBottom: '12px' }}>
                Possibile Ospite Duplicato
              </h3>
              <p style={{ fontSize: '15px', color: '#334155', lineHeight: '1.5', whiteSpace: 'pre-line', marginBottom: '24px', textAlign: 'center' }}>
                {warningMessage}
              </p>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowWarningModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    backgroundColor: '#f8fafc',
                    color: '#475569',
                    fontWeight: 700,
                    fontSize: '15px',
                    cursor: 'pointer'
                  }}
                >
                  Annulla inserimento
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveGuest(true)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: '#d97706',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '15px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)'
                  }}
                >
                  Sì, sono 2 persone diverse
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

