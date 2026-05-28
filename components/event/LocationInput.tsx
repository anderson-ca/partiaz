'use client'

import * as React from 'react'
import { MapPin, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { BAKU_LOCATION_BIAS, loadPlacesLibrary } from '@/lib/google-maps'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const DEBOUNCE_MS = 200

type LocationInputProps = {
  nameValue: string
  addressValue: string
  onChangeName: (next: string) => void
  onChangeAddress: (next: string) => void
}

// PlacesNamespace is what Loader.importLibrary('places') returns — the
// constructors we need are on it. Aliased for terser hook code below.
type PlacesNamespace = typeof google.maps.places

type SuggestionItem = {
  // The suggestion's main text (place name or street) + secondary
  // (locality/region). We render these as two-line entries.
  primary: string
  secondary: string
  // The opaque Place reference the New API uses for the follow-up
  // fetchFields() call. Carries the sessionToken implicitly.
  place: google.maps.places.Place
}

const INPUT_CLASS = cn(
  'w-full rounded-xl border border-border-default bg-surface-subtle px-3 py-2.5 pr-9 text-sm text-white',
  'placeholder:text-foreground-faint',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/40 focus-visible:border-brand-400/60',
)

export function LocationInput({
  nameValue,
  addressValue,
  onChangeName,
  onChangeAddress,
}: LocationInputProps) {
  const t = useTranslations('events.fields')
  const tLocation = useTranslations('events.fields.locationAutocomplete')

  // Display value priority: a saved formatted address from a prior
  // selection wins; falling back to nameValue covers events created with
  // the pre-[ui-7] two-input pattern where only the name was set.
  const initial = addressValue || nameValue
  const [query, setQuery] = React.useState(initial)
  const [suggestions, setSuggestions] = React.useState<SuggestionItem[]>([])
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)

  // Places SDK reference, populated post-mount. null while loading or
  // when the API key isn't configured — UI degrades to a plain input
  // in that case.
  const [places, setPlaces] = React.useState<PlacesNamespace | null>(null)
  const [sdkUnavailable, setSdkUnavailable] = React.useState(false)

  // Session token is the cost-control mechanism: every autocomplete
  // call sharing the same token is billed as $0 until the matching
  // fetchFields() call resolves and "spends" the session. Rotate on
  // every Clear / successful selection so subsequent searches don't
  // reuse a spent session token.
  const sessionTokenRef = React.useRef<
    google.maps.places.AutocompleteSessionToken | null
  >(null)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestIdRef = React.useRef(0)
  const containerRef = React.useRef<HTMLDivElement | null>(null)

  // Lazy-load Places lib on mount. Components that never mount this
  // (anything outside the editor) don't pay the SDK fetch cost.
  React.useEffect(() => {
    const promise = loadPlacesLibrary()
    if (!promise) {
      setSdkUnavailable(true)
      return
    }
    promise
      .then((ns) => {
        setPlaces(ns)
        sessionTokenRef.current = new ns.AutocompleteSessionToken()
      })
      .catch((err) => {
        // SDK load failed (network, quota, bad key) — degrade to plain
        // text input. The form still accepts free-form addresses.
        console.error('[LocationInput] Places SDK failed to load:', err)
        setSdkUnavailable(true)
      })
  }, [])

  // Dismiss dropdown on outside-click.
  React.useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function runAutocomplete(input: string) {
    if (!places || !sessionTokenRef.current) return
    if (input.trim().length === 0) {
      setSuggestions([])
      setOpen(false)
      return
    }
    const id = ++requestIdRef.current
    setPending(true)
    places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
      input,
      sessionToken: sessionTokenRef.current,
      locationBias: BAKU_LOCATION_BIAS,
    })
      .then(({ suggestions: raw }) => {
        // Drop stale responses — user may have typed more characters
        // since this request fired.
        if (id !== requestIdRef.current) return
        const mapped: SuggestionItem[] = []
        for (const s of raw) {
          const pred = s.placePrediction
          if (!pred) continue
          mapped.push({
            primary: pred.mainText?.toString() ?? pred.text?.toString() ?? '',
            secondary: pred.secondaryText?.toString() ?? '',
            place: pred.toPlace(),
          })
        }
        setSuggestions(mapped)
        setOpen(mapped.length > 0)
        setPending(false)
      })
      .catch((err) => {
        if (id !== requestIdRef.current) return
        console.error('[LocationInput] autocomplete failed:', err)
        setSuggestions([])
        setOpen(false)
        setPending(false)
      })
  }

  function handleChange(next: string) {
    setQuery(next)
    // Persist whatever the user types — even before they select. If
    // they save without picking a suggestion, the typed string becomes
    // the address (free-form fallback). Name field stays as whatever
    // was previously selected (or null for new events).
    onChangeAddress(next)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runAutocomplete(next), DEBOUNCE_MS)
  }

  function handleSelect(item: SuggestionItem) {
    if (!places || !sessionTokenRef.current) return
    setOpen(false)
    setPending(true)
    item.place
      .fetchFields({
        fields: ['displayName', 'formattedAddress'],
      })
      .then(() => {
        const name = item.place.displayName ?? ''
        const address = item.place.formattedAddress ?? ''
        setQuery(address)
        onChangeName(name)
        onChangeAddress(address)
        // Session token "spent" — next autocomplete starts a new billing
        // session. Constructor is on the namespace, not the instance.
        sessionTokenRef.current = new places.AutocompleteSessionToken()
        setPending(false)
      })
      .catch((err) => {
        console.error('[LocationInput] fetchFields failed:', err)
        setPending(false)
      })
  }

  function handleClear() {
    setQuery('')
    setSuggestions([])
    setOpen(false)
    onChangeName('')
    onChangeAddress('')
    if (places) {
      sessionTokenRef.current = new places.AutocompleteSessionToken()
    }
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-xs font-medium text-foreground-muted">
        <MapPin className="h-3.5 w-3.5" />
        {t('locationNameLabel')}
      </label>

      <div ref={containerRef} className="relative">
        <Input
          type="text"
          maxLength={500}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true)
          }}
          placeholder={
            sdkUnavailable
              ? t('locationAddressPlaceholder')
              : tLocation('searchPlaceholder')
          }
          aria-label={t('locationNameLabel')}
          className={INPUT_CLASS}
          autoComplete="off"
        />
        {query.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            aria-label={tLocation('clear')}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1 text-foreground-faint transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/40"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        {open && suggestions.length > 0 && (
          <ul
            role="listbox"
            className="absolute top-full right-0 left-0 z-30 mt-1 max-h-72 overflow-y-auto rounded-xl border border-border-subtle bg-surface-floating py-1 shadow-2xl backdrop-blur-xl"
          >
            {suggestions.map((s, idx) => (
              <li key={idx}>
                <button
                  type="button"
                  onClick={() => handleSelect(s)}
                  className="flex w-full flex-col gap-0.5 px-3 py-2 text-left transition-colors hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none"
                >
                  <span className="text-sm text-white">{s.primary}</span>
                  {s.secondary && (
                    <span className="text-xs text-foreground-subtle">
                      {s.secondary}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {pending && (
        <p className="text-[10px] text-foreground-faint">
          {tLocation('searching')}
        </p>
      )}
    </div>
  )
}
