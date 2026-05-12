'use client'

import * as React from 'react'
import { ListPlus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { BulkReview } from '@/components/guests/BulkReview'
import {
  parseContactsFromPaste,
  type ParseResult,
} from '@/lib/parse-contacts'

type PasteTabProps = {
  eventId: string
  existingPhones: string[]
  existingEmails: string[]
}

export function PasteTab({
  eventId,
  existingPhones,
  existingEmails,
}: PasteTabProps) {
  const t = useTranslations('events.guests.bulk')
  const [text, setText] = React.useState('')
  const [result, setResult] = React.useState<ParseResult | null>(null)

  function handleParse() {
    const parsed = parseContactsFromPaste(text)
    setResult(parsed)
  }

  return (
    <div className="space-y-3 rounded-2xl bg-black/30 p-4 ring-1 ring-white/10 backdrop-blur-md">
      <header className="space-y-1">
        <h2 className="text-sm font-medium text-white">{t('pasteTitle')}</h2>
        <p className="text-xs text-white/60">{t('pasteHelper')}</p>
      </header>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('pastePlaceholder')}
        rows={6}
        className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 font-mono text-xs text-white placeholder:text-white/40 focus:border-violet-400/60 focus:outline-hidden focus:ring-2 focus:ring-violet-400/40"
      />

      <Button
        type="button"
        onClick={handleParse}
        disabled={!text.trim()}
        className="w-full sm:w-auto"
      >
        <ListPlus className="h-4 w-4" />
        {t('parseButton')}
      </Button>

      {result && (
        <BulkReview
          eventId={eventId}
          result={result}
          existingPhones={existingPhones}
          existingEmails={existingEmails}
          onSuccess={() => {
            setResult(null)
            setText('')
          }}
          onCancel={() => setResult(null)}
        />
      )}
    </div>
  )
}
