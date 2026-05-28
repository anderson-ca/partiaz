import { importLibrary, setOptions } from '@googlemaps/js-api-loader'

/**
 * Singleton loader for the Google Maps Places library. Repeated mounts
 * of components that need the SDK (today only LocationInput) share the
 * same Promise — the SDK script is fetched from Google's CDN at most
 * once per browser session.
 *
 * @googlemaps/js-api-loader v2 dropped the class-based `Loader` in
 * favor of `setOptions()` + `importLibrary()` functional exports.
 * setOptions() must be called before the first importLibrary() — we
 * gate that behind an `optionsSet` flag so repeated calls are no-ops.
 *
 * Caller responsibility: ensure 'Places API (New)' is enabled on the
 * Google Cloud project AND that the API key has appropriate referrer
 * restrictions. Without those, the SDK loads but fetch calls return 403.
 */

let placesPromise: Promise<typeof google.maps.places> | null = null
let optionsSet = false

export function loadPlacesLibrary(): Promise<typeof google.maps.places> | null {
  // No API key configured — return null so callers can render a
  // degraded fallback rather than crashing.
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) return null

  if (placesPromise) return placesPromise

  if (!optionsSet) {
    setOptions({ key: apiKey, v: 'weekly' })
    optionsSet = true
  }

  // PlacesLibrary contains AutocompleteSuggestion + AutocompleteSessionToken
  // + Place — surfaced by @types/google.maps. Caching the Promise prevents
  // repeated CDN fetches.
  placesPromise = importLibrary('places') as unknown as Promise<
    typeof google.maps.places
  >
  return placesPromise
}

// Soft regional bias for the AZ market — Baku city center, 50km radius.
// Hosts in Sumqayit / Ganja / abroad still get global results when their
// query is specific enough; this only re-ranks ambiguous queries toward
// Baku-area places. Coordinates verified against Wikipedia/Maps.
export const BAKU_LOCATION_BIAS: google.maps.places.LocationBias = {
  center: { lat: 40.4093, lng: 49.8671 },
  radius: 50_000,
}
