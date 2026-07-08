const RESEND_API_URL = 'https://api.resend.com/emails'

// Brand tokens, hardcoded here rather than imported — email clients need
// inline styles/hex values, they can't read Tailwind's CSS variables.
const INK = '#1c1a17'
const INK_SOFT = '#514c42'
const PAPER = '#fbf8f2'
const RULE = '#d8cfbb'
const INDIGO = '#24345c'
const BRASS = '#a9772e'
const BRASS_BG = '#f2e6d0'
const STATUS_GOOD = '#3f7859'
const STATUS_BAD = '#a5432e'
const STATUS_WARN = '#b4802a'

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — skipping email send:', subject, 'to', to)
    return { skipped: true }
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'bookings@yourhotel.com',
        to,
        subject,
        html,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Failed to send email:', errorText)
      return { error: errorText }
    }

    return { success: true }
  } catch (err) {
    // Never let an email failure break the booking/payment/cancellation flow
    // that triggered it — log and move on.
    console.error('Email send error:', err)
    return { error: err instanceof Error ? err.message : 'Unknown email error' }
  }
}

// Shared shell: indigo header band + paper body, mirroring the site's
// adire/ledger identity. Kept to table-based layout and inline styles
// throughout since this needs to render in Outlook/Gmail/etc, not just
// modern browsers.
function wrapTemplate(bodyHtml: string, eyebrow: string) {
  return `
    <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 520px; margin: 0 auto; background-color: ${PAPER};">
      <div style="background-color: ${INDIGO}; padding: 20px 28px;">
        <p style="margin: 0; font-family: 'Courier New', monospace; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: ${BRASS};">
          ${eyebrow}
        </p>
        <p style="margin: 4px 0 0; font-family: Georgia, serif; font-size: 18px; color: ${PAPER};">
          Our Hotel
        </p>
      </div>
      <div style="padding: 28px; font-family: Arial, sans-serif; color: ${INK};">
        ${bodyHtml}
      </div>
      <div style="border-top: 1px solid ${RULE}; padding: 16px 28px;">
        <p style="margin: 0; font-family: Arial, sans-serif; font-size: 11px; color: ${INK_SOFT};">
          Thank you for choosing us.
        </p>
      </div>
    </div>
  `
}

function detailRow(label: string, value: string) {
  return `<tr>
    <td style="font-family: Arial, sans-serif; font-weight: 600; padding: 5px 12px 5px 0; color: ${INK_SOFT}; font-size: 13px;">${label}</td>
    <td style="font-family: Arial, sans-serif; padding: 5px 0; color: ${INK}; font-size: 13px;">${value}</td>
  </tr>`
}

function ledgerStamp(reference: string) {
  return `
    <p style="font-family: Arial, sans-serif; font-size: 12px; color: ${INK_SOFT}; margin: 16px 0 6px;">
      Booking reference — keep this to manage your booking:
    </p>
    <span style="display: inline-block; font-family: 'Courier New', monospace; font-size: 12px; letter-spacing: 0.5px; padding: 6px 10px; border: 1px solid ${BRASS}; border-radius: 4px; color: ${BRASS}; background-color: ${BRASS_BG};">
      ${reference}
    </span>
  `
}

export function bookingConfirmationEmail(params: {
  guestName: string
  roomTypeName: string
  checkIn: string
  checkOut: string
  totalAmount: number
  reservationId: string
}) {
  return wrapTemplate(
    `
      <h2 style="font-family: Georgia, serif; font-weight: 500; color: ${STATUS_GOOD}; margin: 0 0 12px;">Booking Confirmed</h2>
      <p style="font-family: Arial, sans-serif; font-size: 14px;">Hi ${params.guestName},</p>
      <p style="font-family: Arial, sans-serif; font-size: 14px;">Your booking is confirmed. Here are the details:</p>
      <table style="width: 100%; margin: 16px 0;">
        ${detailRow('Room', params.roomTypeName)}
        ${detailRow('Check-in', params.checkIn)}
        ${detailRow('Check-out', params.checkOut)}
        ${detailRow('Total', params.totalAmount.toLocaleString())}
      </table>
      ${ledgerStamp(params.reservationId)}
    `,
    'Reservation Confirmed'
  )
}

export function cancellationEmail(params: {
  guestName: string
  roomTypeName: string
  checkIn: string
  checkOut: string
}) {
  return wrapTemplate(
    `
      <h2 style="font-family: Georgia, serif; font-weight: 500; color: ${STATUS_BAD}; margin: 0 0 12px;">Booking Cancelled</h2>
      <p style="font-family: Arial, sans-serif; font-size: 14px;">Hi ${params.guestName},</p>
      <p style="font-family: Arial, sans-serif; font-size: 14px;">Your booking has been cancelled as requested:</p>
      <table style="width: 100%; margin: 16px 0;">
        ${detailRow('Room', params.roomTypeName)}
        ${detailRow('Check-in', params.checkIn)}
        ${detailRow('Check-out', params.checkOut)}
      </table>
      <p style="font-family: Arial, sans-serif; font-size: 13px; color: ${INK_SOFT};">
        If this wasn't you, please contact the hotel right away.
      </p>
    `,
    'Reservation Cancelled'
  )
}

export function paymentReceiptEmail(params: {
  guestName: string
  amount: number
  method: string
  balance: number
}) {
  return wrapTemplate(
    `
      <h2 style="font-family: Georgia, serif; font-weight: 500; color: ${STATUS_GOOD}; margin: 0 0 12px;">Payment Received</h2>
      <p style="font-family: Arial, sans-serif; font-size: 14px;">Hi ${params.guestName},</p>
      <p style="font-family: Arial, sans-serif; font-size: 14px;">
        We've received your payment of
        <strong style="font-family: 'Courier New', monospace;">${params.amount.toLocaleString()}</strong>
        via ${params.method}.
      </p>
      <p style="font-family: Arial, sans-serif; font-size: 14px;">
        Remaining balance:
        <strong style="font-family: 'Courier New', monospace;">${params.balance.toLocaleString()}</strong>
      </p>
    `,
    'Payment Receipt'
  )
}

export function waitlistAvailabilityEmail(params: {
  guestName: string
  roomTypeName: string
  checkIn: string
  checkOut: string
}) {
  return wrapTemplate(
    `
      <h2 style="font-family: Georgia, serif; font-weight: 500; color: ${STATUS_WARN}; margin: 0 0 12px;">A Room May Be Available</h2>
      <p style="font-family: Arial, sans-serif; font-size: 14px;">Hi ${params.guestName},</p>
      <p style="font-family: Arial, sans-serif; font-size: 14px;">
        Good news — a ${params.roomTypeName} may have opened up for your requested dates
        (${params.checkIn} to ${params.checkOut}). Availability moves quickly, so please
        contact us or book online as soon as possible to confirm.
      </p>
    `,
    'Waitlist Update'
  )
}