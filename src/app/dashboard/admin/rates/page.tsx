import { createClient } from '@/lib/supabase/server'
import { getCurrentStaff } from '@/lib/get-current-staff'
import { redirect } from 'next/navigation'
import { RatePlanForm } from '@/components/admin/rate-plan-form'
import { RatePlansTable } from '@/components/admin/rate-plans-table'
import { TaxRuleForm } from '@/components/admin/tax-rule-form'
import { TaxRulesTable } from '@/components/admin/tax-rules-table'

export default async function RatesAndTaxPage() {
  const staff = await getCurrentStaff()
  if (staff.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()

  const [{ data: roomTypes }, { data: ratePlans }, { data: taxRules }] = await Promise.all([
    supabase.from('room_types').select('*').order('name'),
    supabase
      .from('rate_plans')
      .select('*, room_types(name)')
      .order('start_date', { ascending: false }),
    supabase.from('tax_rules').select('*').order('created_at'),
  ])

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-display font-medium text-ink">Rate Plans</h1>
          <RatePlanForm roomTypes={roomTypes || []} />
        </div>
        <p className="mb-4 text-xs text-ink-soft">
          Seasonal or date-range overrides. For any night not covered by a rate plan, the room
          type&apos;s base rate applies.
        </p>
        <RatePlansTable ratePlans={ratePlans || []} />
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-display font-medium text-ink">Tax Rules</h1>
          <TaxRuleForm />
        </div>
        <p className="mb-4 text-xs text-ink-soft">
          Inclusive taxes are already baked into nightly rates and shown for reporting only —
          they are not charged again. Exclusive taxes are added on top of the room subtotal at
          booking time.
        </p>
        <TaxRulesTable taxRules={taxRules || []} />
      </section>
    </div>
  )
}