'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { checkEventSpaceAvailability, createEventBooking } from '@/app/dashboard/events/actions'
import type { Tables } from '@/lib/database.types'

export function NewEventBookingForm({ eventSpaces }: { eventSpaces: Tables<'event_spaces'>[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [eventSpaceId, setEventSpaceId] = useState('')
  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [setupType, setSetupType] = useState('')
  const [headcount, setHeadcount] = useState('')
  const [cateringNotes, setCateringNotes] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const [available, setAvailable] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(false)

  async function refreshAvailability(space: string, date: string, start: string, end: string) {
    if (!space || !date || !start || !end || end <= start) {
      setAvailable(null)
      return
    }
    setChecking(true)
    const result = await checkEventSpaceAvailability(space, date, start, end)
    setChecking(false)
    setAvailable(result.available ?? false)
  }

  function handleSubmit() {
    setError(null)
    startTransition(async () => {
      const result = await createEventBooking({
        eventSpaceId,
        eventName,
        eventDate,
        startTime,
        endTime,
        setupType,
        headcount: Number(headcount) || 0,
        cateringNotes,
        contact: { firstName, lastName, email, phone },
      })
      if (result?.error) {
        setError(result.error)
        return
      }
      router.push(`/dashboard/events/${result.bookingId}`)
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-paper hover:bg-indigo-800"
      >
        + New Event Booking
      </button>
    )
  }

  const inputClass = 'w-full rounded-md border border-rule px-3 py-1.5 text-sm'

  return (
    <div className="mb-6 space-y-4 rounded-lg border border-rule bg-white p-4">
      <div className="grid grid-cols-2 gap-3">
        <input
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          placeholder="Event name"
          className={inputClass}
        />
        <select
          value={eventSpaceId}
          onChange={(e) => {
            setEventSpaceId(e.target.value)
            refreshAvailability(e.target.value, eventDate, startTime, endTime)
          }}
          className={inputClass}
        >
          <option value="">Select event space...</option>
          {eventSpaces.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={eventDate}
          onChange={(e) => {
            setEventDate(e.target.value)
            refreshAvailability(eventSpaceId, e.target.value, startTime, endTime)
          }}
          className={inputClass}
        />
        <input
          type="number"
          placeholder="Headcount"
          value={headcount}
          onChange={(e) => setHeadcount(e.target.value)}
          className={inputClass}
        />
        <input
          type="time"
          value={startTime}
          onChange={(e) => {
            setStartTime(e.target.value)
            refreshAvailability(eventSpaceId, eventDate, e.target.value, endTime)
          }}
          className={inputClass}
        />
        <input
          type="time"
          value={endTime}
          onChange={(e) => {
            setEndTime(e.target.value)
            refreshAvailability(eventSpaceId, eventDate, startTime, e.target.value)
          }}
          className={inputClass}
        />
        <input
          value={setupType}
          onChange={(e) => setSetupType(e.target.value)}
          placeholder="Setup type (theatre, banquet...)"
          className={`col-span-2 ${inputClass}`}
        />
        <textarea
          value={cateringNotes}
          onChange={(e) => setCateringNotes(e.target.value)}
          rows={2}
          placeholder="Catering notes"
          className={`col-span-2 ${inputClass}`}
        />
      </div>

      {checking && <p className="text-xs text-ink-soft">Checking availability...</p>}
      {!checking && available !== null && (
        <p className={`text-xs font-medium ${available ? 'text-status-good' : 'text-status-bad'}`}>
          {available ? 'Available' : 'Not available for this time window'}
        </p>
      )}

      <div className="border-t border-rule pt-3">
        <p className="mb-2 text-xs font-medium text-ink-soft">Contact</p>
        <div className="grid grid-cols-2 gap-3">
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className={inputClass} />
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" className={inputClass} />
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className={inputClass} />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className={inputClass} />
        </div>
      </div>

      {error && <p className="text-sm text-status-bad">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={isPending || available === false}
          className="rounded-md bg-indigo-700 px-4 py-1.5 text-sm font-medium text-paper hover:bg-indigo-800 disabled:opacity-50"
        >
          {isPending ? 'Booking...' : 'Create Booking'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md px-4 py-1.5 text-sm font-medium text-ink-soft hover:bg-paper-dim"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}