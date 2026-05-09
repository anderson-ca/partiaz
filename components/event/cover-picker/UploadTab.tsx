'use client'

import Image from 'next/image'
import { useRef, useState, useTransition } from 'react'
import { Loader2, Upload } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { uploadCoverImage } from '@/app/actions/upload-cover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

type UploadState =
  | { kind: 'idle' }
  | { kind: 'previewing'; file: File; previewUrl: string }
  | { kind: 'pending' }
  | { kind: 'error'; messageKey: 'tooLarge' | 'badType' | 'network' }

type UploadTabProps = {
  onSelect: (uploadedUrl: string) => void
}

export function UploadTab({ onSelect }: UploadTabProps) {
  const t = useTranslations('coverPicker')
  const tCommon = useTranslations('common')
  const [state, setState] = useState<UploadState>({ kind: 'idle' })
  const [isDragging, setIsDragging] = useState(false)
  const [pending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  function validate(file: File): UploadState {
    if (file.size > MAX_BYTES) return { kind: 'error', messageKey: 'tooLarge' }
    if (!ALLOWED_MIME.includes(file.type))
      return { kind: 'error', messageKey: 'badType' }
    return { kind: 'previewing', file, previewUrl: URL.createObjectURL(file) }
  }

  function handleFile(file: File | undefined) {
    if (!file) return
    if (state.kind === 'previewing') URL.revokeObjectURL(state.previewUrl)
    setState(validate(file))
  }

  function handleUpload() {
    if (state.kind !== 'previewing') return
    const file = state.file
    setState({ kind: 'pending' })
    startTransition(async () => {
      const formData = new FormData()
      formData.set('file', file)
      const result = await uploadCoverImage(formData)
      if (result.ok) {
        onSelect(result.url)
        setState({ kind: 'idle' })
      } else {
        const messageKey =
          result.error === 'too_large'
            ? 'tooLarge'
            : result.error === 'bad_type'
              ? 'badType'
              : 'network'
        setState({ kind: 'error', messageKey })
      }
    })
  }

  return (
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
          handleFile(e.dataTransfer.files[0])
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
          onChange={(e) => handleFile(e.target.files?.[0] ?? undefined)}
        />
      </label>

      {state.kind === 'previewing' && (
        <div className="space-y-2">
          <div
            className="relative w-full overflow-hidden rounded-lg border border-white/10"
            style={{ aspectRatio: '16 / 9' }}
          >
            {/* unoptimized: blob: URLs aren't served by next/image's optimizer */}
            <Image
              src={state.previewUrl}
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
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {pending ? tCommon('loading') : t('uploadButton')}
          </Button>
        </div>
      )}

      {state.kind === 'pending' && (
        <p className="flex items-center gap-2 text-sm text-white/70">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('uploading')}
        </p>
      )}

      {state.kind === 'error' && (
        <p className="text-sm text-rose-400" role="alert">
          {t(`errors.${state.messageKey}`)}
        </p>
      )}
    </div>
  )
}
