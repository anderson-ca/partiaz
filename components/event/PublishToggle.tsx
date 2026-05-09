'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Globe } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { setEventStatus } from '@/app/actions/events'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { FLOATING_SURFACE } from '@/lib/ui/floating-surface'
import { cn } from '@/lib/utils'

type EventStatus = 'draft' | 'published' | 'canceled'

type PublishToggleProps = {
  /** create = no event saved yet; edit = an event row exists. */
  mode: 'create' | 'edit'
  /** Required when mode === 'edit'. */
  slug?: string
  /** Required when mode === 'edit'. */
  currentStatus?: EventStatus
}

export function PublishToggle({
  mode,
  slug,
  currentStatus,
}: PublishToggleProps) {
  const t = useTranslations('events.editor')
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  // ----- Mode = create: button disabled with hint ---------------------------
  if (mode === 'create') {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button type="button" variant="outline" disabled className="gap-2">
          <Globe className="h-4 w-4" />
          {t('makePublic')}
        </Button>
        <span className="text-xs text-white/60">{t('savedThenPublish')}</span>
      </div>
    )
  }

  // From here mode === 'edit' — slug + currentStatus are required.
  if (!slug || !currentStatus) return null

  // ----- Mode = edit + draft: AlertDialog confirm to publish ----------------
  if (currentStatus === 'draft') {
    return (
      <PublishConfirm
        slug={slug}
        pending={pending}
        onConfirm={(s) =>
          startTransition(async () => {
            const result = await setEventStatus(s, 'published')
            if (result.ok) {
              toast.success(t('publishSuccess'))
              router.refresh()
            } else {
              toast.error(t('publishError'))
            }
          })
        }
      />
    )
  }

  // ----- Mode = edit + published: Public pill with Popover revert option ----
  if (currentStatus === 'published') {
    return (
      <PublicPill
        slug={slug}
        pending={pending}
        onRevert={(s) =>
          startTransition(async () => {
            const result = await setEventStatus(s, 'draft')
            if (result.ok) {
              toast.success(t('unpublishSuccess'))
              router.refresh()
            } else {
              toast.error(t('publishError'))
            }
          })
        }
      />
    )
  }

  // canceled — no UI for v1
  return null
}

// ----- Sub-components ------------------------------------------------------

function PublishConfirm({
  slug,
  pending,
  onConfirm,
}: {
  slug: string
  pending: boolean
  onConfirm: (slug: string) => void
}) {
  const t = useTranslations('events.editor')
  const [open, setOpen] = useState(false)

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button type="button" className="gap-2">
          <Globe className="h-4 w-4" />
          {t('makePublic')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent
        className={cn(FLOATING_SURFACE, 'rounded-2xl sm:max-w-md')}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">
            {t('makePublicConfirmTitle')}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-white/70">
            {t('makePublicConfirmBody')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="border-white/20 bg-transparent text-white hover:bg-white/10"
            disabled={pending}
          >
            {t('makePublicCancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(e) => {
              e.preventDefault()
              onConfirm(slug)
              setOpen(false)
            }}
          >
            {t('makePublicConfirmAction')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function PublicPill({
  slug,
  pending,
  onRevert,
}: {
  slug: string
  pending: boolean
  onRevert: (slug: string) => void
}) {
  const t = useTranslations('events.editor')
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1.5 text-sm font-medium text-emerald-300 ring-1 ring-emerald-400/30 transition hover:bg-emerald-500/25"
        >
          <Globe className="h-3.5 w-3.5" />
          {t('publicLabel')}
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={8}
        className={cn(FLOATING_SURFACE, 'w-auto rounded-xl p-1')}
      >
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            onRevert(slug)
            setOpen(false)
          }}
          className="block w-full rounded-lg px-3 py-2 text-left text-sm text-white transition hover:bg-white/10 disabled:opacity-50"
        >
          {t('revertToDraft')}
        </button>
      </PopoverContent>
    </Popover>
  )
}
