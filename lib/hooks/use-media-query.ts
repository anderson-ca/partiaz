'use client'

import { useEffect, useState } from 'react'

/**
 * SSR-safe matchMedia hook.
 *
 * On the server (and during the very first client render), `matches` is
 * `false`. The effect runs after mount and updates state to the real value,
 * triggering one re-render. This means desktop users see one frame of the
 * "false" branch on first paint — fine for hidden-by-default components like
 * pickers (which only become visible after a user click anyway), but worth
 * keeping in mind for layout that needs to be correct from byte 0.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const update = () => setMatches(mql.matches)
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [query])

  return matches
}
