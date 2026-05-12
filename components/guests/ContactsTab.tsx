'use client'

import * as React from 'react'
import { BookUser, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { BulkReview } from '@/components/guests/BulkReview'
import { pickContacts } from '@/lib/contacts-picker'
import { type ParseResult } from '@/lib/parse-contacts'

export function ContactsTab({ eventId }: { eventId: string }) {
  const t = useTranslations('events.guests.bulk')
  const [result, setResult] = React.useState<ParseResult | null>(null)
  const [pending, startTransition] = React.useTransition()

  function handlePick() {
    startTransition(async () => {
      const guests = await pickContacts()
      if (guests.length === 0) {
        // Picker was cancelled, permission denied, or no contacts had a
        // usable phone/email. Quietly inform — empty isn't an "error".
        toast.message(t('contactsEmpty'))
        return
      }
      setResult({ valid: guests, invalid: [] })
    })
  }

  return (
    <div className="space-y-3 rounded-2xl bg-black/30 p-4 ring-1 ring-white/10 backdrop-blur-md">
      <header className="space-y-1">
        <h2 className="text-sm font-medium text-white">{t('contactsTitle')}</h2>
        <p className="text-xs text-white/60">{t('contactsHelper')}</p>
      </header>

      <Button
        type="button"
        onClick={handlePick}
        disabled={pending}
        className="w-full sm:w-auto"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <BookUser className="h-4 w-4" />
        )}
        {t('openContactsButton')}
      </Button>

      {result && (
        <BulkReview
          eventId={eventId}
          result={result}
          onSuccess={() => setResult(null)}
          onCancel={() => setResult(null)}
        />
      )}
    </div>
  )
}
