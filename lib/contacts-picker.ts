import type { ParsedGuest } from './parse-contacts'
import { normalizePhone } from './phone'

// Web Contact Picker API (Android Chrome / Edge only; Chromium-only spec):
//   https://web.dev/articles/contact-picker
// Not in lib.dom yet, so we shape it ourselves.
type ContactInfo = {
  name?: string[]
  tel?: string[]
  email?: string[]
}

type ContactsManager = {
  select: (
    properties: Array<'name' | 'tel' | 'email'>,
    options?: { multiple?: boolean },
  ) => Promise<ContactInfo[]>
}

type NavigatorWithContacts = Navigator & {
  contacts?: ContactsManager
}

export function isContactsPickerSupported(): boolean {
  if (typeof window === 'undefined') return false
  const nav = navigator as NavigatorWithContacts
  return !!nav.contacts && typeof nav.contacts.select === 'function'
}

/**
 * Open the system contacts picker and return a normalized list. The picker
 * rejects on user denial OR cancellation — both are intentional UX outcomes
 * here, not errors, so we swallow the rejection and resolve `[]`. The caller
 * just stays on the tabs view.
 *
 * Phones are normalized through `normalizePhone` so the downstream review
 * screen can show `formatPhoneDisplay` output directly. Contacts with no
 * usable phone AND no email are dropped (the picker sometimes returns
 * label-only entries).
 */
export async function pickContacts(): Promise<ParsedGuest[]> {
  if (!isContactsPickerSupported()) return []
  const nav = navigator as NavigatorWithContacts

  let raw: ContactInfo[]
  try {
    raw = await nav.contacts!.select(['name', 'tel', 'email'], {
      multiple: true,
    })
  } catch {
    // Permission denied, picker cancelled, or any other rejection path.
    return []
  }

  const guests: ParsedGuest[] = []
  for (const c of raw) {
    const name = c.name?.[0]?.trim() || null
    const rawPhone = c.tel?.[0]?.trim()
    const phone = rawPhone ? normalizePhone(rawPhone) : null
    const email = c.email?.[0]?.trim().toLowerCase() || null
    if (!phone && !email) continue
    guests.push({ name, phone, email })
  }
  return guests
}
