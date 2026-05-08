import Image from 'next/image'
import { cn } from '@/lib/utils'

type CoverImageProps = {
  url: string | null
  alt?: string
  className?: string
  priority?: boolean
}

export function CoverImage({
  url,
  alt = '',
  className,
  priority = false,
}: CoverImageProps) {
  if (!url) return null

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-xl',
        className,
      )}
      style={{ aspectRatio: '16 / 9' }}
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
