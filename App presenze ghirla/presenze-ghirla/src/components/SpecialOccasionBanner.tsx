import React, { useState } from 'react';
import { Sparkles, Cake, Heart, PartyPopper, Calendar, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { SPECIAL_OCCASIONS, type SpecialOccasion } from '../data/specialOccasions';
import { getLocalDateString } from '../utils/dateUtils';

interface SpecialOccasionBannerProps {
  onOpenDateDetail?: (dateStr: string) => void;
}

export const SpecialOccasionBanner: React.FC<SpecialOccasionBannerProps> = ({ onOpenDateDetail }) => {
  const [isDismissed, setIsDismissed] = useState(false);

  const today = new Date();
  const todayStr = getLocalDateString(today);
  const todayMmDd = todayStr.slice(5, 10);

  const todayOccasions = SPECIAL_OCCASIONS.filter(o => o.date === todayMmDd);

  // Check upcoming occasions in the next 3 days
  const upcomingList: { daysDiff: number; dateStr: string; occasion: SpecialOccasion }[] = [];
  if (todayOccasions.length === 0) {
    for (let i = 1; i <= 3; i++) {
      const nextDate = new Date();
      nextDate.setDate(today.getDate() + i);
      const nextDateStr = getLocalDateString(nextDate);
      const nextMmDd = nextDateStr.slice(5, 10);
      const matches = SPECIAL_OCCASIONS.filter(o => o.date === nextMmDd);
      matches.forEach(occ => {
        upcomingList.push({ daysDiff: i, dateStr: nextDateStr, occasion: occ });
      });
    }
  }

  if (isDismissed || (todayOccasions.length === 0 && upcomingList.length === 0)) {
    return null;
  }

  const triggerConfetti = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.3 }
      });
    } catch {
      // ignore
    }
  };

  // Case 1: Today has special occasion(s)
  if (todayOccasions.length > 0) {
    return (
      <div
        style={{
          background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 40%, #fed7aa 100%)',
          border: '2px solid #f59e0b',
          borderRadius: '20px',
          padding: '18px 22px',
          marginBottom: '24px',
          boxShadow: '0 10px 25px rgba(245, 158, 11, 0.18)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <button
          onClick={() => setIsDismissed(true)}
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            background: 'rgba(255, 255, 255, 0.7)',
            border: 'none',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#78350f'
          }}
          title="Nascondi promemoria"
        >
          <X size={16} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div
            style={{
              backgroundColor: '#f59e0b',
              color: '#ffffff',
              borderRadius: '12px',
              padding: '6px 12px',
              fontWeight: 800,
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            <Sparkles size={16} />
            Ricorrenza Speciale di Oggi!
          </div>

          <span style={{ fontSize: '13px', color: '#92400e', fontWeight: 600 }}>
            {today.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {todayOccasions.map((occ, idx) => {
            const isBirthday = occ.type === 'birthday';
            const isAnniversary = occ.type === 'anniversary';

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.85)',
                  padding: '10px 16px',
                  borderRadius: '14px',
                  border: '1px solid rgba(245, 158, 11, 0.25)'
                }}
              >
                <div style={{ fontSize: '24px' }}>
                  {isBirthday ? '🎂' : isAnniversary ? '💍' : '😇'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '16px', color: '#78350f' }}>
                    {occ.title}
                  </div>
                  {occ.description && (
                    <div style={{ fontSize: '13px', color: '#92400e', marginTop: '2px' }}>
                      {occ.description}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginTop: '4px' }}>
          <div style={{ fontSize: '14px', color: '#92400e', fontWeight: 700 }}>
            Tanti auguri da tutta la famiglia! 🥂
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={triggerConfetti}
              style={{
                backgroundColor: '#f59e0b',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(245, 158, 11, 0.3)'
              }}
            >
              <PartyPopper size={16} />
              Lancia Coriandoli 🎉
            </button>

            {onOpenDateDetail && (
              <button
                onClick={() => onOpenDateDetail(todayStr)}
                style={{
                  backgroundColor: '#ffffff',
                  color: '#b45309',
                  border: '1.5px solid #f59e0b',
                  padding: '8px 14px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '13px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Calendar size={15} />
                Vedi Presenze Oggi
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Upcoming occasion in 1-3 days
  const nextOcc = upcomingList[0];
  const daysLabel = nextOcc.daysDiff === 1 ? 'Domani' : `Tra ${nextOcc.daysDiff} giorni`;
  const isBirthday = nextOcc.occasion.type === 'birthday';
  const isAnniversary = nextOcc.occasion.type === 'anniversary';

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
        border: '1.5px solid #bfdbfe',
        borderRadius: '16px',
        padding: '14px 18px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 2px 8px rgba(37, 99, 235, 0.06)',
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            backgroundColor: '#dbeafe',
            color: '#1d4ed8',
            borderRadius: '10px',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isBirthday ? <Cake size={20} /> : isAnniversary ? <Heart size={20} /> : <Sparkles size={20} />}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '8px',
                textTransform: 'uppercase'
              }}
            >
              {daysLabel}
            </span>
            <span style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '15px' }}>
              {nextOcc.occasion.title}
            </span>
          </div>
          {nextOcc.occasion.description && (
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              {nextOcc.occasion.description}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {onOpenDateDetail && (
          <button
            onClick={() => onOpenDateDetail(nextOcc.dateStr)}
            style={{
              backgroundColor: '#ffffff',
              color: '#2563eb',
              border: '1px solid #bfdbfe',
              padding: '6px 12px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer'
            }}
          >
            <Calendar size={14} />
            Dettagli giorno
          </button>
        )}

        <button
          onClick={() => setIsDismissed(true)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            padding: '4px'
          }}
          title="Chiudi"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
