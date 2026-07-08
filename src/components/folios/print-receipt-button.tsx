'use client'

export function PrintReceiptButton({ reservationId }: { reservationId: string }) {
  function handlePrint() {
    const printWindow = window.open(`/print/folios/${reservationId}`, '_blank')
    // Give the new tab a moment to render before invoking print.
    if (printWindow) {
      printWindow.onload = () => printWindow.print()
    }
  }

  return (
    <button
      onClick={handlePrint}
      className="rounded-md bg-paper-dim px-3 py-1.5 text-xs font-medium text-ink-soft hover:bg-rule/50"
    >
      Print receipt
    </button>
  )
}