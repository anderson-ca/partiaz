'use client'

import * as React from 'react'
import { Loader2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { addGuestsBatch, type AddGuestInput } from '@/app/actions/guests'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import { type ParseResult } from '@/lib/parse-contacts'
import { formatPhoneDisplay } from '@/lib/phone'
import { FLOATING_SURFACE } from '@/lib/ui/floating-surface'
import { cn } from '@/lib/utils'

type ReviewRow = {
  rowId: string
  name: string
  phone: string | null
  email: string | null
}

type BulkReviewProps = {
  eventId: string
  result: ParseResult
  /** E.164 phones already on the guest list for this event. */
  existingPhones: string[]
  /** Lowercased emails already on the guest list for this event. */
  existingEmails: string[]
  onSuccess: () => void
  onCancel: () => void
}

export function BulkReview({
  eventId,
  result,
  existingPhones,
  existingEmails,
  onSuccess,
  onCancel,
}: BulkReviewProps) {
  const t = useTranslations('events.guests.bulk')
  const router = useRouter()
  // Defer mounting the Radix wrapper until after first paint — same pattern
  // as ResponsivePicker (CLAUDE.md "Responsive Radix wrappers — defer until
  // mount") to keep useId() sequences stable across SSR/hydration.
  const [mounted, setMounted] = React.useState(false)
  const isDesktop = useMediaQuery('(min-width: 768px)')

  // Partition parsed rows ONCE on mount: already-on-list (read-only "skipped"
  // section) vs willAdd (editable, counted toward submit). Also dedupes
  // within the same paste — first occurrence wins, the rest go to the
  // already-on-list bucket. Mirrors the server's `addGuestsBatch` dedupe
  // logic so what the user sees matches what gets inserted.
  const [{ initialRows, alreadyOnList }] = React.useState(() => {
    const phoneSet = new Set(existingPhones)
    const emailSet = new Set(existingEmails)
    const seenPhones = new Set<string>()
    const seenEmails = new Set<string>()
    const initial: ReviewRow[] = []
    const skipped: { phone: string | null; email: string | null }[] = []
    result.valid.forEach((g, i) => {
      const collides =
        (g.phone && (phoneSet.has(g.phone) || seenPhones.has(g.phone))) ||
        (g.email && (emailSet.has(g.email) || seenEmails.has(g.email)))
      if (collides) {
        skipped.push({ phone: g.phone, email: g.email })
        return
      }
      if (g.phone) seenPhones.add(g.phone)
      if (g.email) seenEmails.add(g.email)
      initial.push({
        rowId: `row-${i}`,
        name: g.name ?? '',
        phone: g.phone,
        email: g.email,
      })
    })
    return { initialRows: initial, alreadyOnList: skipped }
  })

  const [rows, setRows] = React.useState<ReviewRow[]>(initialRows)
  const [pending, startTransition] = React.useTransition()

  React.useEffect(() => setMounted(true), [])

  function handleSubmit() {
    startTransition(async () => {
      const inputs: AddGuestInput[] = rows.map((r) => ({
        name: r.name,
        phone: r.phone ?? undefined,
        email: r.email ?? undefined,
      }))
      const res = await addGuestsBatch(eventId, inputs)
      if (!res.ok) {
        toast.error(t(`errors.${res.error}`))
        return
      }
      toast.success(
        t('successToast', { added: res.added, skipped: res.skipped }),
      )
      onSuccess()
      router.refresh()
    })
  }

  function handleRemove(rowId: string) {
    setRows((curr) => curr.filter((r) => r.rowId !== rowId))
  }

  function handleNameChange(rowId: string, name: string) {
    setRows((curr) =>
      curr.map((r) => (r.rowId === rowId ? { ...r, name } : r)),
    )
  }

  const inputClass =
    'w-full rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 text-sm text-white placeholder:text-white/40 focus:border-violet-400/60 focus:outline-hidden focus:ring-2 focus:ring-violet-400/40'

  const body = (
    <div className="space-y-3 py-2">
      {rows.length === 0 ? (
        <p className="text-sm text-white/60">{t('reviewAllRemoved')}</p>
      ) : (
        <ul className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
          {rows.map((row) => (
            <li
              key={row.rowId}
              className="flex items-start gap-2 rounded-lg bg-white/5 p-2.5"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <input
                  type="text"
                  value={row.name}
                  onChange={(e) => handleNameChange(row.rowId, e.target.value)}
                  placeholder={t('reviewNamePlaceholder')}
                  className={inputClass}
                  autoComplete="off"
                />
                <p className="truncate text-xs text-white/50">
                  {[
                    row.phone ? formatPhoneDisplay(row.phone) : null,
                    row.email,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(row.rowId)}
                aria-label={t('reviewRemoveAria')}
                className="mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {alreadyOnList.length > 0 && (
        <section className="space-y-1.5 rounded-lg bg-white/5 p-3 ring-1 ring-white/10">
          <h3 className="text-xs font-medium text-white/70">
            {t('reviewAlreadyOnListTitle', { count: alreadyOnList.length })}
          </h3>
          <ul className="space-y-0.5 text-xs text-white/50">
            {alreadyOnList.map((row, i) => (
              <li key={i} className="truncate">
                {[
                  row.phone ? formatPhoneDisplay(row.phone) : null,
                  row.email,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </li>
            ))}
          </ul>
        </section>
      )}

      {result.invalid.length > 0 && (
        <section className="space-y-1.5 rounded-lg bg-rose-500/10 p-3 ring-1 ring-rose-500/20">
          <h3 className="text-xs font-medium text-rose-300">
            {t('reviewInvalidTitle', { count: result.invalid.length })}
          </h3>
          <ul className="space-y-0.5 text-xs text-rose-200/80">
            {result.invalid.map((inv, i) => (
              <li key={i} className="truncate">
                {inv.line}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )

  const title = t('reviewTitle', { count: rows.length })
  const description = t('reviewDescription')

  const footer = (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={pending}
      >
        {t('cancel')}
      </Button>
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={pending || rows.length === 0}
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {t('reviewSubmit', { count: rows.length })}
      </Button>
    </>
  )

  if (!mounted) return null

  if (isDesktop) {
    return (
      <Dialog open onOpenChange={(o) => !o && !pending && onCancel()}>
        <DialogContent
          className={cn(FLOATING_SURFACE, 'max-w-lg rounded-2xl text-white')}
        >
          <DialogHeader>
            <DialogTitle className="text-white">{title}</DialogTitle>
            <DialogDescription className="text-white/70">
              {description}
            </DialogDescription>
          </DialogHeader>
          {body}
          <DialogFooter>{footer}</DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open onOpenChange={(o) => !o && !pending && onCancel()}>
      <SheetContent
        side="bottom"
        className={cn(FLOATING_SURFACE, 'rounded-t-2xl text-white')}
      >
        <SheetHeader>
          <SheetTitle className="text-white">{title}</SheetTitle>
          <SheetDescription className="text-white/70">
            {description}
          </SheetDescription>
        </SheetHeader>
        <div className="px-4">{body}</div>
        <SheetFooter>{footer}</SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
