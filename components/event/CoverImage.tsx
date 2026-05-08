import Image from 'next/image'
import { cn } from '@/lib/utils'

type CoverImageProps = {
  url: string | null
  alt?: string
  className?: string
  priority?: boolean
  /** CSS aspect-ratio, e.g. "1 / 1", "16 / 9", "4 / 5". Default 16:9. */
  aspect?: string
}

export function CoverImage({
  url,
  alt = '',
  className,
  priority = false,
  aspect = '16 / 9',
}: CoverImageProps) {
  if (!url) return null

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-xl',
        className,
      )}
      style={{ aspectRatio: aspect }}
    >
      <Image
        src={url}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 640px) 100vw, 800px"
        className="object-cover"
      />
    </div>
  )
}
