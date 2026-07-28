import React, { useState } from 'react';
import type { PresenceEntry, Person } from '../data/familyData';
import { FAMILY_GROUPS } from '../data/familyData';
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

  const handleSaveGuest = () => {
    const trimmedName = guestName.trim();
    if (!trimmedName) {
      alert("Inserisci il nome dell'ospite o dell'esterno!");
      return;
    }

    // Genera ID unico per l'ospite
    const cleanSlug = trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const guestId = `guest_${cleanSlug}_${Date.now().toString().slice(-4)}`;

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
            onClick={handleSaveGuest}
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
      </div>
    </div>
  );
};
