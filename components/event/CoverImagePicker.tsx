'use client'

import Image from 'next/image'
import { useRef, useState, useTransition } from 'react'
import { Check, Trash2, Upload } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { uploadCoverImage } from '@/app/actions/upload-cover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { ResponsivePicker } from '@/components/event/ResponsivePicker'
import { COVER_LIBRARY } from '@/lib/cover-library'
import { cn } from '@/lib/utils'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export type CoverSource = 'library' | 'upload'

type CoverImagePickerProps = {
  currentUrl: string | null
  currentSource: CoverSource | null
  onChange: (url: string | null, source: CoverSource | null) => void
  trigger: React.ReactNode
}

type UploadState =
  | { kind: 'idle' }
  | { kind: 'previewing'; file: File; previewUrl: string }
  | { kind: 'pending' }
  | { kind: 'error'; messageKey: 'tooLarge' | 'badType' | 'network' }

export function CoverImagePicker({
  currentUrl,
  currentSource,
  onChange,
  trigger,
}: CoverImagePickerProps) {
  const t = useTranslations('coverPicker')
  const [open, setOpen] = useState(false)
  const [uploadState, setUploadState] = useState<UploadState>({ kind: 'idle' })
  const [isDragging, setIsDragging] = useState(false)
  const [pending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handlePickLibrary(url: string) {
    onChange(url, 'library')
    setOpen(false)
  }

  function handleRemove() {
    onChange(null, null)
    setOpen(false)
  }

  function validateFile(file: File): UploadState {
    if (file.size > MAX_BYTES) return { kind: 'error', messageKey: 'tooLarge' }
    if (!ALLOWED_MIME.includes(file.type))
      return { kind: 'error', messageKey: 'badType' }
    return { kind: 'previewing', file, previewUrl: URL.createObjectURL(file) }
  }

  function handleFileSelected(file: File | undefined) {
    if (!file) return
    if (uploadState.kind === 'previewing') {
      URL.revokeObjectURL(uploadState.previewUrl)
    }
    setUploadState(validateFile(file))
  }

  function handleUpload() {
    if (uploadState.kind !== 'previewing') return
    const file = uploadState.file
    setUploadState({ kind: 'pending' })

    startTransition(async () => {
      const formData = new FormData()
      formData.set('file', file)
      const result = await uploadCoverImage(formData)
      if (result.ok) {
        onChange(result.url, 'upload')
        setUploadState({ kind: 'idle' })
        setOpen(false)
      } else {
        const messageKey =
          result.error === 'too_large'
            ? 'tooLarge'
            : result.error === 'bad_type'
              ? 'badType'
              : 'network'
        setUploadState({ kind: 'error', messageKey })
      }
    })
  }

  function handleOpenChange(o: boolean) {
    setOpen(o)
    if (!o && uploadState.kind === 'previewing') {
      URL.revokeObjectURL(uploadState.previewUrl)
      setUploadState({ kind: 'idle' })
    }
  }

  return (
    <ResponsivePicker
      open={open}
      onOpenChange={handleOpenChange}
      trigger={trigger}
      title={t('pickCover')}
      // Cover slot lives in the right column of the editor — open the
      // popover toward the page-content side (left) so it doesn't push past
      // the rail / viewport edge.
      side="left"
      align="start"
    >
      <Tabs defaultValue="library" className="flex flex-1 flex-col">
        <TabsList className="mx-4 mt-3 grid w-auto grid-cols-2">
          <TabsTrigger value="library">{t('library')}</TabsTrigger>
          <TabsTrigger value="upload">{t('upload')}</TabsTrigger>
        </TabsList>

        {/* Library */}
        <TabsContent value="library" className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="grid grid-cols-2 gap-3 p-4 min-[480px]:grid-cols-3">
              {COVER_LIBRARY.map((cover) => {
                const isSelected =
                  currentSource === 'library' && currentUrl === cover.url
                return (
                  <button
                    key={cover.id}
                    type="button"
                    aria-label={cover.alt}
                    aria-pressed={isSelected}
                    onClick={() => handlePickLibrary(cover.url)}
                    className={cn(
                      'relative w-full overflow-hidden rounded-lg border border-white/10',
                      'transition hover:scale-[1.02]',
                      isSelected &&
                        'ring-2 ring-white ring-offset-2 ring-offset-zinc-900',
                    )}
                    style={{ aspectRatio: '16 / 9' }}
                  >
                    <Image
                      src={cover.url}
                      alt={cover.alt}
                      fill
                      sizes="(max-width: 480px) 50vw, 200px"
                      className="object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <span className="rounded-full bg-white/90 p-1 text-zinc-900">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Upload */}
        <TabsContent value="upload" className="flex-1 overflow-hidden">
          <div className="space-y-3 p-4">
            <label
              htmlFor="cover-file"
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                handleFileSelected(e.dataTransfer.files[0])
              }}
              className={cn(
                'flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed text-center transition',
                isDragging
                  ? 'border-white bg-white/5'
                  : 'border-white/30 hover:border-white/60',
              )}
            >
              <Upload className="mb-2 h-6 w-6 text-white/70" />
              <span className="px-4 text-sm text-white/70">
                {isDragging ? t('dropHere') : t('chooseFile')}
              </span>
              <input
                id="cover-file"
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_MIME.join(',')}
                className="sr-only"
                onChange={(e) =>
                  handleFileSelected(e.target.files?.[0] ?? undefined)
                }
              />
            </label>

            {uploadState.kind === 'previewing' && (
              <div className="space-y-2">
                <div
                  className="relative w-full overflow-hidden rounded-lg border border-white/10"
                  style={{ aspectRatio: '16 / 9' }}
                >
                  {/* unoptimized: blob: URLs aren't served by next/image's optimizer */}
                  <Image
                    src={uploadState.previewUrl}
                    alt=""
                    fill
                    sizes="100vw"
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleUpload}
                  disabled={pending}
                  className="w-full"
                >
                  {pending ? t('uploading') : t('uploadButton')}
                </Button>
              </div>
            )}

            {uploadState.kind === 'pending' && (
              <p className="text-sm text-white/70">{t('uploading')}</p>
            )}

            {uploadState.kind === 'error' && (
              <p className="text-sm text-red-400" role="alert">
                {t(`errors.${uploadState.messageKey}`)}
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {currentUrl && (
        <div className="border-t border-white/10 p-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleRemove}
            className="w-full gap-2 border-white/20 bg-transparent text-white hover:bg-white/10"
          >
            <Trash2 className="h-4 w-4" />
            {t('removeCover')}
          </Button>
        </div>
      )}
    </ResponsivePicker>
  )
}
