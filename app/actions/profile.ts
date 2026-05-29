'use server'

import 'server-only'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { paymentMethodsSchema } from '@/lib/schemas/payment'
import { createClient } from '@/lib/supabase/server'

// Input the client form sends. Each field is the *user's typed string*
// (or undefined when the field was left blank). The action runs each
// through the payment Zod schema, which normalizes IBAN to spaceless
// uppercase and phones to E.164, then writes the resulting JSON to
// profiles.payment_methods.
const updatePaymentMethodsInput = z.object({
  iban: z.string().optional(),
  m10_phone: z.string().optional(),
  birbank_phone: z.string().optional(),
})

export type UpdatePaymentMethodsInput = z.infer<
  typeof updatePaymentMethodsInput
>

export type UpdatePaymentMethodsResult =
  | { ok: true }
  | {
      ok: false
      error: 'unauthenticated' | 'invalid_payment_methods' | 'update_failed'
      /** When error === 'invalid_payment_methods', this maps the offending
       *  field key (e.g. 'iban') to its Zod issue message
       *  (e.g. 'invalid_iban_checksum'). The form maps these to i18n keys. */
      fieldErrors?: Partial<Record<keyof UpdatePaymentMethodsInput, string>>
    }

export async function updatePaymentMethods(
  input: UpdatePaymentMethodsInput,
): Promise<UpdatePaymentMethodsResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthenticated' }

  // Phase 1: shape sanity. We accept three optional strings — anything
  // else is a programming error.
  const shape = updatePaymentMethodsInput.safeParse(input)
  if (!shape.success) {
    console.error('[updatePaymentMethods] input shape mismatch:', shape.error)
    return { ok: false, error: 'invalid_payment_methods' }
  }

  // Phase 2: per-field normalization + format/checksum validation via the
  // canonical schema from [ui-8.1]. Field-scoped issues are surfaced back
  // to the client so the form can highlight just the offending row.
  const parsed = paymentMethodsSchema.safeParse(shape.data)
  if (!parsed.success) {
    const fieldErrors: NonNullable<
      Extract<UpdatePaymentMethodsResult, { ok: false }>['fieldErrors']
    > = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]
      if (
        typeof key === 'string' &&
        (key === 'iban' || key === 'm10_phone' || key === 'birbank_phone')
      ) {
        fieldErrors[key] = issue.message
      }
    }
    return { ok: false, error: 'invalid_payment_methods', fieldErrors }
  }

  // Construct the JSON to persist. Explicit nulls for absent fields keep
  // the row shape stable so the read path doesn't need to distinguish
  // "field missing" vs "field intentionally cleared". The whole column is
  // set to null when every method is unset (consistent with the [ui-8.1]
  // semantic that null = "host hasn't entered anything").
  const next = parsed.data
  const payload =
    next && (next.iban || next.m10_phone || next.birbank_phone)
      ? {
          iban: next.iban ?? null,
          m10_phone: next.m10_phone ?? null,
          birbank_phone: next.birbank_phone ?? null,
        }
      : null

  const { error: dbError } = await supabase
    .from('profiles')
    .update({ payment_methods: payload })
    .eq('id', user.id)

  if (dbError) {
    console.error('[updatePaymentMethods] db update failed:', dbError)
    return { ok: false, error: 'update_failed' }
  }

  // Settings detail page reads from profiles; the public event page's
  // payment-methods card (lands in [ui-8.3]) will also read from here.
  // Revalidate the settings detail path so the next visit shows the
  // freshly-saved values without a forced reload.
  revalidatePath('/settings/payment-methods')
  return { ok: true }
}
