import { Navbar } from '@/components/navigation/Navbar'

// Wraps every route OUTSIDE the (auth) group with the global navbar. Login
// pages live under `[locale]/(auth)/...` and don't inherit this layout, so
// they render chrome-free.

export default function WithNavLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar />
      {children}
    </>
  )
}
