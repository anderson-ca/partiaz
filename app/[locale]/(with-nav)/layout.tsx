import { Footer } from '@/components/navigation/Footer'
import { Navbar } from '@/components/navigation/Navbar'

// Wraps every route OUTSIDE the (auth) group with the global navbar +
// footer chrome. Login pages live under `[locale]/(auth)/...` and don't
// inherit this layout, so they render chrome-free.
//
// Sticky-footer flex pattern: `min-h-dvh` (mobile-safe dynamic viewport
// height, accounts for browser chrome show/hide) on the outer column;
// `flex-1` on the children wrapper fills the gap so the footer pins to
// the viewport bottom on short pages and to content bottom on long ones.
// Body's gradient bg from [ui-1] still paints behind everything.

export default function WithNavLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  )
}
