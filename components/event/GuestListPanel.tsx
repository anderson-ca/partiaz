'use client'

import * as React from 'react'
import { Loader2, MessageSquare, MoreVertical, UserCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { removeGuest } from '@/app/actions/rsvp'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Pill, type PillProps } from '@/components/ui/pill'
import { FLOATING_SURFACE } from '@/lib/ui/floating-surface'
import { cn } from '@/lib/utils'

export type GuestRow = {
  id: string
  name: string
  rsvp: 'yes' | 'no' | 'maybe' | 'pending'
  email: string | null
  phone: string | null
  guest_message: string | null
  claimed_user_id: string | null
  responded_at: string | null
}

type Filter = 'all' | 'yes' | 'maybe' | 'no' | 'pending'

type GuestListPanelProps = {
  guests: GuestRow[]
  capacity: number | null
}

const STATUS_PILL: Record<GuestRow['rsvp'], PillProps['variant']> = {
  yes: 'success',
  maybe: 'info',
  no: 'muted',
  pending: 'muted',
}

export function GuestListPanel({ guests, capacity }: GuestListPanelProps) {
  const t = useTranslations('rsvp.guestList')
  const [filter, setFilter] = React.useState<Filter>('all')

  const counts = React.useMemo(() => {
    const acc = { all: guests.length, yes: 0, maybe: 0, no: 0, pending: 0 }
    for (const g of guests) acc[g.rsvp] += 1
    return acc
  }, [guests])

  const filtered = React.useMemo(() => {
    if (filter === 'all') return guests
    return guests.filter((g) => g.rsvp === filter)
  }, [guests, filter])

  const overCapacity = capacity != null && counts.yes > capacity

  return (
    <div
      id="guests"
      className="space-y-3 rounded-2xl bg-black/30 p-4 ring-1 ring-white/10 backdrop-blur-md"
    >
      <header className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-white">{t('panelTitle')}</h3>
        {capacity != null && (
          <span
            className={cn(
              'text-xs',
              overCapacity ? 'text-rose-300' : 'text-white/60',
            )}
          >
            {t('capacityIndicator', { going: counts.yes, capacity })}
          </span>
        )}
      </header>

      {overCapacity && capacity != null && (
        <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          {t('capacityWarning', { going: counts.yes, capacity })}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5">
        <FilterChip
          label={t('filterAll')}
          count={counts.all}
          active={filter === 'all'}
          onClick={() => setFilter('all')}
        />
        <FilterChip
          label={t('filterGoing')}
          count={counts.yes}
          active={filter === 'yes'}
          onClick={() => setFilter('yes')}
        />
        <FilterChip
          label={t('filterMaybe')}
          count={counts.maybe}
          active={filter === 'maybe'}
          onClick={() => setFilter('maybe')}
        />
        <FilterChip
          label={t('filterNo')}
          count={counts.no}
          active={filter === 'no'}
          onClick={() => setFilter('no')}
        />
        <FilterChip
          label={t('filterPending')}
          count={counts.pending}
          active={filter === 'pending'}
          onClick={() => setFilter('pending')}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="px-2 py-6 text-center text-xs text-white/50">
          {t('emptyState')}
        </p>
      ) : (
        <ul className="divide-y divide-white/5">
          {filtered.map((g) => (
            <GuestRowItem key={g.id} guest={g} />
          ))}
        </ul>
      )}
    </div>
  )
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors',
        active
          ? 'border-violet-400 bg-violet-500/15 text-white'
          : 'border-white/15 bg-white/5 text-white/70 hover:bg-white/10',
      )}
    >
      <span>{label}</span>
      <span className="text-white/50">{count}</span>
    </button>
  )
}

function GuestRowItem({ guest }: { guest: GuestRow }) {
  const t = useTranslations('rsvp.guestList')
  const tStatus = useTranslations('rsvp.statusButtons')
  const tCommon = useTranslations('rsvp')
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [expandedMessage, setExpandedMessage] = React.useState(false)
  const [pending, startTransition] = React.useTransition()

  function handleRemove() {
    startTransition(async () => {
      const result = await removeGuest(guest.id)
      if (!result.ok) {
        toast.error(t('removeError'))
        return
      }
      toast.success(t('removeSuccess'))
      setOpen(false)
      router.refresh()
    })
  }

  const initial = guest.name.slice(0, 1).toUpperCase()
  const statusLabel =
    guest.rsvp === 'pending' ? '—' : tStatus(guest.rsvp)
  const hasMessage = !!guest.guest_message

  return (
    <li className="flex items-start gap-3 py-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-violet-400 to-fuchsia-600 text-xs font-semibold text-white">
        {initial || '?'}
      </span>
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-medium text-white">
            {guest.name || '—'}
          </span>
          <Pill variant={STATUS_PILL[guest.rsvp]} className="text-[10px]">
            {statusLabel}
          </Pill>
          {guest.claimed_user_id && (
            <Pill variant="default" className="gap-1 text-[10px]">
              <UserCircle className="h-3 w-3" />
              {t('loggedInBadge')}
            </Pill>
          )}
          {hasMessage && (
            <button
              type="button"
              onClick={() => setExpandedMessage((v) => !v)}
              className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/70 hover:text-white"
            >
              <MessageSquare className="h-3 w-3" />
              {t('messageBadge')}
            </button>
          )}
        </div>
        {(guest.email || guest.phone) && (
          <div className="truncate text-xs text-white/60">
            {guest.email ?? guest.phone}
          </div>
        )}
        {hasMessage && expandedMessage && (
          <p className="mt-1 rounded-lg bg-white/5 px-3 py-2 text-xs whitespace-pre-wrap text-white/80">
            {guest.guest_message}
          </p>
        )}
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40"
              aria-label={t('removeAction')}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={6}
            className={cn(FLOATING_SURFACE, 'min-w-36 rounded-xl p-1')}
          >
            <DropdownMenuItem
              variant="destructive"
              className="gap-2 text-rose-300 focus:bg-rose-500/15 focus:text-rose-200"
              onSelect={(e) => {
                e.preventDefault()
                setOpen(true)
              }}
            >
              {t('removeAction')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialogContent
          className={cn(FLOATING_SURFACE, 'rounded-2xl sm:max-w-md')}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {t('removeConfirmTitle', { name: guest.name || '—' })}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              {t('removeConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline" disabled={pending}>
              {tCommon('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={(e) => {
                e.preventDefault()
                handleRemove()
              }}
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('removeAction')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  )
}
