export function RateTagIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12.5 3.5h5a2 2 0 0 1 2 2v5a2 2 0 0 1-.586 1.414l-7.5 7.5a2 2 0 0 1-2.828 0l-5-5a2 2 0 0 1 0-2.828l7.5-7.5A2 2 0 0 1 12.5 3.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="16.5" cy="7.5" r="1.25" fill="currentColor" />
    </svg>
  )
}

export function ClockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function CardIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.5 9.5h19" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 14.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function WifiIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 9.5c4.5-4 11.5-4 16 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M7 13c2.8-2.3 7.2-2.3 10 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M10 16.5c1.2-1 2.8-1 4 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="19" r="1" fill="currentColor" />
    </svg>
  )
}

// Room-card accent badge — a simple key motif standing in for room
// photography until real photos exist (room_types.photos is already
// wired for that; swap the gradient block for an <img> at that point).
export function RoomKeyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="8" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 12h9.5M17.5 12v3M20 12v2.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}