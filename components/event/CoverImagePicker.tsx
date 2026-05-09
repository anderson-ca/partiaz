'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ResponsivePicker } from '@/components/event/ResponsivePicker'
import {
  LibraryTab,
  type CoverIllustration,
} from '@/components/event/cover-picker/LibraryTab'
import { GifsTab } from '@/components/event/cover-picker/GifsTab'
import { UploadTab } from '@/components/event/cover-picker/UploadTab'
import { cn } from '@/lib/utils'

export type CoverSource = 'illustration' | 'gif' | 'upload'

type CoverImagePickerProps = {
  illustrations: CoverIllustration[]
  currentUrl: string | null
  currentSource: CoverSource | null
  onChange: (url: string | null, source: CoverSource | null) => void
  trigger: React.ReactNode
}

export function CoverImagePicker({
  illustrations,
  currentUrl,
  currentSource,
  onChange,
  trigger,
}: CoverImagePickerProps) {
  const t = useTranslations('coverPicker')
  const tTabs = useTranslations('cover.tabs')
  const [open, setOpen] = useState(false)

  function handleSelect(url: string, source: CoverSource) {
    onChange(url, source)
    setOpen(false)
  }

  function handleRemove() {
    onChange(null, null)
    setOpen(false)
  }

  // The library tab is the natural default for new events: illustrations are
  // the lowest-friction option and the most-used path. If we ever change
  // that we can flip the default here without touching the tab components.
  return (
    <ResponsivePicker
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      title={t('pickCover')}
      side="left"
      align="start"
    >
      <Tabs defaultValue="library" className="flex flex-1 flex-col">
        <TabsList className="mx-4 mt-3 grid w-auto shrink-0 grid-cols-3 gap-1 rounded-full bg-white/5 p-1">
          <TabsTrigger
            value="library"
            className={cn(
              'rounded-full border-0 px-3 py-1.5 text-sm text-white/60 transition-all duration-150',
              'hover:bg-white/5 hover:text-white',
              'data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-none',
            )}
          >
            {tTabs('library')}
          </TabsTrigger>
          <TabsTrigger
            value="gifs"
            className={cn(
              'rounded-full border-0 px-3 py-1.5 text-sm text-white/60 transition-all duration-150',
              'hover:bg-white/5 hover:text-white',
              'data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-none',
            )}
          >
            {tTabs('gifs')}
          </TabsTrigger>
          <TabsTrigger
            value="upload"
            className={cn(
              'rounded-full border-0 px-3 py-1.5 text-sm text-white/60 transition-all duration-150',
              'hover:bg-white/5 hover:text-white',
              'data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-none',
            )}
          >
            {tTabs('upload')}
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="library"
          className="flex flex-1 flex-col overflow-hidden"
        >
          <LibraryTab
            illustrations={illustrations}
            selectedUrl={currentSource === 'illustration' ? currentUrl : null}
            onSelect={(url) => handleSelect(url, 'illustration')}
          />
        </TabsContent>

        <TabsContent
          value="gifs"
          className="flex flex-1 flex-col overflow-hidden"
        >
          <GifsTab onSelect={(url) => handleSelect(url, 'gif')} />
        </TabsContent>

        <TabsContent
          value="upload"
          className="flex flex-1 flex-col overflow-hidden"
        >
          <UploadTab onSelect={(url) => handleSelect(url, 'upload')} />
        </TabsContent>
      </Tabs>

      {currentUrl && (
        <div className="border-t border-white/10 p-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleRemove}
            className="w-full"
          >
            <Trash2 className="h-4 w-4" />
            {t('removeCover')}
          </Button>
        </div>
      )}
    </ResponsivePicker>
  )
}
