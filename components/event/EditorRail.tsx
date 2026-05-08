'use client'

import { Eye, Settings as SettingsIcon } from 'lucide-react'
import { toast } from 'sonner'
import { EffectThumbnail } from '@/components/event/EffectThumbnail'
import { ThemeBackground } from '@/components/event/ThemeBackground'
import { ThemePicker } from '@/components/event/ThemePicker'
import { EffectPicker, type EffectRowMin } from '@/components/event/EffectPicker'
import { cn } from '@/lib/utils'
import type { ThemeRow } from '@/lib/schemas/theme'

type EditorRailProps = {
  themes: ThemeRow[]
  effects: EffectRowMin[]
  selectedTheme: ThemeRow
  selectedEffect: EffectRowMin | null
  selectedColorOverride: string | null
  onSelectTheme: (themeId: string) => void
  onSelectColorOverride: (hex: string) => void
  onSelectEffect: (effectId: string | null) => void
}

export function EditorRail({
  themes,
  effects,
  selectedTheme,
  selectedEffect,
  selectedColorOverride,
  onSelectTheme,
  onSelectColorOverride,
  onSelectEffect,
}: EditorRailProps) {
  return (
    <div
      className={cn(
        'fixed z-30',
        // Mobile: bottom-right corner cluster
        'right-3 bottom-3',
        // Desktop: vertically centered against right edge
        'md:top-1/2 md:right-4 md:bottom-auto md:-translate-y-1/2',
      )}
    >
      <div className="flex flex-col gap-2 rounded-3xl bg-black/30 p-2 backdrop-blur-md">
        <ThemePicker
          themes={themes}
          selectedThemeId={selectedTheme.id}
          selectedColorOverride={selectedColorOverride}
          onSelectTheme={onSelectTheme}
          onSelectColor={onSelectColorOverride}
          trigger={
            <RailButton label="Theme" ariaLabel="Open theme picker">
              <div className="relative h-full w-full overflow-hidden rounded-full">
                <ThemeBackground
                  theme={selectedTheme}
                  colorOverride={selectedColorOverride ?? undefined}
                  className="absolute inset-0 z-0"
                />
              </div>
            </RailButton>
          }
        />

        <EffectPicker
          effects={effects}
          selectedEffectId={selectedEffect?.id ?? null}
          onSelectEffect={onSelectEffect}
          trigger={
            <RailButton label="Effect" ariaLabel="Open effect picker">
              <EffectThumbnail name={selectedEffect?.name ?? 'None'} />
            </RailButton>
          }
        />

        <RailIconButton
          label="Settings"
          icon={<SettingsIcon className="h-5 w-5" />}
          onClick={() => toast('Settings panel coming soon')}
        />

        <RailIconButton
          label="Preview"
          icon={<Eye className="h-5 w-5" />}
          onClick={() => toast('Preview mode coming soon')}
        />
      </div>
    </div>
  )
}

function RailButton({
  children,
  label,
  ariaLabel,
  ...props
}: {
  children: React.ReactNode
  label: string
  ariaLabel: string
} & React.ComponentProps<'button'>) {
  // Critical: spread `...props` onto the inner <button> so that when
  // SheetTrigger asChild clones this element, its onClick (and ref) reach
  // the actual DOM button. Without this, the picker never opens.
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      {...props}
      className="group flex w-16 flex-col items-center gap-1 focus-visible:outline-none"
    >
      <span className="block h-12 w-12 rounded-full ring-2 ring-white/0 transition group-hover:ring-white/40 group-focus-visible:ring-white/60">
        {children}
      </span>
      <span className="text-[10px] leading-tight text-white/80">{label}</span>
    </button>
  )
}

function RailIconButton({
  label,
  icon,
  onClick,
}: {
  label: string
  icon: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="group flex w-16 flex-col items-center gap-1 focus-visible:outline-none"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white ring-2 ring-white/0 transition group-hover:bg-white/20 group-hover:ring-white/40 group-focus-visible:ring-white/60">
        {icon}
      </span>
      <span className="text-[10px] leading-tight text-white/80">{label}</span>
    </button>
  )
}
