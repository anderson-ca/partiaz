'use client'

import * as React from 'react'
import { Loader2, UserPlus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  addCoHost,
  lookupCoHostByEmail,
  removeCoHost,
  type CoHostCandidate,
} from '@/app/actions/events'
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
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { FLOATING_SURFACE } from '@/lib/ui/floating-surface'
import { cn } from '@/lib/utils'

export type CoHost = {
  user_id: string
  display_name: string | null
  avatar_url: string | null
}

type CoHostManagerProps = {
  eventId: string
  primaryHostId: string
  currentUserId: string
  cohosts: CoHost[]
}

export function CoHostManager({
  eventId,
  primaryHostId,
  currentUserId,
  cohosts,
}: CoHostManagerProps) {
  const t = useTranslations('cohosts')
  const isPrimaryHost = currentUserId === primaryHostId

  return (
    <div className="space-y-3 rounded-2xl bg-black/30 p-4 ring-1 ring-white/10 backdrop-blur-md">
      <header className="space-y-1">
        <h3 className="text-sm font-medium text-white">{t('sectionTitle')}</h3>
        <p className="text-xs text-white/60">{t('sectionDescription')}</p>
      </header>

      {cohosts.length === 0 ? (
        <p className="text-xs text-white/40">{t('emptyState')}</p>
      ) : (
        <ul className="space-y-2">
          {cohosts.map((c) => (
            <CoHostRow
              key={c.user_id}
              eventId={eventId}
              cohost={c}
              isPrimaryHost={isPrimaryHost}
              isSelf={c.user_id === currentUserId}
            />
          ))}
        </ul>
      )}

      {isPrimaryHost && <AddCoHostDialog eventId={eventId} />}
    </div>
  )
}

// ─── Row + remove/leave confirm ────────────────────────────────────────────

function CoHostRow({
  eventId,
  cohost,
  isPrimaryHost,
  isSelf,
}: {
  eventId: string
  cohost: CoHost
  isPrimaryHost: boolean
  isSelf: boolean
}) {
  const t = useTranslations('cohosts')
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()

  // Only render an action button if the viewer has the right to remove this
  // row: primary host removes anyone, cohost removes themselves.
  const canActOnRow = isPrimaryHost || isSelf
  const isLeaveFlow = isSelf && !isPrimaryHost

  function handleConfirm() {
    startTransition(async () => {
      const result = await removeCoHost(eventId, cohost.user_id)
      if (!result.ok) {
        toast.error(t(`errors.${result.error}`))
        return
      }
      toast.success(isLeaveFlow ? t('leaveSuccess') : t('removeSuccess'))
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <li className="flex items-center gap-3">
      <Avatar
        src={cohost.avatar_url}
        name={cohost.display_name ?? '?'}
      />
      <span className="flex-1 truncate text-sm text-white">
        {cohost.display_name ?? '—'}
      </span>
      {canActOnRow && (
        <AlertDialog open={open} onOpenChange={setOpen}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpen(true)}
            className={
              isLeaveFlow
                ? 'text-white/70 hover:text-white'
                : 'h-8 w-8 p-0 text-white/50 hover:bg-white/10 hover:text-white'
            }
            aria-label={isLeaveFlow ? t('leaveConfirmAction') : t('removeConfirmAction')}
          >
            {isLeaveFlow ? t('leaveConfirmAction') : <X className="h-4 w-4" />}
          </Button>
          <AlertDialogContent
            className={cn(FLOATING_SURFACE, 'rounded-2xl sm:max-w-md')}
          >
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">
                {isLeaveFlow
                  ? t('leaveConfirmTitle')
                  : t('removeConfirmTitle', { name: cohost.display_name ?? '' })}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-white/70">
                {isLeaveFlow
                  ? t('leaveConfirmDescription')
                  : t('removeConfirmDescription')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel variant="outline" disabled={pending}>
                {t('cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={pending}
                onClick={(e) => {
                  e.preventDefault()
                  handleConfirm()
                }}
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLeaveFlow ? t('leaveConfirmAction') : t('removeConfirmAction')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </li>
  )
}

// ─── Add dialog (two-step: email lookup → preview → add) ───────────────────

function AddCoHostDialog({ eventId }: { eventId: string }) {
  const t = useTranslations('cohosts')
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [email, setEmail] = React.useState('')
  const [candidate, setCandidate] = React.useState<CoHostCandidate | null>(null)
  const [pending, startTransition] = React.useTransition()

  function reset() {
    setEmail('')
    setCandidate(null)
  }

  function handleSearch() {
    startTransition(async () => {
      const result = await lookupCoHostByEmail(eventId, email)
      if (!result.ok) {
        toast.error(t(`errors.${result.error}`))
        return
      }
      setCandidate(result.candidate)
    })
  }

  function handleAdd() {
    if (!candidate) return
    startTransition(async () => {
      const result = await addCoHost(eventId, email)
      if (!result.ok) {
        toast.error(
          t(`errors.${result.error}`, {
            name: candidate.display_name ?? '',
          }),
        )
        return
      }
      toast.success(t('addSuccess'))
      setOpen(false)
      reset()
      router.refresh()
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <UserPlus className="h-4 w-4" />
          {t('addButton')}
        </Button>
      </DialogTrigger>
      <DialogContent
        className={cn(FLOATING_SURFACE, 'rounded-2xl text-white sm:max-w-md')}
      >
        <DialogHeader>
          <DialogTitle>{t('dialogTitle')}</DialogTitle>
          <DialogDescription className="text-white/70">
            {t('dialogDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <input
            type="email"
            value={email}
            disabled={pending}
            onChange={(e) => {
              setEmail(e.target.value)
              if (candidate) setCandidate(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !candidate) {
                e.preventDefault()
                handleSearch()
              }
            }}
            placeholder={t('emailPlaceholder')}
            className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-400/40 disabled:cursor-not-allowed disabled:opacity-60"
          />

          {candidate && (
            <div className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5">
              <Avatar
                src={candidate.avatar_url}
                name={candidate.display_name ?? '?'}
              />
              <span className="flex-1 truncate text-sm text-white">
                {candidate.display_name ?? '—'}
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            {t('cancel')}
          </Button>
          {candidate ? (
            <Button type="button" onClick={handleAdd} disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('confirmAddButton')}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSearch}
              disabled={pending || !email.trim()}
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('searchButton')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Inline avatar (no separate primitive needed — same shape as the public
//      event page's HostAvatar, repeated here so this stays a self-contained
//      Client Component without crossing Server-component boundaries). ─────

function Avatar({ src, name }: { src: string | null; name: string }) {
  const initial = name.slice(0, 1).toUpperCase()
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className="h-8 w-8 shrink-0 rounded-full bg-black/20 object-cover ring-1 ring-white/15"
      />
    )
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-fuchsia-400 to-violet-600 text-xs font-semibold text-white ring-1 ring-white/15">
      {initial}
    </span>
  )
}
